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
