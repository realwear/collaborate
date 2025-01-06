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
import { Inject, LOCALE_ID, Optional, Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

@Pipe({ name: 'relativeDate', pure: false })
export class RelativeDatePipe implements PipeTransform {
  constructor(@Inject(LOCALE_ID) private locale: string,
  @Optional() private translateService: TranslateService
  ) {}

  transform(value?: number | Date | string | null): string | null {
    if (!value) {
      return null;
    }

    // return this.getTranslatedValue('relative_date_minute', '1 minute');

    const dateValue = new Date(value);

    const dateNow = new Date();

    const minutesUntil = Math.round((dateValue.valueOf() - dateNow.valueOf()) / 1000 / 60);

    if (minutesUntil <= 0) {
      return this.getTranslatedValue('relative_date_now', 'now');
    }

    if (minutesUntil < 2) {
      return this.getTranslatedValue('relative_date_minute', '1 minute');
    }

    if (minutesUntil < 60) {
      return this.getTranslatedValue('relative_date_minutes', `${minutesUntil} minutes`, { minutesUntil });
    }

    // TODO - Does the time formatting need to change?

    return `${formatDate(dateValue, this.getTranslatedValue('relative_date_format', 'h:mm a'), this.locale)}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getTranslatedValue(key: string, defaultValue: string, interpolatedValue?: any): string {
    if (this.translateService) {
      return this.translateService.instant(key, interpolatedValue);
    }

    return defaultValue;
  }
}
