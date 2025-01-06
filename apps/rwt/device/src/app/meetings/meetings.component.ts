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
import { HttpClient } from '@angular/common/http';
import { Component, HostBinding, HostListener, Input, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { distinctArray } from '@rw/rxjs';
import { DeviceCode2Service, UserProfile } from '@rw/auth';
import {
  Observable,
  catchError,
  distinctUntilChanged,
  filter,
  first,
  firstValueFrom,
  from,
  interval,
  map,
  of,
  race,
  shareReplay,
  startWith,
  switchMap,
  timer,
  Subscription,
} from 'rxjs';
import { MeetingJoiner } from '../meeting-joiner';
import { CodeFetcher } from '../code-fetcher';
import { NotifyDialogRef, openNotifyDialog } from '@nx/uxlib';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { openDialogOutDialog } from '../sign-out-dialog/sign-out-dialog.component';
import { Dialog } from '@angular/cdk/dialog';
import { datadogRum } from '@datadog/browser-rum';

@Component({
  selector: 'nx-meetings',
  templateUrl: './meetings.component.html',
  styleUrl: './meetings.component.scss',
})
export class MeetingsComponent implements OnDestroy {
  readonly hasLoaded$: Observable<boolean>;

  readonly noMeetings$: Observable<boolean>;

  readonly meetings$: Observable<UpcomingMeeting[]>;

  readonly userProfileImage$: Observable<SafeUrl | null>;

  readonly userName$: Observable<string | null>;

  private readonly _uProfile$: Observable<UserProfile>;

  private _activeNotifyDialog: NotifyDialogRef<unknown> | null = null;

  readonly incomingCallSubscription: Subscription;

  readonly isZoomAvailable: boolean;

  @HostBinding('class.loading') @Input() loading = false;

  constructor(
    private deviceCodeService: DeviceCode2Service,
    private httpClient: HttpClient,
    domSanitizer: DomSanitizer,
    private router: Router,
    private joiner: MeetingJoiner,
    private codeFetcher: CodeFetcher,
    private matDialog: MatDialog,
    private cdkDialog: Dialog,
    private translateService: TranslateService
  ) {
    this._uProfile$ = deviceCodeService.isLoggedIn$.pipe(
      filter((i) => i),
      first(),
      switchMap(() => from(deviceCodeService.fetchAccessTokenForGraph())),
      map((token) => {
        return new UserProfile(of(token), this.httpClient);
      })
    );

    this.userName$ = this._uProfile$.pipe(
      switchMap((profile) => profile.userName$),
      distinctUntilChanged(),
      startWith('')
    );

    this.userProfileImage$ = this._uProfile$.pipe(
      switchMap((profile) => profile.getProfilePicture()),
      map((blob) => {
        if (!blob) {
          return null;
        }

        return domSanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob));
      }),
      distinctUntilChanged()
    );

    this.meetings$ = this.createUpcomingMeetingObs()
      .pipe
      // delay(2000),
      // map(() => []) // Uncomment to test no meetings
      ();

    this.hasLoaded$ = this.meetings$.pipe(
      map(() => true),
      startWith(false),
      shareReplay(1)
    );

    this.noMeetings$ = this.meetings$.pipe(
      map((i) => i.length === 0),
      startWith(true),
      shareReplay(1)
    );

    this.incomingCallSubscription = joiner.subscribeToIncomingCallRequest(codeFetcher.incomingCallRequest$);

    this.isZoomAvailable = joiner.isZoomAvailable();
  }

  private closeDialog = () => {
    this._activeNotifyDialog?.dialogRef?.close();
  };

  ngOnDestroy(): void {
    this.incomingCallSubscription.unsubscribe();
  }

  @HostListener('document:rwt_onPause') private rwtOnPause() {
    this.closeDialog();
  }

  private async fetchAnonymousToken() {
    const acsToken = await this.codeFetcher.fetchAcsToken();

    return acsToken.token;
  }

  /**
   * DO NOT USE FOR NOW, WE'RE NOT CURRENTLY REQUESTING THIS PERMISSION
   */
  private async fetchUserToken() {
    try {
      const userGraphToken = await this.deviceCodeService.fetchAccessTokenForAcs();

      // Get the id token and find the oid
      const idToken = this.deviceCodeService.getIdToken();

      if (!idToken) {
        return null;
      }

      // Find the oid field in the payload
      const decoded = JSON.parse(atob(idToken.split('.')[1]));

      if (!decoded?.oid?.length) {
        return null;
      }

      const response = await firstValueFrom(
        this.httpClient.post<{ token: string; expiresOn: string }>('/api/acs/usertoken', {
          token: userGraphToken,
          oid: decoded.oid,
        })
      );

      return response;
    } catch {
      return null;
    }
  }

  async fetchUserNameWithTimeout(timeout: number) {
    // Zip Observable with a timer that will emit after the timeout
    const obs = race(this._uProfile$.pipe(switchMap((j) => j.userInfo$)), timer(timeout)).pipe(
      catchError(() => of(0)),
      first(),
      map((profileOrNumber) => {
        if (typeof profileOrNumber === 'number') {
          return null;
        }

        return profileOrNumber?.name;
      })
    );

    return firstValueFrom(obs);
  }

  async joinMeeting(meeting: UpcomingMeeting) {
    if (!meeting.joinLink) {
      return;
    }

    datadogRum.addAction('join_meeting');

    let acsToken: string | null = null;

    this._activeNotifyDialog = openNotifyDialog(
      this.matDialog,
      this.translateService.instant('meetings_dialog_title'),
      this.translateService.instant('meetings_dialog_message')
    );

    const nameToDisplay = await this.fetchUserNameWithTimeout(500);

    console.debug('Joining meeting', {
      nameToDisplay,
      meeting,
    });

    if (meeting.platform === 'zoom') {
      if (!this.joiner.isZoomAvailable()) {
        return;
      }

      this.joiner.joinZoomMeeting(meeting.joinLink);

      return;
    }

    try {
      acsToken = await this.fetchAnonymousToken();
    } catch {
      // Suppress, taken care of below
      console.debug('Unable to fetch ACS token');
    }

    // const token = await this.fetchUserToken(); // UNCOMMENT FOR USER TOKEN - DO NOT USE YET

    if (!acsToken || !this.joiner.joinMeeting(acsToken, meeting.joinLink, nameToDisplay || null, meeting.subject)) {
      this._activeNotifyDialog?.description$.next(this.translateService.instant('meetings_dialog_failed'));
      this._activeNotifyDialog?.hideDotty$.next(true);

      // Close the dialog in 3 seconds
      setTimeout(() => {
        this._activeNotifyDialog?.dialogRef?.close();
      }, 3000);
      return;
    }

    // Wait for 10 seconds
    setTimeout(() => {
      this._activeNotifyDialog?.dialogRef?.close();
    }, 10000);
  }

  async signout() {
    openDialogOutDialog(this.cdkDialog).closed.subscribe((result) => {
      if (result) {
        this.signOutInternal();
      }
    });
  }

  async signOutInternal() {
    this.deviceCodeService.signout();
    await this.router.navigate(['/login'], { skipLocationChange: true });
  }

  createUpcomingMeetingObs(): Observable<UpcomingMeeting[]> {
    const a = () =>
      from(this.deviceCodeService.fetchAccessTokenForCalendar()).pipe(
        switchMap((token) => {
          const dateFrom = new Date();

          const dateTo = new Date(dateFrom);
          dateTo.setHours(23, 59, 59, 999);

          const url = `https://graph.microsoft.com/v1.0/me/calendarview?startdatetime=${encodeURIComponent(
            dateFrom.toISOString()
          )}&enddatetime=${encodeURIComponent(dateTo.toISOString())}`;

          return this.httpClient
            .get<CalendarViewResponse>(url, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            .pipe(catchError(() => of({ value: [] })));
        }),
        map<CalendarViewResponse, UpcomingMeeting[]>((events) => {
          return events.value
            .sort((a, b) => {
              // Sort by start time
              return a.start.dateTime.localeCompare(b.start.dateTime);
            })
            .filter((i) => this.parseMeetingPlatform(i) !== null)
            .map((d) => ({
              subject: d.subject,
              startTime: parseDate(d.start.dateTime),
              organizer: d.organizer.emailAddress.name,
              joinLink: this.fetchMeetingLink(d),
              platform: this.parseMeetingPlatform(d),
            }));
        }),
        map((events) => {
          // Cap to 3
          return events.slice(0, 3);
        })
      );

    // 5 second interval
    return interval(5 * 1000).pipe(
      startWith(true),
      switchMap(() => a()),
      distinctArray(),
      shareReplay(1)
    );
  }

  private fetchMeetingLink(entry: CalendarViewEntry): string | null {
    const platform = this.parseMeetingPlatform(entry);

    if (platform === 'teams') {
      return entry.onlineMeeting.joinUrl;
    }

    if (platform === 'zoom') {
      return entry.location?.displayName;
    }

    return null;
  }

  private parseMeetingPlatform(entry: CalendarViewEntry): MeetingPlatform {
    const zoomRegex = /^https?:\/\/(?:\w+\.)?zoom\.(us|com)\//;

    if (this.isZoomAvailable && zoomRegex.test(entry.location?.displayName)) {
      return 'zoom';
    }

    if (entry.onlineMeetingProvider?.startsWith('teams')) {
      return 'teams';
    }

    return null;
  }
}

function parseDate(value: string) {
  // The date appears without timezone information but we know it's UTC. Create a date from this
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
}

interface CalendarViewResponse {
  value: CalendarViewEntry[];
}

interface CalendarViewEntry {
  isOnlineMeeting: boolean;
  isReminderOn: boolean;
  onlineMeetingProvider: string;
  subject: string;
  onlineMeeting: { joinUrl: string };
  start: { dateTime: string; timeZone: string };
  organizer: { emailAddress: { name: string } };
  location: { displayName: string };
}

interface UpcomingMeeting {
  subject: string;
  organizer: string;
  startTime: Date;
  joinLink: string | null;
  platform: MeetingPlatform;
}

type MeetingPlatform = 'teams' | 'zoom' | null;
