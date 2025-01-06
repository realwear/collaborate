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
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TokenFetcher } from './token-fetcher';
import { BehaviorSubject, Observable, catchError, distinctUntilChanged, filter, from, interval, map, of, shareReplay, switchMap, takeUntil } from 'rxjs';
import { UserInfoResponse, UserProfile } from './user-profile';
import { LocalStorageService } from './local-storage.service';
import { datadogRum } from '@datadog/browser-rum';

@Injectable()
export class DeviceCode2Service {
  readonly state$ = new BehaviorSubject<null | 'fetching_code' | 'pending' | 'error'>(null);

  private readonly tokenFetcher: TokenFetcher;

  readonly tokenFetchError$ = new BehaviorSubject<boolean>(false);

  readonly pending$: Observable<boolean>;

  readonly userCode$ = new BehaviorSubject<string>('');

  readonly isLoggedIn$: Observable<boolean>;

  readonly isRefreshing$: Observable<boolean>;

  readonly userInfo$: Observable<UserInfoResponse | null>;
  readonly name$: Observable<string | null>;
  readonly email$: Observable<string | null>;

  readonly userProfile$: Observable<UserProfile | null>;

  constructor(private httpClient: HttpClient, storageService: LocalStorageService) {
    this.tokenFetcher = new TokenFetcher(httpClient, storageService);

    this.isRefreshing$ = this.tokenFetcher.isRefreshing$;

    this.pending$ = this.state$.pipe(map((j) => j === 'pending' || j === 'fetching_code'));

    this.isLoggedIn$ = this.tokenFetcher.isLoggedIn$;

    this.userProfile$ = this.isLoggedIn$.pipe(
      switchMap((i) => {
        if (!i) {
          return of(null);
        }

        return from(this.fetchAccessTokenForGraph()).pipe(
          map((token) => {
            return new UserProfile(of(token), httpClient);
          })
        );
      }),
      shareReplay()
    );

    this.userInfo$ = this.userProfile$.pipe(
      switchMap((profile) => {
        if (!profile) {
          return of(null);
        }

        return profile.userInfo$;
      })
    );

    this.name$ = this.userProfile$.pipe(
      switchMap((profile) => {
        if (!profile) {
          return of(null);
        }

        return profile.userName$;
      }),
      distinctUntilChanged()
    );

    this.email$ = this.userInfo$.pipe(
      map((profile) => {
        if (!profile) {
          return null;
        }

        return profile.email;
      }),
      distinctUntilChanged()
    );
  }

  signout() {
    this.tokenFetcher.clearAll();

    // No more error
    this.tokenFetchError$.next(false);

    // TODO - Wipe the storage
  }

  getIdToken(): string | null {
    return this.tokenFetcher.idToken;
  }

  fetchAccessToken(scopes: string[], force = false): Promise<string> {
    return this.tokenFetcher.getAccessToken(scopes, force).then(
      (val) => {
        this.tokenFetchError$.next(false);
        return val;
      },
      (e) => {
        this.tokenFetchError$.next(true);
        throw e;
      }
    );
  }

  fetchAccessTokenForAcs(): Promise<string> {
    return this.fetchAccessToken([
      'https://auth.msft.communication.azure.com/Teams.ManageCalls',
      'https://auth.msft.communication.azure.com/Teams.ManageChats',
    ]);
  }

  fetchAccessTokenForGraph(): Promise<string> {
    return this.fetchAccessToken(['User.Read']);
  }

  fetchAccessTokenForCalendar(): Promise<string> {
    return this.fetchAccessToken(['Calendars.Read']);
  }

  start(...scope: string[]) {
    // Do nothing if already started or errors
    if (this.state$.value === 'pending' || this.state$.value === 'fetching_code') {
      return;
    }

    localStorage.removeItem('guest');

    this.userCode$.next('');

    this.state$.next('fetching_code');

    const joinedScope = scope.join(' ');

    this.httpClient
      .post<DeviceCodeInitResponse>(
        '/api/auth/code2',
        {
          scope: joinedScope,
        },
        {
          headers: { 'x-rw-scope': joinedScope },
        }
      )
      .subscribe((val) => {
        this.state$.next('pending');

        this.userCode$.next(val.user_code);

        this.fetchCode(val.device_code, val.interval);
      });
  }

  abort() {
    this.state$.next(null);
  }

  private fetchCode(deviceCode: string, intervalSeconds: number) {
    if (intervalSeconds < 1) {
      intervalSeconds = 5;
    }

    if (intervalSeconds > 10) {
      intervalSeconds = 10;
    }

    const scope = ['User.Read', 'openid', 'profile'].join(' ');

    interval(intervalSeconds * 1000)
      .pipe(
        takeUntil(this.state$.pipe(filter((i) => i !== 'pending'))),
        switchMap(() =>
          this.httpClient
            .post<FullDeviceCodeResponse>(
              '/api/auth/token2',
              {
                device_code: deviceCode,
                scope,
              },
              {
                headers: {
                  'x-rw-scope': scope,
                  'x-rw-device-code': deviceCode,
                },
              }
            )
            .pipe(
              catchError((e) => {
                if (e instanceof HttpErrorResponse) {
                  if (e.status === 400) {
                    return of<DeviceCodeErrorResponse>(e.error);
                  }
                }

                throw e;
              })
            )
        )
      )
      .subscribe({
        next: (val) => {
          if ('error' in val) {
            console.log(val.error);

            if (val.error !== 'authorization_pending') {
              this.state$.next('error');
            }

            return;
          }

          datadogRum.addAction('sign_in_success');

          this.tokenFetcher.storeAccessToken(val);

          this.state$.next(null); // Success, null out
        },
        error: () => {
          this.state$.next('error');
        },
        complete: () => {
          console.log('complete');
        },
      });
  }
}

type FullDeviceCodeResponse = TokenResponse | DeviceCodeErrorResponse;

interface DeviceCodeInitResponse {
  user_code: string;
  device_code: string;
  interval: number;
}

interface DeviceCodeErrorResponse {
  error: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
  scope: string;
}
