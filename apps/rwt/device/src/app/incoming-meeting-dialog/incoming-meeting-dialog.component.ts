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
import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, ElementRef, HostListener, Inject, Input, OnDestroy, ViewChild } from '@angular/core';

export const INCCOMING_DIALOG_CONFIG = {
  width: '550px',
  disableClose: true,
  panelClass: 'rw-panel',
  hasBackdrop: true
};

@Component({
  selector: 'nx-incoming-meeting-dialog',
  templateUrl: './incoming-meeting-dialog.component.html',
  styleUrl: './incoming-meeting-dialog.component.scss',
})
export class IncomingMeetingDialogComponent implements OnDestroy {

  autoCloseTimeout: unknown;

  private ringtoneElement?: ElementRef<HTMLAudioElement>;

  @ViewChild('ringtone') set ringtone(value: ElementRef<HTMLAudioElement>) {

    if (this.ringtoneElement) {
      this.ringtoneElement.nativeElement.pause();
    }

    this.ringtoneElement = value;

    if (value) {
      value.nativeElement.play();
    }
  }

  constructor(private dialogRef: DialogRef<boolean, IncomingMeetingDialogComponent>, @Inject(DIALOG_DATA) public data: IncomingMeetingDialogData) {
    
    // Auto-close in 20 seconds, assuming the user doesn't interact
    this.closeIn(20000);
  }

  ngOnDestroy(): void {
    this.clearTimeoutAndRingtone();
  }

  @HostListener('document:rwt_onPause')
  onDocumentPause() {
    this.clearTimeoutAndRingtone();
    this.dialogRef.close(false);
  }

  /**
   * Stops the "timeout" close and pauses the playing of the ringtone.
   */
  private clearTimeoutAndRingtone() {
    clearTimeout(this.autoCloseTimeout as number);

    if (this.ringtoneElement) {
      this.ringtoneElement.nativeElement.pause();
    }
  }

  private closeIn(timeout: number) {
    if (this.autoCloseTimeout) {
      clearTimeout(this.autoCloseTimeout as number);
    }

    this.autoCloseTimeout = setTimeout(() => {
      this.dialogRef.close(false);
    }, timeout);
  }

  @Input() disableButtons = false;

  accept() {
    this.clearTimeoutAndRingtone();

    this.disableButtons = true;

    this.closeIn(5000);

    this.data.onAnswerCall?.();
  }

  decline() {
    this.clearTimeoutAndRingtone();

    this.disableButtons = true;

    this.closeIn(1500);
  }
}

export function openIncomingMeetingDialog(dialog: Dialog, data: IncomingMeetingDialogData) {
  return dialog.open(IncomingMeetingDialogComponent, { ...INCCOMING_DIALOG_CONFIG, data });
}

export interface IncomingMeetingDialogData {
  name: string;
  email: string;

  onAnswerCall?: () => void;
}