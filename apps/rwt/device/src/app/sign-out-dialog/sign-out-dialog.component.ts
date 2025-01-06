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
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dialog, DialogModule, DialogRef } from '@angular/cdk/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { FluentButtonCustomComponent } from '../fluent-button.component';

export const SIGNOUT_DIALOG_CONFIG = {
  width: '500px',
  disableClose: true,
  panelClass: 'rw-panel',
  hasBackdrop: true,
};

@Component({
  selector: 'nx-sign-out-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, TranslateModule, FluentButtonCustomComponent],
  templateUrl: './sign-out-dialog.component.html',
  styleUrl: './sign-out-dialog.component.scss',
})
export class SignOutDialogComponent {
  constructor(private cdkDialogRef: DialogRef<boolean>) {}
  cancel() {
    this.cdkDialogRef.close();
  }
  confirmSignOut() {
    this.cdkDialogRef.close(true);
  }
}

export function openDialogOutDialog(dialog: Dialog) {
  return dialog.open<boolean>(SignOutDialogComponent, {
    ...SIGNOUT_DIALOG_CONFIG,
  });
}
