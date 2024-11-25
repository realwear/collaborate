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
import { DeviceCode2Service } from '@rw/auth';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Observable, Subscription, distinctUntilChanged } from 'rxjs';
import { UxlibModule } from '@nx/uxlib';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';

@Component({
  selector: 'nx-reconnecting-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, UxlibModule, MatProgressSpinnerModule],
  templateUrl: './reconnecting-dialog.component.html',
  styleUrl: './reconnecting-dialog.component.scss',
})
export class ReconnectingDialogComponent {
  readonly isCurrentlyRefreshing$: Observable<boolean>;

  constructor(private deviceCodeService: DeviceCode2Service, private router: Router) {
    this.isCurrentlyRefreshing$ = deviceCodeService.isRefreshing$;
  }

  async signout() {
    this.deviceCodeService.signout();
    await this.router.navigate(['/login'], { skipLocationChange: true });
  }

  refreshNow() {
    this.deviceCodeService
      .fetchAccessTokenForGraph()
      .then(() => {
        console.log('Refreshed');
      })
      .catch((e) => {
        console.error('Failed to refresh', e);
      });
  }
}

export function showReconnectingIfTrue(obs: Observable<boolean>, dialog: MatDialog): Subscription {
  let dialogRef: MatDialogRef<ReconnectingDialogComponent> | null;

  return obs.pipe(distinctUntilChanged()).subscribe((shouldShow) => {
    if (shouldShow) {
      dialogRef = dialogRef || dialog.open(ReconnectingDialogComponent, { disableClose: true, width: '600px' });
    } else if (dialogRef) {
      dialogRef.close();
      dialogRef = null;
    }
  });
}
