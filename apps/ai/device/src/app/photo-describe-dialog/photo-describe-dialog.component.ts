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
import { SafeUrl } from '@angular/platform-browser';
import { UxlibModule } from '@nx/uxlib';
import { Dialog } from '@angular/cdk/dialog';
import { openRecognitionDialog } from '@rw/speech';

type PhotoDialogRef = MatDialogRef<PhotoDescribeDialogComponent, PhotoCaptureResults>;

@Component({
  selector: 'nx-photo-describe-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, UxlibModule],
  templateUrl: './photo-describe-dialog.component.html',
  styleUrl: './photo-describe-dialog.component.scss',
})
export class PhotoDescribeDialogComponent {
  readonly photoUrl?: SafeUrl;

  constructor(@Inject(MAT_DIALOG_DATA) private data: Blob, private dialog: Dialog, @Inject(MatDialogRef) private dialogRef: PhotoDialogRef) {
    this.photoUrl = URL.createObjectURL(data);
  }

  startDescribe() {
    openRecognitionDialog(this.dialog).then((results) => {
      if (!results?.length) {
        return;
      }

      this.dialogRef.close({
        photo: this.data,
        description: results,
      });
    });
  }
}

interface PhotoCaptureResults {
  photo: Blob;
  description: string;
}
