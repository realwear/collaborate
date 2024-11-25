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
import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TokenResponse, AcsTokenService } from './acs-token.service';

declare let AndroidInterface: {
  joinMeeting: (userToken: string, meetingLink: string, participantName: string | null, meetingName: string | null) => boolean;
  launchBarcodeReader: (callback: string) => boolean;
  getDeviceSerialNumber: () => string | null;
};

interface AppWindow extends Window {
  barcodeReaderCallback: (result: string) => void;
}
declare let window: AppWindow;

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  meetingLink = '';
  userName = 'RealWear User';
  meetingName = 'RealWear Meeting';
  deviceSerialNumber = 'UNKNOWN';

  tokenResponse: TokenResponse | null = null;
  loading = false;

  constructor(private tokenService: AcsTokenService, private ngZone: NgZone) {}

  ngOnInit(): void {
    document.addEventListener('rwt_onResume', this.rwt_onResume);
    document.addEventListener('rwt_onPause', this.rwt_onPause);

    this.tokenService.tokenState$.subscribe((token) => (this.tokenResponse = token));
    this.tokenService.loadingState$.subscribe((loading) => (this.loading = loading));

    this.getDeviceSerialNumber();

    window.barcodeReaderCallback = (result: string) => {
      this.ngZone.run(() => {
        if (result.length > 0) {
          this.meetingLink = result;
        } else {
          console.error('No meeting link in QR code');
        }
      });
    };
  }

  ngOnDestroy(): void {
    document.removeEventListener('rwt_onResume', this.rwt_onResume);
    document.removeEventListener('rwt_onPause', this.rwt_onPause);
  }

  private rwt_onPause = () => {
    console.log('Activity paused');
  };

  private rwt_onResume = () => {
    console.log('Activity resumed');
  };

  fetchToken(): void {
    this.tokenService.fetchToken();
  }

  scanMeetingLink() {
    if (typeof AndroidInterface === 'undefined') {
      console.error('AndroidInterface is not defined');
      return;
    }

    if (AndroidInterface.launchBarcodeReader('barcodeReaderCallback')) {
      console.log('Barcode reader launched successfully');
    } else {
      console.error('Failed to launch barcode reader');
    }
  }

  connect() {
    if (typeof AndroidInterface === 'undefined') {
      console.error('AndroidInterface is not defined');
      return;
    }

    if (this.tokenResponse?.token) {
      if (AndroidInterface.joinMeeting(this.tokenResponse?.token, this.meetingLink, this.userName, this.meetingName)) {
        console.log('Meeting joined successfully');
      } else {
        console.error('Failed to join meeting');
      }
    } else {
      console.error('Token not available');
    }
  }

  getDeviceSerialNumber() {
    if (typeof AndroidInterface === 'undefined') {
      console.error('AndroidInterface is not defined');
      return;
    }

    this.deviceSerialNumber = AndroidInterface.getDeviceSerialNumber() || 'UNKNOWN';
  }
}
