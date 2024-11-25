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
