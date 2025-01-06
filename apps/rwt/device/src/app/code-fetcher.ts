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
import { EventEmitter, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { exportSPKI, generateKeyPair, GenerateKeyPairResult, KeyLike, SignJWT } from 'jose';
import {
  BehaviorSubject,
  combineLatest,
  delay,
  delayWhen,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  from,
  interval,
  map,
  Observable,
  of,
  retry,
  startWith,
  Subscription,
  switchMap,
  tap,
} from 'rxjs';

@Injectable()
export class CodeFetcher {
  readonly state$ = new BehaviorSubject<null | 'connected' | 'connecting'>(null);

  readonly currentCode$ = new BehaviorSubject<IncomingCode | null>(null);

  readonly refreshingSoon$ = new BehaviorSubject<boolean>(false);
  readonly codeExpired$ = new BehaviorSubject<boolean>(false);

  readonly showLoading$: Observable<boolean>;

  private isActive$ = new BehaviorSubject<boolean>(false);

  private socket?: WebSocket;

  private keyPair?: GenerateKeyPairResult<KeyLike>;

  private kid?: string;

  private _refreshingSoonSub: Subscription;
  private _setupSub: Subscription;
  private _expiredSub: Subscription;
  private _pingSub: Subscription;

  // If true, the loading spinner will always display
  readonly forceLoading$ = new BehaviorSubject<boolean>(false);

  readonly incomingCallRequest$ = new EventEmitter<ConnectCodeRequest>();

  readonly initialized$ = new BehaviorSubject<boolean>(false);

  constructor(private httpClient: HttpClient, private snackbar: MatSnackBar, private translateService: TranslateService) {
    this._setupSub = this.createFullObs().subscribe();

    this._refreshingSoonSub = this.createRefreshingSoonObs().subscribe();

    this._pingSub = interval(20000).subscribe(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send('ping');
      }
    });

    this._expiredSub = this.currentCode$
      .pipe(
        delayWhen((code) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const expiryMs = msUntilExpiry(code);
          return of(null).pipe(delay(expiryMs));
        }),
        tap((code) => this.codeExpired$.next(!!code))
      )
      .subscribe();

    this.showLoading$ = combineLatest([this.state$, this.initialized$, this.codeExpired$, this.currentCode$, this.forceLoading$]).pipe(
      map(([state, initialized, codeExpired, currentCode, forceLoading]) => {
        if (forceLoading) {
          return true;
        }

        // If there's a code and it's not expired, don't show the loading spinner
        if (currentCode?.connectCode?.length && !codeExpired) {
          return false;
        }

        // If we haven't initialized yet or we're connecting, assume we are loading
        if (!initialized || !state || state === 'connecting') {
          return true;
        }

        return false;
      })
    );

    this.start();
  }

  dispose() {
    this._setupSub.unsubscribe();
    this._refreshingSoonSub.unsubscribe();
    this._expiredSub.unsubscribe();
    this._pingSub.unsubscribe();
  }

  /**
   * Generates an observable which emits to the refreshingSoon$ subject when the code is about to expire
   */
  private createRefreshingSoonObs() {
    return combineLatest([this.currentCode$, this.isActive$]).pipe(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      filter(([_, active]) => active),
      switchMap(([code]) =>
        of(code).pipe(
          // Reset the refreshing soon
          tap(() => this.refreshingSoon$.next(false)),

          tap(() => console.debug('Just Refreshed')),

          filter((code) => !!code),

          // Delay until 30 seconds before the expiry date
          delayWhen((code) => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const expiryMs = msUntilExpiry(code) - 30000;

            console.debug('Waiting for', expiryMs, 'ms before refreshing code');

            // Take off 30 seconds
            return of(null).pipe(delay(expiryMs));
          }),

          tap(() => this.refreshingSoon$.next(true)),

          tap(() => console.debug('Refreshing soon')),

          // Delay for another 5 seconds
          delay(5000),

          tap(() => console.debug('Refreshing now')),

          // Request a new code
          tap(() => this._generateNewCodeInternal())
        )
      )
    );
  }

  async fetchAcsToken() {
    const opts = {
      headers: {
        Authorization: `Bearer ${await this.generateJwt()}`,
      },
    };

    return await firstValueFrom(this.httpClient.post<{ token: string; userId: string }>('/api/provisioned/acstoken', null, opts));
  }

  /**
   * Create a main observer which sets up the key pair, registration and keeps the socket alive
   */
  private createFullObs() {
    return of(true).pipe(
      tap(() => this.state$.next('connecting')),
      switchMap(() => generateKeyPair('RS256').then((keyPair) => (this.keyPair = keyPair))),
      switchMap((keyPair) => this.createRegisteringObs(keyPair.publicKey)),
      tap(() => this.initialized$.next(true)),
      switchMap(() => this.isActive$),
      distinctUntilChanged(),
      // Every 5 seconds, make sure we have an active connection to the socket
      switchMap((active) =>
        !active
          ? of(null)
          : interval(5000).pipe(
              startWith(0),
              switchMap(async () => {
                if (!active) {
                  this.socket?.close();
                  return null;
                }

                // If the code has expired, kill the socket and start again

                const createNewSocket = !this.socket || this.socket.readyState === WebSocket.CLOSED;

                if (createNewSocket) {
                  this.socket = await this.createSocket();
                  this.state$.next('connecting');
                }

                return this.socket;
              }),
              distinctUntilChanged()
            )
      )
    );
  }

  private generateJwt() {
    return (
      new SignJWT({})
        .setProtectedHeader({ alg: 'RS256', kid: this.kid })
        .setIssuedAt()
        .setExpirationTime('5minute')
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        .sign(this.keyPair!.privateKey)
    );
  }

  generateNewCode() {
    console.log('Generating new code');

    if (this.socket?.readyState !== WebSocket.OPEN) {
      console.log('Socket not open, cannot generate new code');
      return;
    }

    console.log('Sending generate message');

    this.currentCode$.next(null);
    this._generateNewCodeInternal();
  }

  private _generateNewCodeInternal() {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      console.log('Socket not open, cannot generate new code');
      return;
    }

    this.socket?.send('generate');
  }

  start() {
    this.isActive$.next(true);

    console.log('Starting Code Fetcher');
  }

  stop() {
    // Make sure we don't refresh the socket anymore
    this.isActive$.next(false);

    // Disconnect from the socket
    this.socket?.close();

    // Clear the current code
    this.currentCode$.next(null);

    // Set the state to null
    this.state$.next(null);

    console.log('Stopping Code Fetcher');
  }

  private createRegisteringObs(publicKey: KeyLike) {
    return from(exportSPKI(publicKey)).pipe(
      switchMap((publicKeyExported) => this.httpClient.post<{ kid: string }>('/api/provisioned/register', publicKeyExported)),
      retry({ delay: 3000 }), // Retry every 3 seconds
      map((response) => response.kid),
      tap((kid) => (this.kid = kid))
    );
  }

  private async createSocket() {
    const jwtToken = await this.generateJwt();

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';

    const wssUrl = `${protocol}://${window.location.host}/api/provisioned/subscribe`;
    const s = new WebSocket(wssUrl, jwtToken);

    s.onmessage = (event) => {
      console.log('Message:', event.data);

      if (event.data === 'ready') {
        this._generateNewCodeInternal();
        return;
      }

      // Ignore a pong
      if (event.data === 'pong') {
        return;
      }

      // If the message doesn't start with { then it isn't JSON
      if (event.data[0] !== '{') {
        console.debug('Invalid message:', event.data);
        return;
      }

      try {
        const msg: IncomingCode | ConnectCodeRequest = JSON.parse(event.data);

        if ('connectCode' in msg) {
          this.currentCode$.next({
            connectCode: msg.connectCode,
            expiryDate: new Date(msg.expiryDate),
          });
        }

        if ('callerName' in msg) {
          // This is a request for a connect code
          // We should generate a new code and send it back
          this.incomingCallRequest$.emit(msg);

          // Generate a new code and expire the old one immediately
          this.generateNewCode();
        }
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };

    s.onclose = (event) => {
      console.log('Disconnected from code generation service');

      if (event.code === 3000) {
        this.snackbar.open(this.translateService.instant('invalid_date'), undefined, {
          duration: 10000,
        });
      }

      this.state$.next(null);
    };

    s.onopen = () => {
      console.log('Connect to Code Generation Service');

      this.state$.next('connected');
    };

    s.onerror = (err) => {
      console.error('Error Type: ' + err.toString());
      console.error('Socket error:', err);
    };

    return s;
  }
}

function msUntilExpiry(code?: IncomingCode | null) {
  if (!code) {
    return 0;
  }

  const now = new Date();

  return code.expiryDate.getTime() - now.getTime();
}

export interface IncomingCode {
  connectCode: string;
  expiryDate: Date;
}

export interface ConnectCodeRequest {
  // The name of the user who initiated the call
  callerName: string;

  // The email of the user who initiated the call
  callerEmail: string;

  // The meeting code for the call (usually the Join URL)
  meetingUrl: string;

  // The subject of the meeting
  meetingSubject: string;
}
