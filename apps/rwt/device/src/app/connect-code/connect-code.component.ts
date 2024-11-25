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
import { Component, HostBinding, NgZone, OnDestroy } from '@angular/core';
import { CodeFetcher } from '../code-fetcher';
import { combineLatest, map, Observable, Subscription } from 'rxjs';

@Component({
  selector: 'nx-connect-code',
  templateUrl: './connect-code.component.html',
  styleUrl: './connect-code.component.scss',
})
export class ConnectCodeComponent implements OnDestroy {

  readonly currentCode$: Observable<string | null>;

  readonly refreshingSoonSub: Subscription;

  readonly showLoading$: Observable<boolean>;

  @HostBinding('class.refreshing') refreshingSoon = false;

  constructor(codeFetcher: CodeFetcher, zone: NgZone) {
    this.currentCode$ = combineLatest([ codeFetcher.currentCode$, codeFetcher.showLoading$ ]).pipe(
      map(([ connectCodeResponse, showLoading ]) => {
        if (!connectCodeResponse || showLoading) {
          return null;
        }

        return connectCodeResponse.connectCode;
      })
    );

    this.showLoading$ = codeFetcher.showLoading$;

    this.refreshingSoonSub = codeFetcher.refreshingSoon$.subscribe(refreshing => {
      zone.run(() => this.refreshingSoon = refreshing);
    });
  }

  ngOnDestroy() {
    this.refreshingSoonSub.unsubscribe();
  }
}
