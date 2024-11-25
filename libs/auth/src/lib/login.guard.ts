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
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { from, map, of, switchMap } from 'rxjs';
import { DeviceCode2Service } from './device-code2.service';

export function loginAuthGuard(introRouteUrl: string): CanActivateFn {
  return () => {
    const i = inject(DeviceCode2Service);
    const router = inject(Router);

    return i.isLoggedIn$.pipe(
      switchMap((i) => {
        if (i) {
          return of(i);
        }

        return from(router.navigateByUrl(introRouteUrl, { skipLocationChange: true })).pipe(map(() => false));
      })
    );
  };
}
