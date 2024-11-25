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
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WaveformVisualizerComponent } from './waveform-visualizer/waveform-visualizer.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { RoundedButtonComponent } from './rounded-button/rounded-button.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DottyComponent } from './dotty/dotty.component';
import { RelativeDatePipe } from './relative-date.pipe';
import { RouterModule } from '@angular/router';
import { NotifyDialogComponent } from './notify-dialog/notify-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  declarations: [
    WaveformVisualizerComponent,
    RoundedButtonComponent,
    DottyComponent,
    RelativeDatePipe,
    NotifyDialogComponent,
  ],
  exports: [
    WaveformVisualizerComponent,
    RoundedButtonComponent,
    DottyComponent,
    RelativeDatePipe
  ],
})
export class UxlibModule {}
