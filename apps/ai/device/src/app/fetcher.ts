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
import { HttpDownloadProgressEvent, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, OperatorFunction, filter, from, map, mergeMap } from 'rxjs';

export function splitToLines(): OperatorFunction<string | HttpEvent<string>, string> {
  return (source: Observable<string | HttpEvent<string>>) =>
    source.pipe(
      map((text) => {
        if (typeof text === 'string') {
          return text;
        }

        if (text.type === HttpEventType.DownloadProgress) {
          const partialText = (text as HttpDownloadProgressEvent).partialText || '';
          return partialText;
        }

        return '';
      }),
      mergeMap((text) => from(text?.split('\n') || '')),
      filter((line) => line.length > 0)
    );
}

export function mapToAssistantText(): OperatorFunction<string, string> {
  return (source: Observable<string>) =>
    source.pipe(
      map((line) => {
        // string the "data: " from the beginning
        if (!line.startsWith('data: ')) return '';

        const jStr = line.substring(6);

        if (!jStr.startsWith('{')) return '';

        try {
          const j = JSON.parse(jStr);

          const text = j.choices[0].delta.content;
          return text;
        } catch {
          return '';
        }
      }),
      filter((line) => line?.length > 0)
    );
}
