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
import { Component, CUSTOM_ELEMENTS_SCHEMA, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { HelpDialogData, HelpDialogType } from './dialog.types';

@Component({
  selector: 'app-help-dialog',
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
  standalone: true,
  imports: [CommonModule, MatDialogModule, TranslateModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HelpDialogComponent {
  public content = '';
  public title = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: HelpDialogData, private translate: TranslateService) {
    this.loadTranslations(data.type);
  }
  loadTranslations(type: HelpDialogType) {
    const translationKeys = {
      power: 'power_on',
      wifi: 'connect_to_wifi',
      code: 'enter_support_code',
    };

    const titleTranslationKeys = {
      power: 'connect_help_step1_header',
      wifi: 'connect_help_step2_header',
      code: 'connect_help_step3_header',
    };

    this.title = this.translate.instant(titleTranslationKeys[type]);
    this.content = this.translate.instant(translationKeys[type]);
  }
}
