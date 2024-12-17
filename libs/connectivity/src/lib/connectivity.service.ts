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
import { DOCUMENT } from '@angular/common';
import { HostListener, Inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, fromEvent, Observable, Subscription } from 'rxjs';

declare let AndroidInterface: {
  startConfigurator: () => void;
};

declare let LoadingAndroidInterface: {
  isWebViewUpToDate: () => boolean;
  updateWebView: () => void;
  webViewSize: () => number;
  downloadProgress: () => number;
  restartActivity: () => void;
};

@Injectable({
  providedIn: 'root',
})
export class ConnectivityService implements OnDestroy {
  readonly isOnline$: Observable<boolean>;
  readonly goOnlineSubscription: Subscription;
  readonly goOfflineSubscription: Subscription;

  constructor(@Inject(DOCUMENT) document: Document) {
    // The rwt_initial localstorage state is either true (online), false (offline), or null (use browser)
    const initial = localStorage.getItem('rwt_initial');
    let offlineEventToSubscribe: Observable<Event>;
    let onlineEventToSubscribe: Observable<Event>;

    if (initial === null || initial == undefined) {
      offlineEventToSubscribe = fromEvent(window, 'offline');
      onlineEventToSubscribe = fromEvent(window, 'online');
      this.isOnline$ = new BehaviorSubject<boolean>(navigator.onLine);
    } else {
      offlineEventToSubscribe = fromEvent(document, 'rwt_goOffline');
      onlineEventToSubscribe = fromEvent(document, 'rwt_goOnline');

      if (initial === 'false') {
        this.isOnline$ = new BehaviorSubject<boolean>(false);
      } else {
        this.isOnline$ = new BehaviorSubject<boolean>(true);
      }
    }

    this.goOfflineSubscription = offlineEventToSubscribe.subscribe(() => {
      if (this.isOnline) {
        (this.isOnline$ as BehaviorSubject<boolean>).next(false);
      }
    });

    this.goOnlineSubscription = onlineEventToSubscribe.subscribe(() => {
      if (!this.isOnline) {
        (this.isOnline$ as BehaviorSubject<boolean>).next(true);
      }
    });
  }

  isWebViewUpToDate() {
    if (typeof LoadingAndroidInterface === 'undefined' || LoadingAndroidInterface === null) {
      console.error('LoadingAndroidInterface is not defined');
      return true;
    }

    return LoadingAndroidInterface.isWebViewUpToDate();
  }

  webViewSize() {
    if (typeof LoadingAndroidInterface === 'undefined' || LoadingAndroidInterface === null) {
      console.error('LoadingAndroidInterface is not defined');
      return 0;
    }

    return LoadingAndroidInterface.webViewSize();
  }

  updateWebView() {
    if (typeof LoadingAndroidInterface === 'undefined' || LoadingAndroidInterface === null) {
      console.error('LoadingAndroidInterface is not defined');
      return 0;
    }

    return LoadingAndroidInterface.updateWebView();
  }

  downloadProgress() {
    if (typeof LoadingAndroidInterface === 'undefined' || LoadingAndroidInterface === null) {
      console.error('LoadingAndroidInterface is not defined');
      return 0;
    }

    return LoadingAndroidInterface.downloadProgress();
  }

  restartActivity() {
    if (typeof LoadingAndroidInterface === 'undefined' || LoadingAndroidInterface === null) {
      console.error('LoadingAndroidInterface is not defined');
      return true;
    }

    return LoadingAndroidInterface.restartActivity();
  }

  openConfigurator() {
    if (AndroidInterface === undefined) {
      console.error('AndroidInterface is not defined');
      return;
    }

    AndroidInterface.startConfigurator();
  }

  ngOnDestroy() {
    this.goOfflineSubscription.unsubscribe();
    this.goOnlineSubscription.unsubscribe();
  }

  get isOnline() {
    return (this.isOnline$ as BehaviorSubject<boolean>).value;
  }

  @HostListener('window:offline')
  @HostListener('document:rwt_goOffline')
  goOffline() {
    if (this.isOnline) {
      (this.isOnline$ as BehaviorSubject<boolean>).next(false);
    }

    console.debug('goOffline');
  }

  @HostListener('window:online')
  @HostListener('document:rwt_goOnline')
  goOnline() {
    if (!this.isOnline) {
      (this.isOnline$ as BehaviorSubject<boolean>).next(true);
    }

    console.debug('goOnline');
  }
}
