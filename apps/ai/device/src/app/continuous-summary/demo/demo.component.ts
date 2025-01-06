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
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, HostBinding, NgZone, OnDestroy, Optional, ViewChild } from '@angular/core';
import { SpeechConfig, SpeechRecognizer } from 'microsoft-cognitiveservices-speech-sdk';
import {
  BehaviorSubject,
  MonoTypeOperatorFunction,
  Observable,
  Subject,
  Subscription,
  filter,
  firstValueFrom,
  interval,
  map,
  shareReplay,
  startWith,
  switchMap,
  take,
  takeWhile,
  tap,
} from 'rxjs';
import { OpenAIResponse, openNotifyDialog } from '@nx/uxlib';
import { TalkerService } from '@rw/speech';
import { animate, style, transition, trigger } from '@angular/animations';
import { IndustryService } from '../../industry.service';
import { DeviceCode2Service, TeamsChatService } from '@rw/auth';
import { marked } from 'marked';
import { MatSnackBar } from '@angular/material/snack-bar';
import { getRandomReportSentPhrase } from '../../phrases';
import { takePhoto as externalTakePhoto } from '../../photo-capture';
import { SafeUrl } from '@angular/platform-browser';
import { generateDateFilename, generateHandoverReport } from '../report-generator';
import { MatDialog } from '@angular/material/dialog';
import { auditWhen } from '@rw/rxjs';

@Component({
  selector: 'nx-demo',
  templateUrl: './demo.component.html',
  styleUrl: './demo.component.scss',
  animations: [
    trigger('myInsertRemoveTrigger', [
      // transition(':enter', [style({ opacity: 0 }), animate('100ms', style({ opacity: 1 }))]),
      transition(':leave', [animate('250ms', style({ opacity: 0 }))]),
    ]),
  ],
  host: {
    class: 'rw-panel',
  },
})
export class DemoComponent implements OnDestroy {
  readonly capturedPhoto$ = new BehaviorSubject<Blob | null>(null);

  readonly capturePhotoSafeUrl$: Observable<SafeUrl | null>;

  readonly currentlyRecognizing$ = new BehaviorSubject<string | null>(null);

  messages: { content: string; role: string }[] = [];

  readonly pendingMessages$ = new BehaviorSubject<string[]>([]);
  readonly pendingMessagesReverse$: Observable<string[]>;

  readonly currentSummary$ = new BehaviorSubject<string>('');

  readonly busy$ = new BehaviorSubject<boolean>(false);

  readonly recog: SpeechRecognizer;

  readonly recordingActive$ = new BehaviorSubject<boolean>(false);
  readonly recognizedTrigger$ = new Subject<void>();

  readonly countdownValue$ = new BehaviorSubject<number>(0);

  private countdownSubscription: Subscription;

  @ViewChild('summary') summaryElement!: ElementRef<HTMLDivElement>;

  @HostBinding('class.is-empty') get isEmpty() {
    return !this.isRecording && this.currentSummary$.value.length === 0;
  }

  @HostBinding('class.is-finished') get isFinished() {
    return !this.isRecording && !this.isEmpty;
  }

  @HostBinding('class.is-recording') get isRecordingClass() {
    return this.isRecording;
  }

  get isRecording() {
    return this.recordingActive$.value;
  }

  get showCountdown() {
    return this.isRecording && this.countdownValue$.value >= 50;
  }

  get reportTitle() {
    return this.industryService.systemMessages.summaryTitle;
  }

  get reportDescription() {
    return this.industryService.systemMessages.summaryDescription;
  }

  constructor(
    private zone: NgZone,
    private httpClient: HttpClient,
    private industryService: IndustryService,
    private readonly speechConfig: SpeechConfig,
    private teamsMessage: TeamsChatService,
    private deviceCode: DeviceCode2Service,
    private snackbar: MatSnackBar,
    private dialog: MatDialog,
    @Optional() private talker?: TalkerService
  ) {
    // this.currentSummary$.next(demoSummary);

    this.pendingMessagesReverse$ = this.pendingMessages$.pipe(
      map((pm) => {
        // Reverse
        const pm1 = [...pm];

        pm1.reverse();

        return pm1;
      })
    );

    this.recog = new SpeechRecognizer(this.speechConfig);

    this.recog.speechStartDetected = () => {
      this.recognizedTrigger$.next();
    };

    this.recog.speechEndDetected = () => {
      this.recognizedTrigger$.next();
    };

    this.recog.recognizing = (_, e) => {
      this.currentlyRecognizing$.next(e.result.text);
      this.recognizedTrigger$.next();
    };

    this.recog.recognized = (_, e) => {
      this.currentlyRecognizing$.next(null);
      this._addPendingMessage(e.result.text);
    };

    this.goToOpenAi();

    this.countdownSubscription = this.createCountdownSubscription();

    this.capturePhotoSafeUrl$ = this.capturedPhoto$.pipe(
      map((blob) => {
        if (!blob) return null;

        return URL.createObjectURL(blob);
      }),
      shareReplay(1)
    );
  }

