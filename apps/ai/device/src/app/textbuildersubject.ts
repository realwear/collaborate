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
