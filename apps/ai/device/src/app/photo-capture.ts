/**
 * Copyright (C) 2024 RealWear, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
declare let AndroidInterface: {
  getPortNumber: () => number;
};

export async function takePhoto(): Promise<Blob | null> {
  let s: WebSocket | null = null;

  const port = AndroidInterface.getPortNumber();
  console.log('Port number:', port);

  try {
    s = new WebSocket('ws://localhost:' + port + '/takephoto');

    await waitForReady(s, 5000);

    const blob = await takePhotoInternal(s);

    return blob;
  } finally {
    s?.close();
  }
}

function waitForReady(socket: WebSocket, timeoutMs = 5000) {
  if (socket.readyState === WebSocket.OPEN) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    let timeoutId: unknown;

    const eListener: EventListenerObject = {
      handleEvent: () => {
        socket.removeEventListener('open', eListener);
        if (timeoutId) {
          clearTimeout(timeoutId as number);
        }
        resolve();
      },
    };

    socket.addEventListener('open', eListener);

    if (timeoutMs) {
      timeoutId = setTimeout(() => {
        socket.removeEventListener('open', eListener);
        reject('Timeout');
      }, timeoutMs);
    }
  });
}

function takePhotoInternal(socket: WebSocket, timeoutMs?: number): Promise<Blob | null> {
  if (socket.readyState !== WebSocket.OPEN) {
    throw new Error('Socket not open');
  }

  return new Promise((resolve, reject) => {
    let rejected = false;

    const timeoutId = timeoutMs
      ? setTimeout(() => {
          console.log('Take Photo Timeout Invoked');
          rejected = true;
          reject('Timeout');
        }, timeoutMs)
      : null;

    socket.onmessage = (event) => {
      if (rejected) {
        return;
      }

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (!event.data?.size) {
        resolve(null);
        return;
      }

      // If data is not blob, return null
      if (!(event.data instanceof Blob)) {
        resolve(null);
        return;
      }

      resolve(event.data);
    };

    socket.send('CAPTURE');
  });
}
