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
