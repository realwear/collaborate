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
import { AudioConfig, SpeakerAudioDestination, SpeechConfig, SpeechSynthesisOutputFormat, SpeechSynthesisResult, SpeechSynthesizer } from 'microsoft-cognitiveservices-speech-sdk';
import { AudioOutputFormatImpl } from 'microsoft-cognitiveservices-speech-sdk/distrib/lib/src/sdk/Audio/AudioOutputFormat';
import {Mutex, withTimeout} from 'async-mutex';

const supportTalker = true;
const supportCache = false;
const debugInformation = true;
// const audioFormat = SpeechSynthesisOutputFormat.Webm24Khz16BitMonoOpus;
const audioFormat = SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3;

@Injectable()
export class TalkerService {

  private synthesizer?: SpeechSynthesizer;

  private player?: SpeakerAudioDestination;

  private _mutex = withTimeout(new Mutex(), 8000);

  constructor(private speechConfig: SpeechConfig) {
  }

  createSynthesizer() {
    if (this.synthesizer) {
      return;
    }

    if (!this.player) {
      this.player = createOpusPlayer();
    }

    this.synthesizer = createOpusSynthesizer(this.speechConfig, this.player);
  }

  appendBuffer(arrayBuffer: ArrayBuffer) {
    if (!supportTalker) return;

    this.createSynthesizer();

    return new Promise<void>(done => {
      this.player?.write(arrayBuffer, () => done(), error => {
        console.error(error);
        done();
      });
    });
  }

  async deleteCache() {
    await caches.delete("tts-cache");
  }

  reset() {
    this.player?.pause();

    // Close the player and the synthesizer

    this.player?.close();
    this.player = undefined;

    this.synthesizer?.close();
    this.synthesizer = undefined;
  }

  async speakNext(text: string, shouldCache = true) {
    if (!supportTalker) return;

    // await this._mutex.runExclusive(() => this._speakNext(text, shouldCache));
    await this._speakNext(text, shouldCache);
  }

  private async _speakNext(text: string, shouldCache: boolean) {
    if (!text?.trim()?.length) {
      return;
    }

    // Format to SSML
    text = formatSsml(text);

    this.createSynthesizer();

    console.log("Speaking Text", { text, shouldCache });

    if (shouldCache) {
      const fetchAudioBuffer = await this.fetchFromStorage(text);

      if (fetchAudioBuffer) {
        console.log("Playing from cache", text);
        await this.appendBuffer(fetchAudioBuffer);
        return;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const result = await speakSsmlAsync(this.synthesizer!, text);

    if (!shouldCache) {
      // this.player?.close();
      return;
    }

    await this.saveToStorage(text, result.audioData);

    // this.player?.close();
  }

  private async fetchFromStorage(text: string) {

    if (!supportCache) {
      return null;
    }

    // Hash the text to SHA256 Hex
    const filename = await createHashFileName(text);

    const storage = await caches.open("tts-cache");

    const matched = await storage.match(filename);

    if (!matched?.ok) {
      return null;
    }

    const ret = await matched.arrayBuffer();

    if (debugInformation) {
      console.debug("Fetched from Cache", {filename, bufferLength: ret.byteLength});
    }

    return ret;
  }

  private async saveToStorage(text: string, buffer: ArrayBuffer) {

    if (!supportCache) {
      return;
    }

    const filename = await createHashFileName(text);

    if (debugInformation) {
      console.debug("Saving to Cache", {filename, bufferLength: buffer.byteLength});
    }

    const storage = await caches.open("tts-cache");

    const response = new Response(buffer);
    response.headers.set("Content-Length", buffer.byteLength.toString());

    await storage.put(filename, response);
  }

  async speakExclusiveAsync(text: string, shouldCache = true) {
    if (!supportTalker) return;

    text = formatSsml(text);

    const internalPlayer = createOpusPlayer();

    const synthesizer = createOpusSynthesizer(this.speechConfig, internalPlayer);

    const foundBuffer = await this.fetchFromStorage(text);

    if (foundBuffer) {

      if (debugInformation) {
        console.debug(`Exclusive Speech (Cached)`, {text, bufferLength: foundBuffer.byteLength});
      }

      internalPlayer.write(foundBuffer, () => {
        if (debugInformation) console.debug("Finished Playing from Cache", {text, bufferLength: foundBuffer.byteLength});

        internalPlayer.close()
      }, error => {
        if (!debugInformation) return;

        console.error("Unable to Write to audio buffer", error);
      });
    } else {
      console.log(`Exclusive Speech`, {text});

      const result = await speakSsmlAsync(synthesizer, text);

      if (shouldCache) {
        await this.saveToStorage(text, result.audioData);
      }

      // Close the player
      internalPlayer.close();
    }

    await new Promise<void>(done => {
      internalPlayer.onAudioEnd = () => {
        done();
      };
    });
  }
}

function formatSsml(text: string) {
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" xml:lang="en-US">
  <voice name="en-US-AriaNeural"><mstts:express-as style="friendly">${text}</mstts:express-as></voice>
  </speak>`;
}

async function createHashFileName(text: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  const hashStr = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 8);

  const mimeType = AudioOutputFormatImpl.SpeechSynthesisOutputFormatToString[audioFormat];

  // Filename is the first 20 chars, url encoded, appended with the end and ending in .audio
  const ret = hashStr + "-" + mimeType + ".audio";

  if (debugInformation) {
    console.debug("Hashed Filename", ret);
  }

  return ret;
}

async function speakSsmlAsync(synthesizer: SpeechSynthesizer, text: string) {
  return new Promise<SpeechSynthesisResult>((done, reject) => {
    synthesizer.speakSsmlAsync(text, result => {

      if (debugInformation) {
        console.debug("Speech Synthesis Result", result);
      }

      if (result.errorDetails) {
        reject(result);
        return;
      }

      done(result);
    });
  });
}

function createOpusSynthesizer(speechConfig: SpeechConfig, player: SpeakerAudioDestination) {

  speechConfig.speechSynthesisLanguage = "en-US";
  speechConfig.speechSynthesisVoiceName = "en-US-EmmaNeural";

  speechConfig.speechSynthesisOutputFormat = audioFormat;
  return new SpeechSynthesizer(speechConfig, AudioConfig.fromSpeakerOutput(player));
}

function createOpusPlayer() {
  const internalPlayer = new SpeakerAudioDestination();

  return internalPlayer;
}
