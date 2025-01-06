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
