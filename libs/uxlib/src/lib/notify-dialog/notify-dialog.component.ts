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
