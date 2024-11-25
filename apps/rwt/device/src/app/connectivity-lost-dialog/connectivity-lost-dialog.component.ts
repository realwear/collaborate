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
import { Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectivityService } from '@rw/connectivity';
import { BehaviorSubject, distinctUntilChanged, filter, Subscription, switchMap } from 'rxjs';
import { Dialog, DIALOG_DATA, DialogModule, DialogRef } from '@angular/cdk/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { UxlibModule } from '@nx/uxlib';
import { FluentButtonCustomComponent } from '../fluent-button.component';

interface ConnectivityLostDialogData {
  displaySignOut: boolean;
  signOutFn?: () => void;
}

@Component({
  selector: 'nx-connectivity-lost-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, TranslateModule, UxlibModule, FluentButtonCustomComponent],
  templateUrl: './connectivity-lost-dialog.component.html',
  styleUrl: './connectivity-lost-dialog.component.scss',
})
export class ConnectivityLostDialogComponent {
  constructor(private connectivityService: ConnectivityService, @Inject(DIALOG_DATA) private data: ConnectivityLostDialogData) {}

  get displaySignOut() {
    return this.data.displaySignOut;
  }

  getConnected() {
    this.connectivityService.openConfigurator();
  }

  signOut() {
    this.data.signOutFn?.();
  }
}

@Component({
  selector: 'nx-connectivity-lost-host',
  standalone: true,
  imports: [CommonModule, ConnectivityLostDialogComponent, DialogModule],
  providers: [ConnectivityService],
  template: '',
  styles: [':host { display: none; }'],
})
export class ConnectivityLostHostComponent implements OnInit, OnDestroy {
  private onlineSub: Subscription;
  private dialogRef?: DialogRef<void, ConnectivityLostDialogComponent>;
  private subscriptionActive$ = new BehaviorSubject<boolean>(false);
  constructor(connectivity: ConnectivityService, private cdkDialog: Dialog) {
    this.onlineSub = this.subscriptionActive$
      .pipe(
        filter((i) => i),
        switchMap(() => connectivity.isOnline$),
        distinctUntilChanged()
      )
      .subscribe((online) => {
        if (!online) {
          this.openDialog();
          return;
        }

        this.dialogRef?.close();
      });
  }

  @Input() displaySignOut = false;
  @Output() signOut = new EventEmitter<void>();

  ngOnInit(): void {
    this.subscriptionActive$.next(true);
  }

  ngOnDestroy(): void {
    this.onlineSub.unsubscribe();
  }

  private openDialog() {
    this.dialogRef?.close();

    this.dialogRef = this.cdkDialog.open(ConnectivityLostDialogComponent, {
      width: '400px',
      panelClass: 'rw-panel',
      disableClose: true,
      hasBackdrop: true,
      data: { displaySignOut: this.displaySignOut, signOutFn: () => this.signOut.emit() },
    });
  }
}
