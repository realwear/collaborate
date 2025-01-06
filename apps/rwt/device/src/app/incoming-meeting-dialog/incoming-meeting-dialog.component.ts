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