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
