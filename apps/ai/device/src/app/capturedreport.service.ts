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
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { openaiAnswerQuestion, openaiExtractSummary, openaiGenerateQuestions, openaiRefineReport, openaiSummary } from './completions';
import { GPTSubject, GPTSubjectFactory } from './gptsubject';

@Injectable()
export class CapturedReport {
  readonly questions$ = new BehaviorSubject<string[]>([]);

  oldDescriptions: string[] = [];

  readonly descriptionSubject: GPTSubject;
  readonly summarySubject: GPTSubject;

  get summary() {
    return this.summarySubject.fullValue$.value;
  }

  get description() {
    if (this.oldDescriptions.length > 0) {
      return this.oldDescriptions[this.oldDescriptions.length - 1];
    }

    return this.descriptionSubject.fullValue$.value;
  }

  get isEmpty() {
    return this.summarySubject.isEmpty && this.descriptionSubject.isEmpty;
  }

  constructor(private gptSubjectFactory: GPTSubjectFactory) {
    this.summarySubject = gptSubjectFactory.create();

    this.descriptionSubject = gptSubjectFactory.create();
    this.descriptionSubject.fullValue$.subscribe((value) => {
      if (!value) return;

      this.updateDescription(value);
    });

    // this.descriptionSubject.inject("A crack was discovered in the concrete between the engine room and the canteen.");
  }

  private updateDescription(newDescription: string) {
    this.oldDescriptions.push(this.description!);

    // Regenerate the questions
    this.generateQuestions(newDescription);

    this.summarySubject.start(openaiExtractSummary(newDescription).messages);
  }

  undoDescription() {
    if (this.oldDescriptions.length > 0) {
      // TODO
    }
  }

  clear() {
    this.summarySubject.clear();
    this.descriptionSubject.clear();
    this.oldDescriptions = [];
  }

  reset(initialDescription: string) {
    this.summarySubject.clear();

    const messages = openaiSummary(initialDescription).messages;

    this.descriptionSubject.start(messages);
  }

  answerQuestion(question: string, response: string) {
    this.descriptionSubject.start(openaiAnswerQuestion(this.description!, question, response).messages);
  }

  refineDescription(newDescription: string) {
    this.descriptionSubject.start(openaiRefineReport(this.description!, newDescription).messages);
  }

  private generateQuestions(description: string) {
    console.log('Generating Questions', description);

    this.gptSubjectFactory.callGptFunction<QuestionsFn>('35', openaiGenerateQuestions(description)).subscribe((result) => {
      if (!result) return;

      console.log('Generated Questions: ', result.questions.join());

      this.questions$.next(result.questions);
    });
  }
}

interface QuestionsFn {
  questions: string[];
}
