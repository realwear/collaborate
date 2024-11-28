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
import { Component, HostListener, Inject, isDevMode } from '@angular/core';
import { setTheme } from '@fluentui/web-components';
import { teamsDarkTheme, teamsLightTheme } from '@fluentui/tokens';
import { DeviceCode2Service } from '@rw/auth';
import { DOCUMENT } from '@angular/common';
import { detectColorScheme, getBuildProps } from '@nx/uxlib';
import { TranslateService } from '@ngx-translate/core';
import { CodeFetcher } from './code-fetcher';
import { datadogRum } from '@datadog/browser-rum';

declare let AndroidInterface: {
  getDeviceInformation: () => string;
  isDarkMode: () => boolean;
};

@Component({
  selector: 'nx-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'real365';

  readonly buildInfo: string;

  loaded = false;

  constructor(deviceCode: DeviceCode2Service, private codeFetcher: CodeFetcher, @Inject(DOCUMENT) document: Document, translateService: TranslateService) {
    this.buildInfo = getBuildProps();

    initDatadog();

    const isDark = document.defaultView ? detectColorScheme(document.defaultView) === 'dark' : false;
    // const isDark = true;

    const theme = isDark ? teamsDarkTheme : teamsLightTheme;

    setTheme(theme);

    // Set some CSS properties
    if (!isDark) {
      document.documentElement.style.setProperty('--microsoftLogoFont', '#737373');
    } else {
      document.documentElement.style.setProperty('--microsoftLogoFont', 'white');
    }

    deviceCode.fetchAccessTokenForGraph().then(
      () => {
        this.loaded = true;
      },
      () => {
        this.loaded = true;
      }
    );

    const languageOverride = sessionStorage.getItem('rw-lang');

    if (languageOverride) {
      translateService.use(languageOverride);
    } else {
      const language = navigator.language.split('-')[0];
      translateService.use(language);
    }
  }

  @HostListener('document:rwt_onPause')
  rwt_onPause() {
    this.codeFetcher.stop();
  }

  @HostListener('document:rwt_onResume')
  rwt_onResume() {
    this.codeFetcher.start();
  }
}

function initDatadog() {
  // No need to init datadog if in dev mode
  if (isDevMode()) {
    return;
  }

  // COMMENT THIS OUT FOR LOCAL TESTING
  if (window.location.origin.includes('localhost')) {
    return;
  }

  let deviceInformationStr: string;

  if (typeof AndroidInterface !== 'undefined') {
    deviceInformationStr = AndroidInterface.getDeviceInformation();
  } else {
    deviceInformationStr = 'null';
  }

  const thisEnv = window.location.origin.includes('localhost') ? 'Development' : 'Production';

  const deviceInfo = JSON.parse(deviceInformationStr);

  datadogRum.init({
    applicationId: 'af52b7c7-9229-44da-b97a-f44307a9c6f8',
    clientToken: 'pub5bf7e882244c34c8346805d102b9adbc',
    site: 'datadoghq.com',
    service: 'collaborate-web',
    env: thisEnv,
    version: getBuildProps(),
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: 'mask-user-input',
  });

  datadogRum.setGlobalContextProperty('firmwareVersion', deviceInfo.firmwareVersion);
  datadogRum.setGlobalContextProperty('manufacturer', deviceInfo.manufacturer);
  datadogRum.setGlobalContextProperty('model', deviceInfo.model);
  datadogRum.setGlobalContextProperty('release', deviceInfo.release);
  datadogRum.setGlobalContextProperty('sdkInt', deviceInfo.sdkInt);
}
