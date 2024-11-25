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
import { Component, OnDestroy, OnInit, Optional } from '@angular/core';
import { CapturedReport } from '../../capturedreport.service';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { getRandomAnswerQuestionHintPhrase, getRandomGenericRefineReportPhrase, getRandomMovingOnPhrase } from '../../phrases';
import { Subscription } from 'rxjs';
import { openRecognitionDialog, TalkerService } from '@rw/speech';

@Component({
  selector: 'nx-refine-dialog',
  templateUrl: './refine-dialog.component.html',
  styleUrl: './refine-dialog.component.scss',
})
export class RefineDialogComponent implements OnInit, OnDestroy {
  questionIndex = 0;

  subscription?: Subscription;

  get currentQuestion() {
    if (this.questionIndex >= this.report.questions$.value.length) {
      return null;
    }

    return this.report.questions$.value[this.questionIndex];
  }

  get questionsLoading() {
    return !this.report.questions$.value.length;
  }

  get hasOtherQuestions() {
    return this.questionIndex < this.report.questions$.value.length;
  }

  constructor(
    public report: CapturedReport,
    private dialog: Dialog,
    private dialogRef: DialogRef<RefineDialogComponent>,
    @Optional() private talker?: TalkerService
  ) {}

  ngOnInit(): void {
    this.talker?.reset();

    this.subscription = this.report.questions$.subscribe(() => {
      this.questionIndex = 0;

      if (!this.currentQuestion) {
        return;
      }

      this.speakQuestion(this.currentQuestion);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private async speakQuestion(question: string | null) {
    if (!question?.length) return;

    await this.talker?.speakNext(question, false);
    await this.talker?.speakNext(getRandomAnswerQuestionHintPhrase());
  }

  async skipQuestion() {
    this.questionIndex++;

    this.talker?.reset();

    await this.talker?.speakNext(getRandomMovingOnPhrase());

    // We're at the
    if (!this.hasOtherQuestions) {
      await this.talker?.speakNext(getRandomGenericRefineReportPhrase());

      return;
    }

    this.speakQuestion(this.currentQuestion);
  }

  async answerQuestion(question: string) {
    this.talker?.reset();

    const response = await openRecognitionDialog(this.dialog);

    if (!response) return;

    this.report.answerQuestion(question, response);

    this.dialogRef.close();
  }

  cancel() {
    this.talker?.reset();

    this.dialogRef.close();
  }

  async refineDescription() {
    const response = await openRecognitionDialog(this.dialog);

    if (!response) return;

    this.report.refineDescription(response);

    this.dialogRef.close();
  }
}
