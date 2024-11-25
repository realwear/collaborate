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
import { Component, HostBinding, NgZone, OnDestroy, OnInit, Optional } from '@angular/core';
import { TalkerService } from '@rw/speech';
import { CapturedReport } from '../../capturedreport.service';
import { RefineDialogComponent } from '../refine-dialog/refine-dialog.component';
import { Dialog } from '@angular/cdk/dialog';
import { DeviceCode2Service, TeamsChatService } from '@rw/auth';
import { BehaviorSubject, Observable, Subscription, filter, firstValueFrom, map, scan, shareReplay } from 'rxjs';
import { marked } from 'marked';
import { MatSnackBar } from '@angular/material/snack-bar';
import { getRandomAcknowledgedPhrase, getRandomReportSentPhrase, getRandomSendReportPhrase } from '../../phrases';
import { Router } from '@angular/router';
import { takePhoto as externalTakePhoto } from '../../photo-capture';
import { SafeUrl } from '@angular/platform-browser';
import { ConfigurationService } from '../../configuration.service';

@Component({
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.scss',
  host: {
    class: 'rw-panel',
  },
})
export class DetailComponent implements OnInit, OnDestroy {
  readonly capturedPhoto$ = new BehaviorSubject<Blob | null>(null);
  readonly capturedPhotoUrl$: Observable<SafeUrl | null>;

  resetSubscription?: Subscription;
  descriptionSubscription?: Subscription;
  fullValueSubscription?: Subscription;

  constructor(
    public report: CapturedReport,
    private configService: ConfigurationService,
    private router: Router,
    private zone: NgZone,
    private matDialog: Dialog,
    private teamsService: TeamsChatService,
    private deviceCodeService: DeviceCode2Service,
    private snackbar: MatSnackBar,
    @Optional() private talker?: TalkerService
  ) {
    this.capturedPhotoUrl$ = this.capturedPhoto$.pipe(
      map((blob) => {
        if (blob) {
          return URL.createObjectURL(blob);
        } else {
          return null;
        }
      }),
      shareReplay(1)
    );
  }

  @HostBinding('class.hidden') hidden = false;

  startAgain() {
    this.talker?.reset();
    this.report.clear();
    this.router.navigateByUrl('/');
  }

  ngOnInit(): void {
    this.resetSubscription = this.report.descriptionSubject.reset$.subscribe(() => {
      this.talker?.speakNext(getRandomAcknowledgedPhrase());
    });

    this.fullValueSubscription = this.report.descriptionSubject.fullValue$.pipe(filter((i) => !!i?.length)).subscribe(() => {
      this.talker?.speakNext(getRandomSendReportPhrase());
    });

    const endChars = ['.', '!', '?', ';'];

    this.descriptionSubscription = this.report.descriptionSubject.resettableSubject$
      .pipe(
        scan(
          (acc, curr) => {
            if (acc.emit) {
              acc.sentence = '';
              acc.emit = false;
            }

            if (endChars.find((c) => curr.includes(c))) {
              const sentence = acc.sentence + curr;
              return { sentence, emit: true };
            } else {
              return { sentence: acc.sentence + curr, emit: false };
            }
          },
          { sentence: '', emit: false }
        ),
        filter((acc) => acc.emit),
        map((acc) => acc.sentence.trim())
      )
      .subscribe((text) => this.talker?.speakNext(text, false));
  }

  ngOnDestroy(): void {
    this.descriptionSubscription?.unsubscribe();
    this.fullValueSubscription?.unsubscribe();
    this.resetSubscription?.unsubscribe();
  }

  refine() {
    this.hidden = true;

    const dRef = this.matDialog.open(RefineDialogComponent, {
      width: '90vw',
      height: '400px',
      panelClass: 'rw-panel',
      hasBackdrop: false,
    });

    dRef.closed.subscribe(() => {
      this.hidden = false;
    });
  }

  takePhoto() {
    externalTakePhoto().then(
      (blob) => this.capturedPhoto$.next(blob),
      () => {
        this.zone.run(() => {
          this.snackbar.open('Failed to take photo', 'Dismiss', {
            duration: 3000,
          });
        });
      }
    );
  }

  async sendReport() {
    const isLoggedIn = await firstValueFrom(this.teamsService.isLoggedIn$);

    if (!isLoggedIn) {
      this.deviceCodeService.start();
      return;
    }

    const userInfo = await firstValueFrom(this.deviceCodeService.userInfo$);

    const summary = this.report.summary;
    const description = this.report.descriptionSubject.fullValue$.value;

    const languages = this.configService.reportLanguages;

    for (const lang of languages) {
      const newSummary = summary;
      const newDescription = description;

      const reportLines = [
        `## Summary (${lang})`,
        newSummary,
        // Merge report name and email onto same line
        `## Description`,
        newDescription,
        '',
        '---',
        `Completed by ${userInfo?.name} (<${userInfo?.email}>)`,
        '',
        `on ${new Date().toLocaleString()}`,
      ];

      const c = marked.parse(reportLines.join('\n'), { async: false }) as string;

      await this.teamsService.sendSelfMessage(c, this.capturedPhoto$.value);
    }

    this.snackbar.open('Report sent', 'Dismiss', {
      duration: 3000,
    });

    this.talker?.speakNext(getRandomReportSentPhrase());
  }
}
