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
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { GPTSubjectFactory } from '../gptsubject';
import { AsyncTyperDirective } from '../typer.directive';
import { TextBuilderSubject } from '../textbuildersubject';
import { openRecognitionDialog } from '@rw/speech';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { DeviceCode2Service, TeamsChatService } from '@rw/auth';

@Component({
  selector: 'nx-scratch',
  standalone: true,
  imports: [CommonModule, AsyncTyperDirective, DialogModule],
  templateUrl: './scratch.component.html',
  styleUrl: './scratch.component.scss',
})
export class ScratchComponent {
  readonly summary = `**Issue:** At 3:00 PM, a pressure anomaly was detected, suspected to be caused by a clog in one of the feed lines. Confirmation of the clog is pending.

  **Recommendation:** **Keep monitoring pressure gauges and flow meters. If further fluctuations occur, conduct a deeper investigation.**
  
  **Note:** The catalyst tested in the cracking unit is performing exceptionally well, with the initial batch showing a 7% higher yield than usual.
  **Issue:** At 3:00 PM, a pressure anomaly was detected, suspected to be caused by a clog in one of the feed lines. Confirmation of the clog is pending.

  **Recommendation:** **Keep monitoring pressure gauges and flow meters. If further fluctuations occur, conduct a deeper investigation.**
  
  **Note:** The catalyst tested in the cracking unit is performing exceptionally well, with the initial batch showing a 7% higher yield than usual.
  
  **Issue:** At 3:00 PM, a pressure anomaly was detected, suspected to be caused by a clog in one of the feed lines. Confirmation of the clog is pending.

  **Recommendation:** **Keep monitoring pressure gauges and flow meters. If further fluctuations occur, conduct a deeper investigation.**
  
  **Note:** The catalyst tested in the cracking unit is performing exceptionally well, with the initial batch showing a 7% higher yield than usual.
  **Issue:** At 3:00 PM, a pressure anomaly was detected, suspected to be caused by a clog in one of the feed lines. Confirmation of the clog is pending.
  **Recommendation:** **Keep monitoring pressure gauges and flow meters. If further fluctuations occur, conduct a deeper investigation.**
  
  **Note:** The catalyst tested in the cracking unit is performing exceptionally well, with the initial batch showing a 7% higher yield than usual.
  
  **Issue:** At 3:00 PM, a pressure anomaly was detected, suspected to be caused by a clog in one of the feed lines. Confirmation of the clog is pending.

  **Recommendation:** **Keep monitoring pressure gauges and flow meters. If further fluctuations occur, conduct a deeper investigation.**
  
  **Note:** The catalyst tested in the cracking unit is performing exceptionally well, with the initial batch showing a 7% higher yield than usual.
  **Issue:** At 3:00 PM, a pressure anomaly was detected, suspected to be caused by a clog in one of the feed lines. Confirmation of the clog is pending.

  **Recommendation:** **Keep monitoring pressure gauges and flow meters. If further fluctuations occur, conduct a deeper investigation.**
  
  **Note:** The catalyst tested in the cracking unit is performing exceptionally well, with the initial batch showing a 7% higher yield than usual.
  **Issue:** At 3:00 PM, a pressure anomaly was detected, suspected to be caused by a clog in one of the feed lines. Confirmation of the clog is pending.

  **Recommendation:** **Keep monitoring pressure gauges and flow meters. If further fluctuations occur, conduct a deeper investigation.**
  
  **Note:** The catalyst tested in the cracking unit is performing exceptionally well, with the initial batch showing a 7% higher yield than usual.
  **Issue:** At 3:00 PM, a pressure anomaly was detected, suspected to be caused by a clog in one of the feed lines. Confirmation of the clog is pending.

  **Recommendation:** **Keep monitoring pressure gauges and flow meters. If further fluctuations occur, conduct a deeper investigation.**
  
  **Note:** The catalyst tested in the cracking unit is performing exceptionally well, with the initial batch showing a 7% higher yield than usual.`;

  readonly name = 'John Doe';
  readonly email = 'John@Doe.com';

  res$?: TextBuilderSubject;

  constructor(
    private dialog: Dialog,
    private teamsService: TeamsChatService,
    private httpClient: HttpClient,
    private deviceCode: DeviceCode2Service,
    private gptSubject: GPTSubjectFactory
  ) {
    // this.deviceCode.getRWAIToken().subscribe(console.log);
  }

  async startStreamer() {
    const sub = this.gptSubject.create();

    sub.start([
      {
        role: 'user',
        content: 'What is the status of the cracking unit? 50 words only',
      },
    ]);

    sub.resettableSubject$.subscribe(console.log);

    sub.fullValue$.subscribe(console.log);
  }

  async startDictation() {
    openRecognitionDialog(this.dialog);
  }

  async start() {
    this.httpClient
      .post('/api/gpt/35', {
        messages: [
          {
            role: 'user',
            content: 'What is the status of the cracking unit?',
          },
        ],
      })
      .subscribe((response) => {
        console.log(response);
      });

    return;

    const body = {
      messages: [
        {
          role: 'user',
          content: 'What is the status of the cracking unit?',
        },
      ],
      stream: true,
    };

    const s = this.gptSubject.create();

    // s.resettableSubject$.subscribe(console.log);
    this.res$ = s.resettableSubject$;

    s.start(body.messages);

    // createFetch('/api/gpt/4o', {
    //   method: 'POST',
    //   body: JSON.stringify(body),
    //   headers: {
    //     'Content-Type': 'application/json'
    //   }
    // }).pipe(splitToLines()).subscribe(message => console.log(`${new Date()} - ${message}`));

    // const fetchResponse = await fetch('https://source.unsplash.com/random/720');
    // const imageBlob = await fetchResponse.blob();

    // const b = await generateHandoverReport('Handover Report', this.summary, this.name, this.email, imageBlob, );

    // const oUrl = URL.createObjectURL(b);
    // window.open(oUrl, "_blank");

    // Random generated file from the date as number eg: RealWearAIReport-(DateValue).pdf
    // const d = new Date();
    // const fileName = `RealWearAIReport-${d.valueOf()}.pdf`;

    // const uploadedResult = await this.teamsService.uploadFile(
    //   b,
    //   fileName,
    //   'application/pdf',
    //   true
    // );

    // const idPattern = /[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}/;
    // const attachmentId = idPattern.exec((uploadedResult).eTag);

    // // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    // await this.teamsService.sendSelfMessage(marked.parse(this.summary) as string, imageBlob, { id: attachmentId![0], url: uploadedResult.webUrl, name: fileName })
  }
}
