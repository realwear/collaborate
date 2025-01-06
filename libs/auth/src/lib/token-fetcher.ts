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
import { BehaviorSubject, distinctUntilChanged, firstValueFrom } from 'rxjs';
import { LocalStorageService } from './local-storage.service';

export class TokenFetcher {
  private _latestRefreshToken: string | null = null;
  private _idToken: string | null = null;

  private _accessTokens: InternalAccessToken[] = [];

  readonly isRefreshing$ = new BehaviorSubject<boolean>(false);

  readonly _isLoggedInInternal$ = new BehaviorSubject<boolean>(false);

  readonly isLoggedIn$ = this._isLoggedInInternal$.pipe(distinctUntilChanged());

  get idToken() {
    return this._idToken;
  }

  constructor(private httpClient: HttpClient, private storageService: LocalStorageService) {
    const storageResponse = storageService.getItem('rw-tokens2');

    if (!storageResponse) {
      return;
    }

    try {
      const storageData: StorageFormat = JSON.parse(storageResponse);

      this._latestRefreshToken = storageData.latestRefreshToken;
      this._idToken = storageData.idToken;
      this._accessTokens = storageData.accessTokens;

      this._isLoggedInInternal$.next(this._latestRefreshToken !== null);
    } catch (e) {
      console.error('Failed to load tokens from storage', e);
    }
  }

  clearAll() {
    this._latestRefreshToken = null;
    this._idToken = null;
    this._accessTokens = [];

    this.storageService.removeItem('rw-tokens2');

    this._isLoggedInInternal$.next(false);
  }

  loadRefreshToken(refreshToken: string) {
    this._latestRefreshToken = refreshToken;

    this.saveTokens();
  }

  storeAccessToken(tokenResponse: RefreshTokenResponse) {
    if (tokenResponse.refresh_token) {
      this._latestRefreshToken = tokenResponse.refresh_token;
    }

    if (tokenResponse.id_token) {
      this._idToken = tokenResponse.id_token;
    }

    this._accessTokens.push({
      rawToken: tokenResponse.access_token,
      expiresAt: Date.now() / 1000 + tokenResponse.expires_in,
      scopes: tokenResponse.scope.split(' '),
    });

    this.pruneAccessTokens();

    this.saveTokens();
  }

  private saveTokens() {
    this.storageService.setItem(
      'rw-tokens2',
      JSON.stringify({
        latestRefreshToken: this._latestRefreshToken,
        idToken: this._idToken,
        accessTokens: this._accessTokens,
      })
    );

    this._isLoggedInInternal$.next(true);
  }

  private pruneAccessTokens() {
    // Remove all expired access tokens
    const now = Date.now() / 1000;

    if (!this._accessTokens) {
      return;
    }

    const originalTokens = this._accessTokens.length;

    this._accessTokens = this._accessTokens.filter((token) => token.expiresAt > now);

    const prunedCount = originalTokens - this._accessTokens.length;

    if (prunedCount > 0) {
      console.debug('Pruned Access Tokens:', prunedCount);
    }
  }

  async getAccessToken(scopes: string[], force = false): Promise<string> {
    this.pruneAccessTokens();

    console.debug('Fetching Token for Scopes:', scopes);

    if (!force) {
      // Check if we have an access token that has the required scopes
      const foundTokens = this._accessTokens?.filter((token) => scopes.every((scope) => token.scopes?.includes(scope)));

      if (foundTokens?.length > 0) {
        return foundTokens[0].rawToken;
      }
    }

    // If we don't have an access token, try to refresh the token
    if (!this._latestRefreshToken) {
      throw new Error('No refresh token available');
    }

    const refreshToken = this._latestRefreshToken;

    this.isRefreshing$.next(true);

    try {
      const response = await this.callRefreshTokenEndpointInternal(refreshToken, scopes);
      this.storeAccessToken(response);
      return response.access_token;
    } finally {
      this.isRefreshing$.next(false);
    }
  }

  private async callRefreshTokenEndpointInternal(refreshToken: string, scopes: string[]) {
    const scope = scopes.join(' ');

    // Remove the last char from the refresh token to invalidate it
    // refreshToken = refreshToken.slice(0, -1);

    const response = await firstValueFrom(
      this.httpClient.post<RefreshTokenResponse>(
        '/api/auth/refresh2',
        {
          refresh_token: refreshToken,
          scope,
        },
        {
          headers: { 'x-rw-scope': scope, 'x-rw-refresh-token': refreshToken },
        }
      )
    );

    return response;
  }
}

interface InternalAccessToken {
  rawToken: string;

  expiresAt: number;

  scopes: string[];
}

interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
  scope: string;
}

interface StorageFormat {
  latestRefreshToken: string | null;
  idToken: string | null;
  accessTokens: InternalAccessToken[];
}
