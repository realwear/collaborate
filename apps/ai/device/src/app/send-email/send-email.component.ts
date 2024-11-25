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