  async sendReport() {
    const notifyRef = openNotifyDialog(this.dialog, 'Sending Report', 'Generating PDF report');

    const userInfo = await firstValueFrom(this.deviceCode.userInfo$);

    const reportLines = [
      `## ${this.industryService.systemMessages.summaryTitle}`,
      this.currentSummary$.value,
      '',
      '---',
      `Completed by ${userInfo?.name} (<${userInfo?.email}>)`,
      '',
      `on ${new Date().toLocaleString()}`,
    ];

    const pdfBlob = await generateHandoverReport(
      this.industryService.systemMessages.summaryTitle,
      this.currentSummary$.value,
      userInfo?.name || 'Unknown',
      userInfo?.email || 'Unknown',
      this.capturedPhoto$.value
    );

    const pdfFileName = generateDateFilename('RealWearHandover');

    notifyRef.description$.next('Uploading Report to OneDrive');

    const uploadResult = await this.teamsMessage.uploadFile(pdfBlob, pdfFileName, 'application/pdf', true);

    const html = await marked.parse(reportLines.join('\n'), { async: true });

    const idPattern = /[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}/;
    const attachmentId = idPattern.exec(uploadResult.eTag);

    notifyRef.description$.next('Sending Report');

    await this.teamsMessage.sendSelfMessage(html, this.capturedPhoto$.value, {
      url: uploadResult.webUrl,
      name: pdfFileName,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      id: attachmentId![0],
    });

    this.snackbar.open('Report sent', 'Dismiss', {
      duration: 3000,
    });

    this.talker?.speakNext(getRandomReportSentPhrase());

    notifyRef.dialogRef?.close();
  }

  ngOnDestroy() {
    this.recog.close();
    this.countdownSubscription.unsubscribe();
  }

  private createCountdownSubscription() {
    return this.recordingActive$
      .pipe(
        switchMap((active) => {
          if (!active) {
            // Keep the observable but don't emit anything
            return new Subject<void>();
          }

          const MAX_TIMEOUT = 4000;

          return this.recognizedTrigger$.pipe(
            startWith(true),
            tap(() => this.countdownValue$.next(0)),
            switchMap(() => countdown(MAX_TIMEOUT, 250)),
            countdownToPercent(MAX_TIMEOUT, true),
            tap((i) => this.countdownValue$.next(i)),
            filter((i) => i >= 100),
            take(1)
          );
        })
      )
      .subscribe(() => this.stop());
  }

  async performDelayedChangeDetection() {
    await new Promise((resolve) => setTimeout(resolve, 500));
    this.zone.run(() => {
      //
    });
  }

  async debug(debugMessages: string[]) {
    this.recordingActive$.next(true);

    this.messages.push({
      role: 'system',
      content: this.industryService.systemMessages.summary,
    });

    this.currentlyRecognizing$.next(null);

    // For each message in the debug messages, push it to pending messages and wait 3 seconds
    for (const m of debugMessages) {
      // Split into words
      const words = m.split(' ');

      // For each word, add it to the pending messages
      for (const word of words) {
        this.currentlyRecognizing$.next((this.currentlyRecognizing$.value || '') + ' ' + word);
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 200 + 50));
      }

      this.currentlyRecognizing$.next(null);

      this._addPendingMessage(m);

