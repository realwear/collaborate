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
import { HttpClient } from '@angular/common/http';
import { Injectable, isDevMode } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
  distinctUntilChanged,
  filter,
  from,
  interval,
  lastValueFrom,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
  timer,
} from 'rxjs';
import { LocalStorageService } from './local-storage.service';
import { AuthState } from './auth-state';
import { auditWhen } from '@rw/rxjs';

// WARNING - Override these values to test the auto-reconnection dialog
// Make sure you set them back to 'true' and 'undefined' before committing
// Changing these values will make the unit tests fail
const shouldAutoRefresh = true;
const expiresInOverride = undefined;

export interface TokenRefresher {
  authState$: Observable<AuthState>;
  accessToken$: Observable<string | null>;
  idToken$: Observable<string | null>;
  expiresAt$: Observable<number | null>;
  isRefreshing$: Observable<boolean>;
  refreshToken$: Observable<string | null>;
  save: (val: TokenResponse, capturedAt: Date) => void;
  clear: () => void;
  load: () => void;
  refreshNow: () => Promise<void>;
  dispose: () => void;
}

export class TokenRefresher2Service implements TokenRefresher {

  static isInDebug() {
    return !shouldAutoRefresh || expiresInOverride !== undefined;
  }

  readonly authState$: Observable<AuthState>;

  readonly _refreshed$ = new Subject<void>();

  readonly loaded$ = new BehaviorSubject<boolean>(false);

  private _refreshingSub?: Subscription;

  readonly isRefreshing$ = new BehaviorSubject<boolean>(false);

  get isRefreshing() {
    return this.isRefreshing$.value;
  }

  constructor(private readonly deviceRefresh: RefreshTokenImpl, private readonly localStorageService: LocalStorageService, private readonly storageKey: string) {

    const tR = this._tokenResponse$.pipe(
      auditWhen(this.loaded$.pipe(map(val => !val))),
    );

    this.accessToken$ = tR.pipe(map((r) => r?.access_token || null), auditWhen(this.isRefreshing$), distinctUntilChanged());
    this.idToken$ = tR.pipe(map((r) => r?.id_token || null), auditWhen(this.isRefreshing$), distinctUntilChanged());
    this.refreshToken$ = tR.pipe(map((r) => r?.refresh_token || null), auditWhen(this.isRefreshing$), distinctUntilChanged());
    this.expiresAt$ = this.createExpiresAtObs();
    this.authState$ = this.createAuthStateObs();
  }

  dispose() {
    this._refreshingSub?.unsubscribe();
  }

  private createExpiresAtObs() {
    return this._tokenResponse$.pipe(
      map((val) => TokenResponseHelpers.timeInMillisecondsUntilExpiry(val)),
      map((val) => {
        if (val < 0) return 0;

        return val / 1000;
      }),
      distinctUntilChanged()
    );
  }

  private _tokenResponse$ = new BehaviorSubject<TokenResponseAndCaptured | null>(null);

  readonly accessToken$: Observable<string | null>;
  readonly refreshToken$: Observable<string | null>;
  readonly expiresAt$: Observable<number | null>;
  readonly idToken$: Observable<string | null>;

  save(tokenResponse: TokenResponse, captured_at: Date | undefined = undefined) {
    if (!tokenResponse) {
      this._tokenResponse$.next(null);
      this.localStorageService.removeItem(this.storageKey);
      return;
    }

    const newVal = {
      ...tokenResponse,
      captured_at: captured_at || new Date(),
    };

    if (isDevMode()) {
      console.debug('Saving New Token', newVal);
    }

    this._tokenResponse$.next(newVal);

    this.localStorageService.setItem(this.storageKey, JSON.stringify(newVal));
  }

  clear() {
    // Stop the refresh job
    this._refreshingSub?.unsubscribe();

    this._tokenResponse$.next(null);
    this.localStorageService.removeItem(this.storageKey);
  }

  private createAuthStateObs(): Observable<AuthState> {
    return this.loaded$.pipe(
      filter(val => val), // Only run if loaded
      distinctUntilChanged(), // Never trigger more than once
      shareReplay(1),
      switchMap(() => this._tokenResponse$),
      switchMap((val) => {

        // If not logged in at all, return null
        if (!val) {
          return of<AuthState>(null);
        }

        // If there's no refresh token then it's invalid
        if (!val.refresh_token) {
          return of<AuthState>('invalid');
        }

        // If it has actually expired (not nearly expired) then return expired
        if (TokenResponseHelpers.hasExpired(val, 0)) {
          return of<AuthState>('expired');
        }

        // Number of seconds until expiry
        const expiryMs = TokenResponseHelpers.timeInMillisecondsUntilExpiry(val);

        // Create a timer that will trigger when the token expires
        return timer(expiryMs).pipe(
          map<number, AuthState>(() => 'expired'),
          startWith<AuthState>('logged_in')
        );
      }),
      distinctUntilChanged()
    );
  }

