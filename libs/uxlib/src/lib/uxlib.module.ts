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
