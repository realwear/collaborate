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
import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PhotoDescribeDialogComponent } from '../photo-describe-dialog/photo-describe-dialog.component';
import { takePhoto } from '../photo-capture';

@Component({
  selector: 'nx-photo-test',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './photo-test.component.html',
  styleUrl: './photo-test.component.scss',
})
export class PhotoTestComponent {
  photo: SafeUrl | null = null;

  constructor(private domSanitizer: DomSanitizer, private zone: NgZone, private dialog: MatDialog) {}

  async start() {
    try {
      const blob = await takePhoto();

      this.zone.run(() => {
        if (blob) {
          this.photo = this.domSanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob));
        } else {
          this.photo = null;
        }

        this.dialog.open(PhotoDescribeDialogComponent, {
          data: blob,
          minWidth: '95vw',
        });
      });
    } catch (error) {
      console.error('Error', error);
    }
  }
}
