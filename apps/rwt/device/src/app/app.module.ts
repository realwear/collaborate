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
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { AzAuthModule } from '@rw/auth';
import { HttpClientModule } from '@angular/common/http';
import { IntroComponent } from './intro/intro.component';
import { MeetingsComponent } from './meetings/meetings.component';
import { DialogModule } from '@angular/cdk/dialog';
import { UxlibModule } from '@nx/uxlib';
import { ConnectCodeComponent } from './connect-code/connect-code.component';
import { CodeFetcher } from './code-fetcher';
import { MeetingJoiner } from './meeting-joiner';
import { FluentButtonCustomComponent } from './fluent-button.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UpcomingMeetingComponent } from './upcoming-meeting/upcoming-meeting.component';
import { environment } from './environment/environment';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import * as translationsEnglish from './translations/en.json';
import * as translationsFrench from './translations/fr.json';
import * as translationsJapanese from './translations/ja.json';
import * as translationsSpanish from './translations/es.json';
import * as translationsGerman from './translations/de.json';
import { MeetingsEmptyComponent } from './meetings/meetings-empty.component';
import { IncomingMeetingDialogComponent } from './incoming-meeting-dialog/incoming-meeting-dialog.component';
import { FluentAvatarComponent } from './fluent-avatar.component';
import { ConnectivityLostHostComponent } from './connectivity-lost-dialog/connectivity-lost-dialog.component';

class CustomLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<unknown> {
    switch (lang) {
      case 'en':
        return of(translationsEnglish);
      case 'fr':
        return of(translationsFrench);
      case 'ja':
        return of(translationsJapanese);
      case 'es':
        return of(translationsSpanish);
      case 'de':
        return of(translationsGerman);
    }

    return of(null);
  }
}

@NgModule({
  declarations: [
    AppComponent,
    IntroComponent,
    MeetingsComponent,
    MeetingsEmptyComponent,
    ConnectCodeComponent,
    IncomingMeetingDialogComponent,
    FluentAvatarComponent,
  ],
  imports: [
    UxlibModule,
    BrowserModule,
    DialogModule,
    HttpClientModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(appRoutes),
    AzAuthModule.forRoot2(environment.azure.clientId, environment.azure.tenantId),
    FluentButtonCustomComponent,
    ConnectivityLostHostComponent,
    UpcomingMeetingComponent,
    TranslateModule.forRoot({
      loader: { provide: TranslateLoader, useClass: CustomLoader },
      defaultLanguage: 'en',
    }),
  ],
  providers: [CodeFetcher, MeetingJoiner],
  bootstrap: [AppComponent],
})
export class AppModule {}
