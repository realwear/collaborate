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
import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, ElementRef, Inject, OnDestroy, OnInit } from '@angular/core';
import { UxlibModule } from '@nx/uxlib';
import { BehaviorSubject, Observable, Subscription, combineLatest, defer, distinctUntilChanged, filter, map, race, switchMap, take, timer } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConnectivityService } from '@rw/connectivity';
import { Router } from '@angular/router';

type Nullable<T> = T | null | undefined;

@Component({
  standalone: true,
  imports: [UxlibModule, HttpClientModule, CommonModule, TranslateModule],
  providers: [ConnectivityService],
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss',
})
export class LoaderComponent implements OnInit, OnDestroy {
  title = 'loading';
  updateSize = 0;

  readonly state$: Observable<'error' | 'offline' | 'connecting'>;

  readonly pingUrl: Nullable<string>;
  readonly redirectUrl: string;
  readonly timeout: number;

  readonly forceError: boolean;

  readonly isError$ = new BehaviorSubject<boolean>(false);

  subscription?: Subscription;

  private readonly shouldRetrySub: Subscription;

  constructor(
    private httpClient: HttpClient,
    private connectivityService: ConnectivityService,
    private elementRef: ElementRef,
    private router: Router,
    translateService: TranslateService,
    @Inject(DOCUMENT) doc: Document
  ) {
    // If we're offline, then try again when we switch back to online
    this.shouldRetrySub = this.connectivityService.isOnline$
      .pipe(
        filter((isOnline) => !isOnline),
        take(1),
        switchMap(() => this.connectivityService.isOnline$),
        filter((isOnline) => isOnline),
        take(1)
      )
      .subscribe(() => this.tryAgain());

    // Fetch the ping url and redirect url from the query string
    const urlParams = new URLSearchParams(doc.defaultView?.location.search);

    this.pingUrl = urlParams.get('pingUrl') || 'https://f91blpjl-3333.euw.devtunnels.ms';

    this.redirectUrl = urlParams.get('redirectUrl') || 'https://f91blpjl-3333.euw.devtunnels.ms';

    this.forceError = urlParams.get('forceError') === 'true';

    const languageOverride = urlParams.get('lang') || null;

    this.timeout = parseTimeout(urlParams);

    // Get the browser language
    const browserLang = translateService.getBrowserLang();
    translateService.use(browserLang || 'en');

    if (languageOverride) {
      translateService.use(languageOverride);
    }

    this.state$ = combineLatest([this.connectivityService.isOnline$, this.isError$]).pipe(
      map(([isOnline, isError]) => {
        if (isError) {
          return 'error';
        }

        return isOnline ? 'connecting' : 'offline';
      }),
      distinctUntilChanged()
    );
  }

  ngOnInit(): void {
    // If we're offline, show the error and don't even try to navigate
    if (!this.connectivityService.isOnline) {
      return;
    }

    // If WebView is out of date, show the error and don't even try to navigate
    if (!this.connectivityService.isWebViewUpToDate()) {
      this.router.navigate(['/webview-installer']);
      return;
    }

    // If the ping url is not provided, redirect instantly
    if (!this.pingUrl) {
      window.location.replace(this.redirectUrl);
      return;
    }

    const MAX_WAIT = 30000;

    // Set a CSS property to the value of max_wait
    this.elementRef.nativeElement.style.setProperty('--max-wait', `${MAX_WAIT}ms`);

    let pingCall = defer(() => this.httpClient.get(this.pingUrl as string, { responseType: 'text' }));

    if (this.forceError) {
      // If forceError is set, return an error instead of making the request after 2 seconds
      pingCall = timer(10000).pipe(
        map(() => {
          throw new Error('Forced error');
        })
      );
    }

    this.subscription = race([pingCall, timer(MAX_WAIT).pipe(map(() => 'timeout'))]).subscribe({
      next: (value) => {
        if (value === 'timeout') {
          this.isError$.next(true);
          return;
        }

        window.location.replace(this.redirectUrl);
      },
      error: () => {
        this.isError$.next(true);
      },
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.shouldRetrySub.unsubscribe();
  }

  tryAgain() {
    this.connectivityService.restartActivity();
    this.isError$.next(false);
  }

  openConfigurator() {
    this.connectivityService.openConfigurator();
  }

  updateWebView() {
    this.connectivityService.updateWebView();
  }
}

function parseTimeout(params: URLSearchParams) {
  const timeout = params.get('timeout');

  if (typeof timeout == 'string') {
    try {
      return parseInt(timeout);
    } catch {
      //
    }
  }

  return 5000;
}

// TEST URL
// http://localhost:4205/?pingUrl=http:%2F%2Flocalhost:4200%2Findex.html&redirectUrl=http:%2F%2Flocalhost:4200%2Findex.html
