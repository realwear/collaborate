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
