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
