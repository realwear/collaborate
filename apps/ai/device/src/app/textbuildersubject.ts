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
import { Observable, Subject, Subscriber } from 'rxjs';

export class TextBuilderSubject extends Observable<string> {
  private _currentValue?: string;

  private _observers: Subscriber<string>[] = [];

  readonly reset$ = new Subject<void>();

  get value() {
    return this._currentValue;
  }

  constructor() {
    super((subscriber) => {
      this._observers.push(subscriber);

      if (this._currentValue) {
        subscriber.next(this._currentValue);
      }

      return () => {
        // Remove the subscriber
        const index = this._observers.indexOf(subscriber);
        if (index >= 0) {
          this._observers.splice(index, 1);
        }
      };
    });
  }

  next(value: string) {
    this._currentValue = (this._currentValue || '') + value;
    this._observers.forEach((observer) => observer.next(value));
  }

  reset() {
    this._currentValue = undefined;
    this.reset$.next();
  }
}
