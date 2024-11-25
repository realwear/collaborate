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
