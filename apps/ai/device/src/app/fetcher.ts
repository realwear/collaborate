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
