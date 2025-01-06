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
import { Component, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UxlibModule } from '@nx/uxlib';
import { openRecognitionDialog } from '@rw/speech';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { BehaviorSubject, map } from 'rxjs';
import { GPTSubjectFactory } from '../gptsubject';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { TeamsChatService } from '@rw/auth';
import { marked } from 'marked';
import { MatSnackBar } from '@angular/material/snack-bar';

interface ChemicalSpillData {
  location?: string;
  explanation?: string;
  servicesRequired?: string[];
  immediateDanger?: string;
}

@Component({
  selector: 'nx-chemical-spill',
  standalone: true,
  imports: [CommonModule, UxlibModule, DialogModule, MatProgressSpinnerModule],
  templateUrl: './chemical-spill.component.html',
  styleUrl: './chemical-spill.component.scss',
  host: {
    class: 'rw-panel',
  },
})
export class ChemicalSpillComponent {
  readonly currentSpillData$ = new BehaviorSubject<ChemicalSpillData | null>(null);

  readonly loading$ = new BehaviorSubject(false);
  readonly notLoading$ = this.loading$.pipe(map((i) => !i));

  readonly isEmpty$ = this.currentSpillData$.pipe(map((i) => !i));
  readonly isNotEmpty$ = this.currentSpillData$.pipe(map((i) => !!i));

  readonly canSubmit$ = this.currentSpillData$.pipe(
    map((i) => {
      // If all of the fields are filled out, then we can submit
      return i?.location?.length && i?.explanation?.length && i?.servicesRequired?.length && i?.immediateDanger?.length;
    })
  );

  constructor(
    private router: Router,
    private cdkDialog: Dialog,
    private gptFactory: GPTSubjectFactory,
    private teamsChatService: TeamsChatService,
    private snackbar: MatSnackBar
  ) {}

  async moreInfo() {
    // this.callGpt(
    //   'In London there is a major spill requring the police and fire department to respond. The spill is a chemical spill and is causing immediate danger to the public.'
    // );

    openRecognitionDialog(this.cdkDialog, 'Describe the Chemical Spill').then((result) => {
      if (!result?.length) {
        return;
      }

      this.callGpt(result);
    });
  }

  async sendReport() {
    this.loading$.next(true);

    try {
      await this.sendReportInternal();

      this.snackbar.open('Report sent', 'Dismiss', { duration: 3000 });
    } catch {
      this.loading$.next(false);
    }

    this.loading$.next(false);
  }

  async sendReportInternal() {
    const metadata = this.currentSpillData$.value;

    const doubleSpace = ['', ''];

    // For each service, create a bullet point list in markdown format
    const servicesRequired = metadata?.servicesRequired?.map((service) => `- ${service}`);

    const reportLines = [
      `## Chemical Spill Report`,
      '---',
      metadata?.explanation,
      ...doubleSpace,
      `### Location`,
      metadata?.location,
      ...doubleSpace,
      `### Services Required`,
      ...(servicesRequired || []),
      `### Immediate Danger`,
      metadata?.immediateDanger,
      ...doubleSpace,
      '---',
      `Completed at ${new Date().toLocaleString()}`,
    ];

    console.debug('Sending report', reportLines);

    const html = await marked.parse(reportLines.join('\n'), { async: true });

    await this.teamsChatService.sendSelfMessage(html);
  }

  @HostBinding('attr.aria-hidden') get ariaHidden() {
    return this.loading$.value;
  }

  async reset() {
    await this.router.navigate(['/']);
  }

  callGpt(prompt: string) {
    this.loading$.next(true);

    this.gptFactory.callGptFunction<ChemicalSpillData>('4o', openaiExtractChemicalSpill(prompt, this.currentSpillData$.value)).subscribe(
      (result) => {
        this.loading$.next(false);

        if (!result) {
          return;
        }

        this.currentSpillData$.next(result);
      },
      () => {
        this.loading$.next(false);
      }
    );
  }
}

export function openaiExtractChemicalSpill(prompt: string, data?: ChemicalSpillData | null) {
  let systemMessage = `You are a system for helping a user create a report related to a current chemical spill.
      The user will describe the report and will define a location, explanation of the incident, the required services and the immediate danger to health.
      Your job is to identify from the user's input the location, explanation, services required and immediate danger to health.
      All of the data that is specified by the user will be stored in the system and will be used to generate a subsequent report.
      Your job is to create a JSON object that contains the location, explanation, services required and immediate danger to health.`;

  systemMessage += 'If the system is unable to extract the data, leave the fields empty.';

  systemMessage += 'Do not guess or infer any information if it is not specified. If the input is blank, just leave all fields blank.';

  systemMessage +=
    'If existing data is supplied, the user phrase will likely require that the response is modified. For example, the location might change, or the explanation might be different.';

  const existingUserMessage = 'I have previously defined the following information with relation to the chemical spill:' + JSON.stringify(data);

  const newUserMessage = prompt;

  const tool = {
    type: 'function',
    function: {
      name: 'save_chemical_spill_data',
      description: 'This function saves the chemical spill data to the system',
      parameters: {
        type: 'object',
        required: ['location', 'explanation', 'servicesRequired', 'immediateDanger'],
        properties: {
          location: {
            type: 'string',
            description: 'The location of the chemical spill',
          },
          explanation: {
            type: 'string',
            description: 'The explanation of the chemical spill',
          },
          servicesRequired: {
            type: 'array',
            items: {
              type: 'string',
            },
            description:
              'The services required to deal with the chemical spill. This can be fire, police, hazmat, coast guard, or anything else that the user requests',
          },
          immediateDanger: {
            type: 'string',
            description: 'The immediate danger to health',
          },
        },
      },
    },
  };

  const messages = [
    {
      role: 'system',
      content: systemMessage,
    },
    {
      role: 'user',
      content: '',
    },
    data ? { role: 'user', content: existingUserMessage } : undefined,
    {
      role: 'user',
      content: newUserMessage,
    },
  ];

  return {
    messages: [...messages.filter((m) => m)],
    tools: [tool],
    tool_choice: {
      type: 'function',
      function: { name: 'save_chemical_spill_data' },
    },
  };
}

/**
 * Step 1 - Define the location of the chemical spill
 * Step 2 - Explain what happened with the chemical spill
 * Step 2a - Offer option to embelish the explanation
 * Step 3 - Ask what other services need to be contacted
 * Step 4 - Ask what is the immediate danger and health risks
 */
