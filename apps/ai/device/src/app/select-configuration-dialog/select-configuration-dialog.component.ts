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
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UxlibModule } from '@nx/uxlib';

@Component({
  selector: 'nx-select-configuration-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, UxlibModule],
  templateUrl: './select-configuration-dialog.component.html',
  styleUrl: './select-configuration-dialog.component.scss',
})
export class SelectConfigurationDialogComponent {
  readonly codeControl = new FormControl('');

  constructor(private dialogRef: MatDialogRef<SelectConfigurationDialogComponent, string>, @Inject(MAT_DIALOG_DATA) data: string) {
    this.codeControl.setValue(data?.trim());
  }

  submit(evt: Event) {
    evt.stopPropagation();

    if (this.codeControl.invalid || !this.codeControl.value) {
      return false;
    }

    this.dialogRef.close(this.codeControl.value);

    return false;
  }
}
