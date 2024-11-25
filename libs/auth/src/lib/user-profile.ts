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
