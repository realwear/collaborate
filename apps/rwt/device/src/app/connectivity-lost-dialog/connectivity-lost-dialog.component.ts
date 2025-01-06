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
