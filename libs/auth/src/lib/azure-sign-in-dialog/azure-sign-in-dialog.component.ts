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
import { Component, OnInit, Optional } from '@angular/core';
import { TalkerService } from '@rw/speech';
import { TranslateService } from '@ngx-translate/core';
import { DeviceCode2Service } from '../device-code2.service';

@Component({
  selector: 'rw-azure-sign-in-dialog',
  templateUrl: './azure-sign-in-dialog.component.html',
  styleUrl: './azure-sign-in-dialog.component.scss',
})
export class AzureSignInDialogComponent implements OnInit {
  get userCode$() {
    return this.deviceCodeService.userCode$;
  }

  get text_instruction() {
    return this.getValue('azuresignin_instruction', 'Navigate on your PC, Tablet or Smartphone to:');
  }

  get text_entercode() {
    return this.getValue('azuresignin_entercode', 'and enter the code:');
  }

  get text_cancel() {
    return this.getValue('cancel', 'Cancel');
  }

  constructor(private deviceCodeService: DeviceCode2Service, @Optional() private translate?: TranslateService, @Optional() private talker?: TalkerService) {
    //
  }

  ngOnInit() {
    this.talker?.reset();
    this.talker?.speakNext(getRandomLoginToTeamsPhrase());
  }

  cancel() {
    this.talker?.reset();

    this.deviceCodeService.abort();
  }

  getValue(key: string, defaultValue: string) {
    if (!this.translate) {
      return defaultValue;
    }

    const returnedValue = this.translate.instant(key);

    if (!returnedValue?.length || returnedValue === key) {
      return defaultValue;
    }

    return returnedValue;
  }
}

const loginToTeams = [
  'Please sign in to Microsoft to proceed. Go to microsoft.com/devicelogin and submit the provided code.',
  "To move forward, you must log into Microsoft. Please access microsoft.com/devicelogin and input the code you've been given.",
  'Sign into Microsoft to continue. Navigate to microsoft.com/devicelogin and enter your code.',
  'For further actions, please log in at Microsoft. Visit microsoft.com/devicelogin and use the code provided.',
  'To proceed, a Microsoft login is required. Go to microsoft.com/devicelogin and input the given code.',
];

export function getRandomLoginToTeamsPhrase() {
  return loginToTeams[Math.floor(Math.random() * loginToTeams.length)];
}
