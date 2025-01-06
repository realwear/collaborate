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
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CodeFetcher, ConnectCodeRequest } from './code-fetcher';
import { Dialog } from '@angular/cdk/dialog';
import { openIncomingMeetingDialog } from './incoming-meeting-dialog/incoming-meeting-dialog.component';
import { DeviceCode2Service } from '@rw/auth';
import { datadogRum } from '@datadog/browser-rum';

declare let AndroidInterface: {
  joinMeeting: (userToken: string, meetingLink: string, participantName: string | null, meetingName: string | null) => boolean;
  launchBarcodeReader: (callback: string) => boolean;
  getDeviceSerialNumber: () => string | null;
};

declare let ZoomAndroidInterface: {
  isZoomAvailable: () => boolean;
  launchZoomMeeting: (zoomMeetingUrl: string) => boolean;
};

@Injectable()
export class MeetingJoiner {
  constructor(private codeFetcher: CodeFetcher, private cdkDialog: Dialog, private deviceCodeService: DeviceCode2Service) {}

  joinMeeting(accessToken: string, meetingLink: string, participantName: string | null, meetingName: string) {
    if (typeof AndroidInterface === 'undefined') {
      console.error('AndroidInterface is not defined');
      return false;
    }

    if (!accessToken) {
      console.error('accessToken is not defined');
      return false;
    }

    const result = AndroidInterface.joinMeeting(accessToken, meetingLink, participantName, meetingName);

    return result;
  }

  isZoomAvailable() {
    if (typeof ZoomAndroidInterface === 'undefined') {
      console.error('ZoomAndroidInterface is not defined');
      return false;
    }

    return ZoomAndroidInterface.isZoomAvailable();
  }

  joinZoomMeeting(zoomMeetingUrl: string) {
    if (typeof ZoomAndroidInterface === 'undefined') {
      console.error('ZoomAndroidInterface is not defined');
      return false;
    }

    return ZoomAndroidInterface.launchZoomMeeting(zoomMeetingUrl);
  }

  private async onAnswerCall(request: ConnectCodeRequest) {
    let acsToken: string;

    const closeFn = (timeout: number) =>
      setTimeout(() => {
        this.codeFetcher.forceLoading$.next(false);
      }, timeout);

    const errorFn = () => {
      closeFn(3000);
    };

    try {
      acsToken = (await this.codeFetcher.fetchAcsToken())?.token;

      if (!acsToken?.length) {
        errorFn();
        return;
      }
    } catch {
      errorFn();
      return;
    }

    if (!this.joinMeeting(acsToken, request.meetingUrl, 'RealWear Navigator', request.meetingSubject)) {
      errorFn();
      return;
    }

    // Close in 10 seconds normally ...
    closeFn(10000);
  }

  // Subscribes to the incoming call request to provide a consistent UI for the incoming call dialog
  // The lifecycle for this is handled by the caller so it can be disposed of correctly
  subscribeToIncomingCallRequest(obs: Observable<ConnectCodeRequest>) {
    return obs.subscribe(async (request) => {
      datadogRum.addAction('incoming_call');

      this.codeFetcher.forceLoading$.next(true);

      const incomingDialogRef = openIncomingMeetingDialog(this.cdkDialog, {
        email: request.callerEmail,
        name: request.callerName,
        onAnswerCall: () => {
          this.onAnswerCall(request);
        },
      });

      incomingDialogRef.closed.subscribe(() => {
        this.codeFetcher.forceLoading$.next(false);
      });
    });
  }
}
