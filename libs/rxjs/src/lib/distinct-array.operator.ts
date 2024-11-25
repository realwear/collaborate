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

export function distinctArray<T>(): MonoTypeOperatorFunction<T[]> {
  return (source: Observable<T[]>) =>
    new Observable<T[]>((observer) => {
      let lastValue: T[] | undefined = undefined;

      return source.subscribe({
        next: (val) => {
          if (!lastValue) {
            lastValue = val;
            observer.next(val);
            return;
          }

          if (arraysDifferent(val, lastValue || [])) {
            lastValue = val;
            observer.next(val);
          }
        },
      });
    });
}

function arraysDifferent<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) {
    return true;
  }

  for (let i = 0; i < a.length; i++) {
    if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) {
      return true;
    }
  }

  return false;
}
