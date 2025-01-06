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
import { TextBuilderSubject } from './textbuildersubject';
import { EnvironmentProviders, Injectable, makeEnvironmentProviders } from '@angular/core';
import { mapToAssistantText, splitToLines } from './fetcher';
import { BehaviorSubject, Subscription, concatMap, map, timer } from 'rxjs';
import { OpenAIResponse, mapToOpenAIFunction } from '@nx/uxlib';
import { HttpClient, HttpDownloadProgressEvent, HttpEventType } from '@angular/common/http';

export class GPTSubject {
  readonly resettableSubject$ = new TextBuilderSubject();

  readonly fullValue$ = new BehaviorSubject<string | null>(null);

  readonly hasError$ = new BehaviorSubject<boolean>(false);

  readonly busy$ = new BehaviorSubject<boolean>(false);

  readonly pending$ = new BehaviorSubject<boolean>(false);

  private _subscription?: Subscription;

  get isEmpty() {
    return !this.fullValue$.value?.length && !this.busy$.value && !this.pending$.value;
  }

  get reset$() {
    return this.resettableSubject$.reset$;
  }

  constructor(private httpClient: HttpClient) {}

  clear() {
    this.resettableSubject$.reset();
    this.fullValue$.next(null);
    this.busy$.next(false);
    this.pending$.next(false);
    this.hasError$.next(false);

    this._subscription?.unsubscribe();
    this._subscription = undefined;
  }

  inject(text: string) {
    this.resettableSubject$.next(text);
    this.fullValue$.next(text);
  }

  /**
   * Starts a new request for GPTSubject.
   * @param messages
   */
  start(messages: unknown[]) {
    this._subscription?.unsubscribe();

    this.busy$.next(true);
    this.pending$.next(true);
    this.resettableSubject$.reset();

    // Construct the POST body
    const body = {
      messages,
      stream: true,
    };

    let previousText = '';

    const fetch$ = this.httpClient
      .post('/api/gpt/4o', body, {
        responseType: 'text',
        observe: 'events',
        reportProgress: true,
      })
      .pipe(
        map((evt) => {
          // Make sure we subtring any partial text we've already seen
          if (evt.type === HttpEventType.DownloadProgress) {
            const currentText = (evt as HttpDownloadProgressEvent).partialText || '';
            const newText = currentText.substring(previousText.length);
            previousText = currentText;
            return newText;
          }

          return evt;
        })
      );

    let lastEmission = Date.now();

    this._subscription = fetch$
      .pipe(
        splitToLines(),
        mapToAssistantText(),
        concatMap((value) => {
          const now = Date.now();
          const delayTime = Math.max(0, 25 - (now - lastEmission));
          lastEmission = now + delayTime;
          return timer(delayTime).pipe(map(() => value));
        })
      )
      .subscribe({
        next: (newSegment) => {
          // If waiting for the first segment ...
          if (this.pending$.value) {
            this.pending$.next(false);
          }

          if (!this.busy$.value) {
            this.busy$.next(true);
          }

          this.resettableSubject$.next(newSegment);
        },
        complete: () => {
          this.fullValue$.next(this.resettableSubject$.value || '');
          this.busy$.next(false);
        },
        error: (error) => {
          //
          this.hasError$.next(true);
          console.log(error);
        },
      });
  }
}

/**
 * This factory is used to create a new instance of GPTSubject. It is used for static fields in the app (like description or summary) where the value might change regularly.
 */
@Injectable()
export class GPTSubjectFactory {
  constructor(private httpClient: HttpClient) {}

  create() {
    return new GPTSubject(this.httpClient);
  }

  callGptFunction<T>(model: '35' | '4o', content: { tools: unknown[]; tool_choice: unknown; messages: unknown[] }) {
    return this.httpClient
      .post<OpenAIResponse>(`/api/gpt/${model}`, content, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .pipe(mapToOpenAIFunction<T>());
  }

  callGpt(systemMessage: string, userMessage: string, model: '35' | '4o' = '35') {
    return this.httpClient.post<OpenAIResponse>(
      `/api/gpt/${model}`,
      {
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ],
        stream: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export function provideGPTSupport(): EnvironmentProviders {
  return makeEnvironmentProviders([GPTSubjectFactory]);
}

export type OpenAIMessages = { role: 'system' | 'user'; content: string }[];
