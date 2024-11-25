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
import { DemoComponent } from './demo/demo.component';
import { Route, RouterModule } from '@angular/router';
import { MarkdownDirective } from './markdown.directive';
import { UxlibModule } from '@nx/uxlib';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AutoScrollDirective } from './auto-scroll.directive';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';

const routes: Route[] = [
  {
    path: '',
    component: DemoComponent,
  },
];

@NgModule({
  declarations: [DemoComponent, MarkdownDirective, AutoScrollDirective],
  imports: [CommonModule, UxlibModule, MatDialogModule, RouterModule.forChild(routes), MatProgressBarModule, MatProgressSpinnerModule],
})
export class ContinuousSummaryModule {}
