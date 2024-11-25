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
