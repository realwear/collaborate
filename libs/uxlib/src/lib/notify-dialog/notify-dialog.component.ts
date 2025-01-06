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
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { NotifyDialogRef } from './notify-dialog-ref';

@Component({
  selector: 'nx-notify-dialog',
  templateUrl: './notify-dialog.component.html',
  styleUrl: './notify-dialog.component.scss',
})
export class NotifyDialogComponent {

  get title$() {
    return this.notifyDialogRef.title$;
  }

  get description$() {
    return this.notifyDialogRef.description$;
  }

  constructor(@Inject(MAT_DIALOG_DATA) public readonly notifyDialogRef: NotifyDialogRef<NotifyDialogComponent>) {
  }
}

export function openNotifyDialog(dialog: MatDialog, title: string, description: string): NotifyDialogRef<NotifyDialogComponent> {
  const notifyDialogRef = new NotifyDialogRef<NotifyDialogComponent>();
  notifyDialogRef.title$.next(title);
  notifyDialogRef.description$.next(description);
  notifyDialogRef.dialogRef = dialog.open(NotifyDialogComponent, {
    data: notifyDialogRef,
    width: '500px',
    disableClose: true
  });

  return notifyDialogRef;
}
