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