      await new Promise((resolve) => setTimeout(resolve, Math.random() * 2500));
    }

    this.recordingActive$.next(false);
  }

  completionTokens = 0;
  promptTokens = 0;

  reset() {
    this.stop();

    this.currentSummary$.next('');
    this.messages = [];
  }

  refine() {
    this.recog.startContinuousRecognitionAsync();
    this.recordingActive$.next(true);
  }

  takePhoto() {
    externalTakePhoto().then(
      (blob) => {
        this.capturedPhoto$.next(blob);

        setTimeout(() => {
          // Scroll to the end
          this.summaryElement.nativeElement.scrollTo({
            behavior: 'smooth',
            top: this.summaryElement.nativeElement.scrollHeight,
          });
        }, 1000);
      },
      () => {
        this.zone.run(() => {
          this.snackbar.open('Failed to take photo', 'Dismiss');
        });
      }
    );
  }

  start() {
    this.completionTokens = 0;
    this.promptTokens = 0;

    // this.debug(automotiveDemo1);
    // return;

    this.recog.startContinuousRecognitionAsync();

    // Initiate with the system message
    this.messages = [];
    this.messages.push({ content: this.industryService.systemMessages.summary, role: 'system' });

    this.pendingMessages$.next([]);

    this.recordingActive$.next(true);
  }

  stop() {
    this.recog.stopContinuousRecognitionAsync();
    this.recordingActive$.next(false);
  }

  private _addPendingMessage(message: string) {
    if (!message?.length) return;

    this.pendingMessages$.next([...this.pendingMessages$.value, message]);
  }

  messagesToRemove: string[] = [];

  goToOpenAi() {
    this.pendingMessages$
      .pipe(
        auditWhen(this.busy$),
        filter((messages) => !!messages.length),
        map((incomingMessages) => {
          this.messages.push(...incomingMessages.map((content) => ({ content, role: 'user' })));

          // We're now busy
          this.busy$.next(true);

          // Clear the pending messages
          this.messagesToRemove.push(...incomingMessages);

          const messagesToSend = [...this.messages.filter((message) => message.role !== 'assistant')];

          if (this.currentSummary$.value.length > 0 && messagesToSend.length > 2) {
            const existingSystem = 'The current summary that you recently outputted was: ' + this.currentSummary$.value;

            // Insert the existingSystem message into the array at index 1, preserving the rest of the array
            messagesToSend.splice(1, 0, { content: existingSystem, role: 'system' });
          }

          console.log(
            'New messages: ',
            messagesToSend.filter((m) => m.role === 'user').map((i) => i.content)
          );

          return [...messagesToSend, { content: 'This is the end of the user message. Summarize now', role: 'system' }];
        }),
        switchMap((messagesToSend) =>
          this.invokeOpenAI('35', {
            messages: messagesToSend,
          })
        ),
        tap(() => {
          // Remove the messagesToRemove from the pending messages
          this.pendingMessages$.next(this.pendingMessages$.value.filter((message) => !this.messagesToRemove.includes(message)));
          this.messagesToRemove = [];

          this.busy$.next(false);
        })
      )
      .subscribe((response) => {
        this.promptTokens += response.usage.prompt_tokens;
        this.completionTokens += response.usage.completion_tokens;

        // Log the new prompt, new completion tokens, total prompt tokens, and total completion tokens
        // All in 1 line
        console.log(
          'New prompt: ',
          response.usage.prompt_tokens,
          'New completion tokens: ',
          response.usage.completion_tokens,
          'Total prompt tokens: ',
          this.promptTokens,
          'Total completion tokens: ',
          this.completionTokens
        );

        // Get the last choice and add it to the messages
        const choice = response.choices[response.choices.length - 1];

        if (!choice.message.content?.length) return;

        this.messages.push({ content: choice.message.content, role: 'assistant' });

        this.currentSummary$.next(choice.message.content);

        // console.log(this.messages);
      });
  }

  private invokeOpenAI(model: '35' | '4o', content: unknown) {
    return this.httpClient.post<OpenAIResponse>(`/api/gpt/${model}`, content);
  }
}

/**
 * Observable to emit a countdown in milliseconds from max to 0
 * A value will be emitted every emit milliseconds
 * @param emit
 * @param max
 */
function countdown(max: number, emit = 250): Observable<number> {
  let current = max;

  return interval(emit).pipe(
    takeWhile(() => current > 0),
    map(() => (current -= emit)),
    startWith(max)
  );
}

function countdownToPercent(max: number, reverse = false): MonoTypeOperatorFunction<number> {
  return (source) =>
    source.pipe(
      map((i) => (i / max) * 100),
      map((i) => {
        if (!reverse) {
          return i;
        }

        return 100 - i;
      })
    );
}
