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
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { DeviceCode2Service, LoggedOutBaseComponent } from '@rw/auth';
import { CodeFetcher } from '../code-fetcher';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MeetingJoiner } from '../meeting-joiner';
import { DOCUMENT } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'nx-intro',
  templateUrl: './intro.component.html',
  styleUrl: './intro.component.scss',
})
export class IntroComponent extends LoggedOutBaseComponent implements OnInit, OnDestroy {
  readonly incomingCallSubscription: Subscription;

  constructor(
    private codeFetcher: CodeFetcher,
    router: Router,
    deviceCodeService: DeviceCode2Service,
    meetingJoiner: MeetingJoiner,
    matDialog: MatDialog,
    @Inject(DOCUMENT) private document: Document
  ) {
    super(router, deviceCodeService, matDialog);

    this.incomingCallSubscription = meetingJoiner.subscribeToIncomingCallRequest(codeFetcher.incomingCallRequest$);
  }

  ngOnInit(): void {
    this.codeFetcher.generateNewCode();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();

    this.incomingCallSubscription.unsubscribe();
  }

  override signin(): void {
    const graphScopes = ['User.Read', 'openid', 'profile', 'Calendars.Read'];

    this.deviceCodeService.start(...graphScopes);
  }
}
