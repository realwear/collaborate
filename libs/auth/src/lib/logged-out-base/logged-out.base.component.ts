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
import { Component, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription, distinctUntilChanged, filter } from 'rxjs';
import { AzureSignInDialogComponent } from '../azure-sign-in-dialog/azure-sign-in-dialog.component';
import { DeviceCode2Service } from '../device-code2.service';

/**
 * Base class for components that are shown when the user is logged out.
 *
 * To use, subclass this in the app project and use the `signIn` method to start the login process.
 */
@Component({
  template: '',
})
export abstract class LoggedOutBaseComponent implements OnDestroy {
  private dRef: MatDialogRef<AzureSignInDialogComponent> | null = null;

  private _pendingSub?: Subscription;
  private _isLoggedInSub?: Subscription;

  constructor(router: Router, protected deviceCodeService: DeviceCode2Service, matDialog: MatDialog) {
    this._pendingSub = deviceCodeService.pending$.pipe(distinctUntilChanged()).subscribe((state) => {
      if (state) {
        this.dRef?.close();
        this.dRef = matDialog.open(AzureSignInDialogComponent, {
          disableClose: true,
          width: '600px',
        });
      } else {
        this.dRef?.close();
        this.dRef = null;
      }
    });

    this._isLoggedInSub = deviceCodeService.isLoggedIn$
      .pipe(
        filter((i) => !!i),
        distinctUntilChanged()
      )
      .subscribe(() => router.navigate(['/']));
  }

  ngOnDestroy() {
    this._pendingSub?.unsubscribe();
    this._isLoggedInSub?.unsubscribe();
  }

  abstract signin(): void;
}
