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
