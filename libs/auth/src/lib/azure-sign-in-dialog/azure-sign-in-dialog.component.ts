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
