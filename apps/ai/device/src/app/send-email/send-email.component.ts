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
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { UxlibModule } from '@nx/uxlib';
import { HttpClient } from '@angular/common/http';
import { UserInfoResponse, DeviceCode2Service } from '@rw/auth';

@Component({
  selector: 'nx-send-email',
  standalone: true,
  imports: [CommonModule, MatDialogModule, UxlibModule],
  templateUrl: './send-email.component.html',
  styleUrls: ['./send-email.component.scss'],
})
export class SendEmailComponent {
  readonly userInfo$: Observable<UserInfoResponse | null> | undefined;
  emailSent = false;
  emailError = false;
  isSending = false;

  constructor(private http: HttpClient, private deviceCode: DeviceCode2Service) {
    this.userInfo$ = this.deviceCode.userInfo$;
  }

  sendEmail() {
    console.log('send email');
    this.emailSent = false; // Reset the flag before sending email
    this.emailError = false;
    this.isSending = true; // Set the flag to indicate sending in progress

    if (this.userInfo$) {
      this.userInfo$.subscribe({
        next: (userInfo) => {
          if (userInfo) {
            this.http.post('/api/sendgrid/send-email', { userInfo }).subscribe({
              next: (data) => {
                console.log(data);
                this.emailSent = true; // Set the flag to true when email is successfully sent
                this.isSending = false; // Reset the sending flag
                // Optionally, you can close the dialog here if you only want to close on success
                // this.dialog.closeAll();
              },
              error: (error) => {
                console.log(error);
                this.emailError = true; // Set the flag to true if there is an error
                this.isSending = false; // Reset the sending flag
              },
              // complete: () => {
              //   // Optionally close the dialog in the complete handler
              //   // but only if there was an error
              //   if (this.emailSent || this.emailError) {
              //     this.dialog.closeAll();
              //   }
              // }
            });
          } else {
            console.log('No user info available');
            this.isSending = false; // Reset the sending flag
          }
        },
        error: (error) => {
          console.log('Error fetching user info', error);
          this.isSending = false; // Reset the sending flag
        },
      });
    }
  }
}
