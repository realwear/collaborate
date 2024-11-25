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
import { Component, OnDestroy, OnInit, isDevMode } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { UxlibModule, getBuildProps } from '@nx/uxlib';
import { AzAuthModule, DeviceCode2Service } from '@rw/auth';
import { FaultReporterModule } from './fault-reporter/fault-reporter.module';
import { datadogRum } from '@datadog/browser-rum';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, combineLatest, distinctUntilChanged, map } from 'rxjs';
import { showReconnectingIfTrue } from './reconnecting-dialog/reconnecting-dialog.component';

declare let AndroidInterface: {
  getPortNumber(): number;
};

@Component({
  standalone: true,
  imports: [RouterModule, MatDialogModule, MatCardModule, CommonModule, UxlibModule, AzAuthModule, FaultReporterModule],
  selector: 'nx-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  readonly buildInfo = getBuildProps();

  readonly shouldReconnect$: Observable<boolean>;

  private shouldReconnectSub?: Subscription;

  constructor(private deviceCodeService: DeviceCode2Service, private httpClient: HttpClient, private dialog: MatDialog) {
    if (!isDevMode()) {
      this.initDatadog();
    }

    // We want to show the reconnection dialog if the user has an access token but it has expired
    this.shouldReconnect$ = combineLatest([this.deviceCodeService.isLoggedIn$, this.deviceCodeService.tokenFetchError$]).pipe(
      map(([isLoggedIn, tokenFetchError]) => {
        // If we're not logged in, we don't need to reconnect
        if (!isLoggedIn) {
          return false;
        }

        return tokenFetchError;
      }),
      distinctUntilChanged()
    );
  }

  ngOnInit(): void {
    this.shouldReconnectSub = showReconnectingIfTrue(this.shouldReconnect$, this.dialog);
  }

  ngOnDestroy(): void {
    this.shouldReconnectSub?.unsubscribe();
  }

  private initDatadog() {
    const thisEnv = window.location.origin.includes('localhost') ? 'Development' : 'Production';

    datadogRum.init({
      applicationId: '9721fef7-71dc-4adb-8d59-03bbd3a3bed6',
      clientToken: 'pubc5ca78c2bfc010c453353973c157d908',
      site: 'datadoghq.com',
      service: 'realwear-ai-demo',
      env: thisEnv,
      // Specify a version number to identify the deployed version of your application in Datadog
      version: this.buildInfo,
      sessionSampleRate: 100,
      // sessionReplaySampleRate: 20,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: 'mask-user-input',
    });

    // Fetch the random port number (default to 7341)
    let portNumber = 7341;

    if (typeof AndroidInterface !== 'undefined' && AndroidInterface.getPortNumber) {
      portNumber = AndroidInterface.getPortNumber();
    }

    this.httpClient.get<NativeDeviceInfo>(`http://localhost:${portNumber}/deviceInfo`).subscribe(
      (deviceInfo) => {
        console.log(deviceInfo);
        datadogRum.setGlobalContextProperty('firmwareVersion', deviceInfo.firmwareVersion);
        datadogRum.setGlobalContextProperty('manufacturer', deviceInfo.manufacturer);
        datadogRum.setGlobalContextProperty('model', deviceInfo.model);
        datadogRum.setGlobalContextProperty('release', deviceInfo.release);
        datadogRum.setGlobalContextProperty('sdkInt', deviceInfo.sdkInt);
      },
      () => {
        // If it fails, it's probably because we're not running on a RealWear device
        window.location.href = 'https://www.realwear.ai';
      }
    );

    this.deviceCodeService.userInfo$.pipe().subscribe((userInfo) => {
      if (!userInfo) {
        datadogRum.clearUser();
        return;
      }

      datadogRum.setUser({
        email: userInfo?.email,
      });
    });
  }
}

interface NativeDeviceInfo {
  firmwareVersion: string;
  manufacturer: string;
  model: string;
  release: string;
  sdkInt: number;
}
