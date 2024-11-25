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
