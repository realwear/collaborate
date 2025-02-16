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
import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, interval, map, Observable, Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { UxlibModule } from '@nx/uxlib';
import { ConnectivityService } from '@rw/connectivity';

@Component({
  selector: 'app-webview-installer',
  standalone: true,
  imports: [CommonModule, TranslateModule, UxlibModule],
  templateUrl: './webview-installer.component.html',
  styleUrl: './webview-installer.component.scss',
})
export class WebViewInstallerComponent implements OnDestroy {
  private _state = new BehaviorSubject<'waiting_for_user' | 'downloading' | 'download_failed' | 'installing'>('waiting_for_user');
  readonly state$: Observable<'waiting_for_user' | 'downloading' | 'download_failed' | 'installing'> = this._state.asObservable();

  updateSize = 0;
  downloadProgress = 0;

  downloadSubscription?: Subscription;

  constructor(private connectivityService: ConnectivityService) {
    this.updateSize = this.connectivityService.webViewSize();
  }

  ngOnDestroy(): void {
    this.downloadSubscription?.unsubscribe();
  }

  update() {
    this.displayDownload();
    this.connectivityService.updateWebView();
  }

  private displayDownload() {
    this.downloadProgress = 0;
    this._state.next('downloading');

    this.downloadSubscription = interval(500)
      .pipe(map(() => this.connectivityService.downloadProgress()))
      .subscribe((progress) => {
        this.downloadProgress = progress;

        if (this.downloadProgress < 0) {
          this.downloadSubscription?.unsubscribe();
          this.downloadProgress = 0;
          this._state.next('download_failed');
        } else if (this.downloadProgress >= 1) {
          this.downloadSubscription?.unsubscribe();
          this.downloadProgress = 1;
          this.displayInstall();
        }
      });
  }

  private displayInstall() {
    this._state.next('installing');
  }
}
