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
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface TokenResponse {
  token: string;
  userId: string;
}

@Injectable({
  providedIn: 'root',
})
export class AcsTokenService {
  private tokenSubject = new BehaviorSubject<TokenResponse | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  tokenState$: Observable<TokenResponse | null> = this.tokenSubject.asObservable();
  loadingState$: Observable<boolean> = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  fetchToken(): void {
    this.loadingSubject.next(true);
    const url = '/api/acs/token';
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    this.http
      .post<TokenResponse>(url, {}, { headers })
      .pipe(
        tap((response: TokenResponse) => {
          this.tokenSubject.next(response);
          this.loadingSubject.next(false);
        }),
        catchError((error) => {
          console.error('Failed to fetch token', error);
          this.tokenSubject.next(null);
          this.loadingSubject.next(false);
          throw error;
        })
      )
      .subscribe();
  }
}
