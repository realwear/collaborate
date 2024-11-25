/**
 * Copyright (C) 2024 RealWear, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
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
