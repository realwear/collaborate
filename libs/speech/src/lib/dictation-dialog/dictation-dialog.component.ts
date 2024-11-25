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
import { Component, ElementRef, Inject, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { AudioConfig, OutputFormat, SpeechConfig, SpeechRecognizer } from 'microsoft-cognitiveservices-speech-sdk';
import { Dialog, DIALOG_DATA, DialogModule, DialogRef } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { UxlibModule } from '@nx/uxlib';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export const DICTATION_DIALOG_CONFIG = {
  width: '90vw',
  height: '400px',
  disableClose: true,
  panelClass: 'rw-panel',
  hasBackdrop: false,
};

interface DictationDialogData {
  title: string;
}

@Component({
  selector: 'rw-dictation-dialog',
  templateUrl: './dictation-dialog.component.html',
  styleUrl: './dictation-dialog.component.scss',
  standalone: true,
  imports: [DialogModule, CommonModule, UxlibModule, MatProgressSpinnerModule],
})
export class DictationDialogComponent implements OnInit, OnDestroy {
  stream$ = new BehaviorSubject<MediaStream | null>(null);

  private _speechRecognizer: SpeechRecognizer | null = null;
  private _audioConfig: AudioConfig | null = null;

  readonly state$ = new BehaviorSubject<'pending' | 'listening' | 'error' | 'permission'>('pending');
  readonly errorMessage$ = new BehaviorSubject<string | null>(null);

  @ViewChild('audioPlayer') audio?: ElementRef<HTMLAudioElement>;

  currentResults = '';

  constructor(
    private zone: NgZone,
    private readonly speechConfig: SpeechConfig,
    private dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) private data: DictationDialogData
  ) {}

  get textBulk() {
    if (this.currentResults?.length < 60) {
      return 'xl';
    }

    if (this.currentResults?.length < 100) {
      return 'lg';
    }

    if (this.currentResults?.length < 140) {
      return 'md';
    }

    return 'sm';
  }

  get title() {
    return this.data.title;
  }

  ngOnInit(): void {
    this.toggle();
  }

  ngOnDestroy(): void {
    this._speechRecognizer?.close();
    this._audioConfig?.close();

    this.cleanupStream();
  }

  private cleanupStream() {
    if (!this.stream$.value) {
      return;
    }

    this.stream$.value.getTracks().forEach((track) => track.stop());
  }

  cancel() {
    this.dialogRef.close();
  }

  toggle() {
    if (this.stream$.value == null) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(
        (stream) => {
          this.cleanupStream();
          this.stream$.next(stream);

          if (stream) {
            this.setupRecognition(stream);
          }
        },
        () => {
          this.state$.next('permission');
        }
      );
    } else {
      this.cleanupStream();
      this.stream$.next(null);
    }
  }

  private async close(results: string) {
    const delay = new Promise((resolve) => setTimeout(resolve, 800));

    await delay;

    this.dialogRef.close(results);
  }

  private setupRecognition(stream: MediaStream) {
    if (this._speechRecognizer) {
      this._speechRecognizer.close();
      this._speechRecognizer = null;
    }

    if (this._audioConfig) {
      this._audioConfig.close();
      this._audioConfig = null;
    }

    this._audioConfig = AudioConfig.fromStreamInput(stream);

    this.speechConfig.outputFormat = OutputFormat.Detailed;

    this._speechRecognizer = new SpeechRecognizer(this.speechConfig, this._audioConfig);

    this._speechRecognizer.properties.setProperty('SpeechServiceConnection_InitialSilenceTimeoutMs', '10000');
    this._speechRecognizer.properties.setProperty('SpeechServiceConnection_EndSilenceTimeoutMs', '5000');

    this._speechRecognizer.properties.keys.forEach((key) => {
      console.log(key, this._speechRecognizer?.properties.getProperty(key));
    });

    this._speechRecognizer.recognizeOnceAsync(
      (result) => {
        console.log('End Result', result);

        this.zone.run(() => {
          if (result.errorDetails) {
            this.state$.next('error');
            this.errorMessage$.next(result.errorDetails);
            console.log(result.errorDetails);
            return;
          }

          console.log(JSON.parse(result.json));

          this.currentResults = result.text;

          this.close(this.currentResults);
        });
      },
      (error) => {
        this.zone.run(() => {
          console.log(error);
          this.state$.next('error');
          this.errorMessage$.next(error);
        });
      }
    );

    this._speechRecognizer.sessionStarted = () => {
      this.playAudioIn();

      this.zone.run(() => {
        this.state$.next('listening');
      });
    };

    this._speechRecognizer.recognizing = (_, e) => {
      this.zone.run(() => {
        this.currentResults = e.result.text;
      });
    };

    this._speechRecognizer.speechEndDetected = () => {
      this.playAudioOut();
    };
  }

  private playAudioSnippet(start: number, end: number) {
    if (!this.audio) {
      console.log('No audio Element, cannot play');
      return;
    }

    this.audio.nativeElement.ontimeupdate = null;

    this.audio.nativeElement.currentTime = start;

    this.audio.nativeElement.play();
    this.audio.nativeElement.ontimeupdate = () => {
      if (!this.audio) {
        return;
      }

      if (this.audio.nativeElement.currentTime > end) {
        this.audio.nativeElement.pause();
        console.log('Paused');
      }
    };
  }

  private playAudioIn() {
    this.playAudioSnippet(0.2, 1);
  }

  private playAudioOut() {
    this.playAudioSnippet(2.3, 3);
  }
}

export async function openRecognitionDialog(dialog: Dialog, title?: string): Promise<string | undefined> {
  const dialogRef = dialog.open<string>(DictationDialogComponent, {
    ...DICTATION_DIALOG_CONFIG,
    data: {
      title: title,
    },
  });

  const result = await firstValueFrom(dialogRef.closed);

  return result;
}
