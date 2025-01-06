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
