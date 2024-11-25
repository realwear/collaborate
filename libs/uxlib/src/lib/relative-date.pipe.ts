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
