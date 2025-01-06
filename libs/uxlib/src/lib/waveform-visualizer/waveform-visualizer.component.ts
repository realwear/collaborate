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
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'nx-waveform-visualizer',
  templateUrl: './waveform-visualizer.component.html',
  styleUrl: './waveform-visualizer.component.scss',
})
export class WaveformVisualizerComponent implements OnDestroy, OnInit {

  private audioContext?: AudioContext;
  private analyser?: AnalyserNode;

  readonly RESOLUTION = 4;
  readonly NUM_NODES = 512;

  private _canvas?: ElementRef<HTMLCanvasElement>;

  private _isDestroyed = false;
  private _animationStarted = false;

  private freqArray?: Uint8Array;

  private audioSourceNode?: MediaStreamAudioSourceNode;

  context?: CanvasRenderingContext2D | null;

  private _width?: number;
  private _height?: number;

  private readonly observer: ResizeObserver;

  @ViewChild('canvas') set canvas(value: ElementRef<HTMLCanvasElement> | undefined) {
    this._canvas = value;

    this.setCanvasSize();
  }

  get canvas() {
    return this._canvas;
  }

  constructor(private host: ElementRef) {
    this.observer = new ResizeObserver(entries => {
      this._width = entries[0].contentRect.width;
      this._height = entries[0].contentRect.height;

      this.setCanvasSize();
    });
  }

  private setCanvasSize() {
    if (!this._canvas) return;

    console.log('setCanvasSize', this._width, this._height);

    if (this._width) {
      this._canvas?.nativeElement.setAttribute('width', this._width.toString());
    }

    if (this._height) {
      this._canvas?.nativeElement.setAttribute('height', this._height.toString());
    }
  }

  ngOnInit(): void {
    this.observer.observe(this.host.nativeElement);

    this._width = this.host.nativeElement.clientWidth;
    this._height = this.host.nativeElement.clientHeight;

    this.setCanvasSize();

    if (this.useSelfStream) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        this.audioStream = stream;
      });
    }
  }

  @Input() useSelfStream = false;

  @Input() set audioStream(stream: MediaStream | null) {

    this.audioSourceNode?.disconnect();
    this.audioSourceNode = undefined;

    this.audioContext?.close();
    this.audioContext = undefined;

    if (!stream) {
      return;
    }

    if (!this.audioContext) {
      this.audioContext = new window.AudioContext();

      this.analyser = this.audioContext.createAnalyser();

      this.analyser.smoothingTimeConstant = 0.6;
      this.analyser.fftSize = this.NUM_NODES * 2;

      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;

      const binCount = this.analyser.frequencyBinCount;
      console.log('binCount', binCount);
      this.freqArray = new Uint8Array(binCount);
    }

    this.audioSourceNode = this.audioContext.createMediaStreamSource(stream);
    this.audioSourceNode.connect(this.analyser!);

    if (!this._animationStarted) {
      this._animationStarted = true;
      this.animate(this.audioContext.sampleRate);
    }
  }

  ngOnDestroy(): void {

    this._isDestroyed = true;

    if (this.useSelfStream) {
      this.audioStream?.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    this.audioContext?.close();
    this.audioSourceNode?.disconnect();

    this.observer.disconnect();
  }

  private previousFrame = 0;

  animate(sampleRate: number) {
    if (this._isDestroyed) {
      this._animationStarted = false;
      return;
    }

    // If there's no node
    if (!this.audioSourceNode) {
      this._animationStarted = false;
      return;
    }

    if (!this.canvas) {
      requestAnimationFrame(() => this.animate(sampleRate));
      return;
    }

    if (!this.context) {
      this.context = this.canvas.nativeElement.getContext('2d');
    }

    if (!this.context) {
      requestAnimationFrame(() => this.animate(sampleRate));
      return;
    }

    // Cap to 50%
    const fps = 30;
    const now = Date.now();
    const fpsInterval = 1000 / fps;
    const elapsed = now - this.previousFrame;

    if (elapsed < fpsInterval) {
      requestAnimationFrame(() => this.animate(sampleRate));
      return;
    }

    this.previousFrame = now - (elapsed % fpsInterval);

    this.analyser!.getByteFrequencyData(this.freqArray!);

    const ctx = this.context!;

    // Clear the frame
    ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);

    const WIDTH = this.canvas.nativeElement.width;

    const STEP_COUNT = this.freqArray!.length;

    const xStep = WIDTH / STEP_COUNT;

    const HEIGHT = this.canvas.nativeElement.height;
    const CENTER = HEIGHT / 2;
    const SCALE_FACTOR = HEIGHT / 256;

    const hueStep = 360 / STEP_COUNT;

    for (let t = 0; t < STEP_COUNT; t += this.RESOLUTION) {
      const x = t * xStep

      const A = this.freqArray![t];
      const full = CENTER + (A - 128) * SCALE_FACTOR;
      const h = full / 2

      const  hue = t * hueStep;
      ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`; // Full saturation and 50% lightness
      ctx.lineWidth = 4;

      ctx.beginPath();
      ctx.moveTo(x, CENTER);
      ctx.lineTo(x, CENTER + h); 
      ctx.stroke();

      ctx.beginPath(); 
      ctx.moveTo(x, CENTER);
      ctx.lineTo(x, CENTER - h);
      ctx.stroke();
    }

    requestAnimationFrame(() => this.animate(sampleRate));
  }
}
