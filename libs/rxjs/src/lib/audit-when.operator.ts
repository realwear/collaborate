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
import { MonoTypeOperatorFunction, Observable } from 'rxjs';

/**
 * Emits the last value when the refreshing observable emits false.
 */
export function auditWhen<T>(refreshing$: Observable<boolean>): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) =>
    new Observable<T>((observer) => {
      let lastValue: T | undefined = undefined;
      let isRefreshing = false;

      const subscription = refreshing$.subscribe((val) => {
        isRefreshing = val;

        // If we're no longer refreshing and we have a previous value, then emit it
        if (!val && lastValue !== undefined) {
          observer.next(lastValue);
          lastValue = undefined;
          return;
        }
      });

      observer.add(subscription);

      return source.subscribe({
        next: (val) => {

          if (isRefreshing) {
            lastValue = val;
            return;
          }

          observer.next(val);
        },
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });
    });
}
