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
