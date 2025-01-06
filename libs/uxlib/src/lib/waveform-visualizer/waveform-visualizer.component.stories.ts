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
import type { Meta, StoryObj } from '@storybook/angular';
import { WaveformVisualizerComponent } from './waveform-visualizer.component';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

const meta: Meta<WaveformVisualizerComponent> = {
  component: WaveformVisualizerComponent,
  title: 'WaveformVisualizerComponent',
};
export default meta;
type Story = StoryObj<WaveformVisualizerComponent>;

export const Primary: Story = {
  args: {
    audioStream: null,
  },
};

export const Heading: Story = {
  args: {
    audioStream: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/waveform-visualizer works!/gi)).toBeTruthy();
  },
};
