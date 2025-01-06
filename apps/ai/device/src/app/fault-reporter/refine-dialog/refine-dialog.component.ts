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
