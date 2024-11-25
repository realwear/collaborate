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