  async load() {

    this._refreshingSub?.unsubscribe();

    if (shouldAutoRefresh) {
      this._refreshingSub = interval(5000).pipe(
        switchMap(() => this._tokenResponse$),
        filter(val => !!val && TokenResponseHelpers.hasExpired(val, 60 * 3)),
        switchMap(() => from(this.refreshNow()))
      ).subscribe();
    } else {
      console.debug("NOT AUTO REFRESHING");
    }

    const tokens = this.localStorageService.getItem(this.storageKey);

    if (!tokens) {
      console.debug('No token to load');
      this.loaded$.next(true);
      return;
    }

    this._tokenResponse$.next(JSON.parse(tokens));

    console.debug('Loaded Token', this._tokenResponse$.value);

    // Extract the expiry from the id_token
    const idToken = this._tokenResponse$.value?.id_token || null;
    if (idToken) {
      const payload = idToken.split('.')[1];
      const decoded = JSON.parse(atob(payload)); // Not deprecated, ignore NODE error
      const expiresAt = decoded.exp || null;
      console.debug('Expires At', expiresAt ? new Date(expiresAt * 1000) : null);
    }

    if (!this._tokenResponse$.value) {
      this.loaded$.next(true);
      return;
    }

    // Number of minutes until expiry
    const expiryMs = TokenResponseHelpers.timeInMillisecondsUntilExpiry(this._tokenResponse$.value);
    console.debug(`Minutes until token expiry ${Math.round(expiryMs / 1000 / 60)}`);

    // If not expired
    if (!TokenResponseHelpers.hasExpired(this._tokenResponse$.value)) {
      this.loaded$.next(true);
      return;
    }

    if (!shouldAutoRefresh) {
      console.debug("Token Expired, NOT AUTO REFRESHING");
      this.loaded$.next(true);
      return;
    }

    console.debug('Token Expired, Refreshing');

    // Refresh now
    try {
      await this.refreshNow();
      this.loaded$.next(true);
    }
    catch {
      this.loaded$.next(true);
    }
  }

  async refreshNow() {

    // If already refreshing
    if (this.isRefreshing) {
      return;
    }

    const refreshToken = this._tokenResponse$.value?.refresh_token || null;

    if (!refreshToken) {
      return;
    }

    this.isRefreshing$.next(true);

    try {
      const newTokenResponse = await this.deviceRefresh.refresh(refreshToken);

      // Log "Token refreshed with new expiry date"
      const newExpiry = new Date(new Date().getTime() + (newTokenResponse.expires_in || 0) * 1000);
      console.debug('Token Refreshed', newExpiry);

      this.save(newTokenResponse, new Date());
    } catch (e) {
      // Ignore
      console.debug('Token Refresh Failed', e);
    } finally {
      this.isRefreshing$.next(false);
    }

    // Trigger that the refresh has just happened
    this._refreshed$.next();
  }
}

/** Factory service to create TokenRefresher */
@Injectable()
export class TokenRefresherFactoryService {
  constructor(private httpClient: HttpClient, private localStorageService: LocalStorageService) {}

  /** Create a new TokenRefresher */
  createTokenRefresher(storageKey: string, refreshUrl: string): TokenRefresher {
    return new TokenRefresher2Service(new RefreshTokenImpl(this.httpClient, refreshUrl), this.localStorageService, storageKey);
  }
}

type TokenResponseAndCaptured = TokenResponse & {
  captured_at: Date | string | null;
};

export class TokenResponseHelpers {
  static timeInMillisecondsUntilExpiry(tokenResponse: TokenResponseAndCaptured | null) {
    if (!tokenResponse) {
      return -1;
    }

    if (!tokenResponse.captured_at || !tokenResponse.expires_in) {
      return -1;
    }

    const capturedAt = new Date(tokenResponse.captured_at).getTime();
    let expiresIn = tokenResponse.expires_in * 1000;

    // Fudge the expires_in
    if (expiresInOverride !== undefined) {
      expiresIn = expiresInOverride;
    }

    return capturedAt + expiresIn - Date.now();
  }

  static hasExpired(tokenResponse: TokenResponseAndCaptured, secondsDrift: number = 5 * 60) {
    return this.timeInMillisecondsUntilExpiry(tokenResponse) < secondsDrift * 1000;
  }

  static expFromToken(token: string): Date | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid token');
      const payload = parts[1];
      const decoded = JSON.parse(atob(payload));
      if (!decoded.exp) throw new Error('Expiration not found in token');

      console.log(decoded);

      if (isNaN(parseInt(decoded.exp, 10))) {
        throw new Error('Expiration is not a number');
      }

      return new Date(decoded.exp * 1000);
    } catch (e) {
      console.error(`Error processing token: ${e}`);
      return null;
    }
  }
}

class RefreshTokenImpl {
  constructor(private httpClient: HttpClient, private url: string) {}

  async refresh(refreshToken: string) {
    return await lastValueFrom(
      this.httpClient.post<TokenResponse>(
        this.url,
        {
          refresh_token: refreshToken,
        },
        {
          headers: {
            'x-rw-refresh-token': refreshToken || '',
          },
        }
      )
    );
  }

}

interface TokenResponse {
  access_token: string | null;
  refresh_token: string | null;
  id_token: string | null;
  expires_in: number | null;
  scope: string | null;
}
