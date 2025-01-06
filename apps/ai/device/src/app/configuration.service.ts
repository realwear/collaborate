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
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SelectConfigurationDialogComponent } from './select-configuration-dialog/select-configuration-dialog.component';
import { BehaviorSubject, Observable, distinctUntilChanged, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {
  private readonly _currentConfig$ = new BehaviorSubject<string | null>(null);

  readonly currentConfig$: Observable<string | null>;

  constructor(private dialog: MatDialog) {
    this.currentConfig$ = this._currentConfig$.pipe(
      map((code) => this.codeToName(code)),
      distinctUntilChanged()
    );

    this._currentConfig$.next(localStorage.getItem('rw-config'));
  }

  get reportLanguages(): string[] {
    const currentLanguages = localStorage.getItem('rw-report-languages');

    if (!currentLanguages?.length) {
      return ['en'];
    }

    return currentLanguages.split(',');
  }

  set reportLanguages(languages: string[]) {
    localStorage.setItem('rw-report-languages', languages.join(','));
  }

  codeToName(code: string | null): string | null {
    if (code === 'remcohein') {
      return 'heineken';
    }

    return null;
  }

  openConfigDialog() {
    this.dialog
      .open(SelectConfigurationDialogComponent, { data: this._currentConfig$.value })
      .afterClosed()
      .subscribe((config) => {
        if (config === undefined) {
          return;
        }

        this.setConfig(config);
      });
  }

  private setConfig(configCode: string | null) {
    configCode = configCode?.trim() || null;

    if (!configCode?.length) {
      localStorage.removeItem('rw-config');
    } else {
      localStorage.setItem('rw-config', configCode);
    }

    this._currentConfig$.next(configCode);
  }
}
