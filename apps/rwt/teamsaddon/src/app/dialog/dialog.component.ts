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
