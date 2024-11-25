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
