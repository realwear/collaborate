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
import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/overlay';
import { Component, Inject, OnInit, Optional, Output } from '@angular/core';
import { Subject } from 'rxjs';
import {
  TESTING_DIALOG_OPTIONS,
  TESTING_DIALOG_TYPE,
} from '../testing-dialog-tokens';

@Component({
  template: '',
  selector: 'nx-launch-testing-dialog',
})
export class LaunchTestingDialogComponent<R = unknown, D = unknown, C = unknown> implements OnInit {
  @Output() closed = new Subject<void>();

  constructor(
    private dialog: Dialog,
    @Inject(TESTING_DIALOG_TYPE) private templateType: ComponentType<C>,
    @Optional()
    @Inject(TESTING_DIALOG_OPTIONS)
    private dialogOptions?: DialogConfig<D, DialogRef<R, C>>
  ) {}

  ngOnInit(): void {
    if (!this.dialogOptions) {
      this.dialogOptions = {};
    }

    this.dialogOptions.disableClose = true;

    this.launchDialog();
  }

  private launchDialog() {
    const dialogRef = this.dialog.open<R, D, C>(this.templateType, this.dialogOptions);

    dialogRef.closed.subscribe(() => {
      this.closed.next();

      // Relaunch the dialog
      this.launchDialog();
    });
  }
}
