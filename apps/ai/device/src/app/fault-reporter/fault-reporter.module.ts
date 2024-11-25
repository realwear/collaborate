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
