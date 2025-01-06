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
import { DetailComponent } from './detail/detail.component';
import { RefineDialogComponent } from './refine-dialog/refine-dialog.component';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { DialogModule } from '@angular/cdk/dialog';
import { UxlibModule } from '@nx/uxlib';
import { AsyncTyperDirective } from '../typer.directive';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [DetailComponent, RefineDialogComponent],
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    DialogModule,
    UxlibModule,
    AsyncTyperDirective,
    MatSnackBarModule,
    RouterModule.forChild([
      {
        path: '',
        component: DetailComponent,
      },
    ]),
  ],
  exports: [DetailComponent],
})
export class FaultReporterModule {}
