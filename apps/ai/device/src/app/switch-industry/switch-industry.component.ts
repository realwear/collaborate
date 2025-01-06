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
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { UxlibModule } from '@nx/uxlib';

@Component({
  selector: 'nx-switch-industry',
  standalone: true,
  imports: [CommonModule, MatDialogModule, UxlibModule],
  templateUrl: './switch-industry.component.html',
  styleUrl: './switch-industry.component.scss',
})
export class SwitchIndustryComponent {}

export function openSwitchIndustryDialog(dialog: MatDialog): Promise<string | null> {
  const dialogRef = dialog.open(SwitchIndustryComponent, {
    minWidth: '800px',
  });

  return firstValueFrom(dialogRef.afterClosed());
}
