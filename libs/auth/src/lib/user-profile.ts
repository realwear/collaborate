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
import { HttpClient } from "@angular/common/http";
import { Observable, catchError, combineLatest, distinctUntilChanged, from, map, of, shareReplay, switchMap, tap } from "rxjs";

export class UserProfile {

  readonly userInfo$: Observable<UserInfoResponse | null>;
  readonly userProfile$: Observable<MyProfileResponse | null>;
  readonly userId$: Observable<string | null>;
  readonly userName$: Observable<string | null>;

  constructor(private accessToken$: Observable<string | null>, private httpClient: HttpClient) {
    this.userInfo$ = this.createUserInfoObs();
    this.userProfile$ = this.getMyProfile();
    this.userId$ = this.userProfile$.pipe(
      map((p) => p?.id || null)
    );

    this.userName$ = this.userInfo$.pipe(
      map((profile) => {
        return profile?.given_name || profile?.name || null;
      })
    );
  }

  private createUserInfoObs() {
    return this.accessToken$.pipe(
      distinctUntilChanged(),
      switchMap((accessToken) => {
        if (!accessToken) {
          return of(null);
        }

        return this.httpClient.get<UserInfoResponse>('https://graph.microsoft.com/oidc/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }),
      catchError(() => of(null)),
      shareReplay(1)
    );
  }

  getProfilePicture(): Observable<Blob | null> {
    return this.userInfo$.pipe(
      switchMap((info) => combineLatest([of(info), this.accessToken$])),
      switchMap(([info, accessToken]) => {
        if (!info?.picture || !accessToken) {
          return of(null);
        }

        const fetchRes = this.httpClient
          .get(info.picture, {
            responseType: 'blob',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })
          .pipe(tap((blob) => saveProfilePhoto(info.sub, blob)));

        return from(fetchProfilePhoto(info.sub)).pipe(
          switchMap((cached) => {
            if (cached) {
              return of(cached);
            }

            return fetchRes;
          })
        );
      }),
      shareReplay(1)
    );
  }

  private getMyProfile(): Observable<MyProfileResponse | null> {
    return this.accessToken$.pipe(
      distinctUntilChanged(),
      switchMap((token) => {
        if (!token) {
          return of(null);
        }

        return this.httpClient.get<MyProfileResponse>('https://graph.microsoft.com/v1.0/me', {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });
      }),
      shareReplay(1)
    );
  }
}

async function saveProfilePhoto(userId: string, blob: Blob) {
  const cache = await caches.open('profile-pictures');

  await cache.put(userId, new Response(blob));
}

async function fetchProfilePhoto(userId: string): Promise<Blob | null> {
  const cache = await caches.open('profile-pictures');

  const cached = await cache.match(userId);

  if (!cached) {
    return null;
  }

  return await cached.blob();
}

export interface MyProfileResponse {
  id: string;
}

export interface UserInfoResponse {
  sub: string;
  name: string;
  family_name: string;
  given_name: string;
  email: string;
  picture: string;
}
