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
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import * as translationsEnglish from '../translations/en.json';
import * as translationsFrench from '../translations/fr.json';
import * as translationsJapanese from '../translations/ja.json';
import * as translationsSpanish from '../translations/es.json';
import * as translationsGerman from '../translations/de.json';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';

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

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideAnimationsAsync(),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'en',
        loader: { provide: TranslateLoader, useClass: CustomLoader },
      })
    ),
  ],
};
