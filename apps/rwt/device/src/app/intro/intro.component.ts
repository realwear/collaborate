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
