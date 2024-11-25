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
