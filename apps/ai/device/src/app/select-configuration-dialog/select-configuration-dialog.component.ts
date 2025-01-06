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
