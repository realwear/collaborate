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
import { Component, NgZone, OnDestroy } from '@angular/core';
import { AudioConfig, SpeechTranslationConfig, TranslationRecognizer } from 'microsoft-cognitiveservices-speech-sdk';

@Component({
  selector: 'nx-start',
  templateUrl: './start.component.html',
  styleUrl: './start.component.scss',
  host: {
    class: 'rw-panel',
  },
})
export class StartComponent implements OnDestroy {
  readonly languages = ['fr', 'es', 'ja', 'nl', 'nb'];

  source?: string;
  destination?: string;

  readonly translation: TranslationRecognizer;

  get currentLanguage() {
    return this.translation.targetLanguages[0];
  }

  constructor(private speechConfig: SpeechTranslationConfig, zone: NgZone) {
    speechConfig.speechRecognitionLanguage = 'en-US';
    speechConfig.addTargetLanguage('fr');

    this.translation = new TranslationRecognizer(speechConfig, AudioConfig.fromDefaultMicrophoneInput());

    this.translation.recognized = (_, e) => {
      zone.run(() => {
        this.source = e.result.text;
        this.destination = e.result.translations.get(e.result.translations.languages[0]);
      });
    };

    this.translation.recognizing = (_, e) => {
      zone.run(() => {
        this.source = e.result.text;
        this.destination = e.result.translations.get(e.result.translations.languages[0]);
      });
    };

    this.translation.startContinuousRecognitionAsync();
  }

  ngOnDestroy(): void {
    this.translation.stopContinuousRecognitionAsync();
    this.translation.close();
  }

  toggle() {
    // Get the current language from the index
    const index = this.languages.indexOf(this.translation.targetLanguages[0]);

    // Get the next index (or reset to 0)
    const nextIndex = (index + 1) % this.languages.length;

    console.log('Switching language', this.languages[index], this.languages[nextIndex]);

    // Add the new language
    this.translation.addTargetLanguage(this.languages[nextIndex]);

    // Remove the old language
    this.translation.removeTargetLanguage(this.languages[index]);

    this.destination = undefined;
  }
}
