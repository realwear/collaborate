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
import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { DICTATION_DIALOG_CONFIG, DictationDialogComponent } from './dictation-dialog.component';
import { WaveformVisualizerComponent } from '../waveform-visualizer/waveform-visualizer.component';
import { LaunchTestingDialogComponent, TESTING_DIALOG_OPTIONS, TESTING_DIALOG_TYPE } from '../testing';
import { DialogConfig, DialogModule } from '@angular/cdk/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RoundedButtonComponent } from '../rounded-button/rounded-button.component';
import { DottyComponent } from '../dotty/dotty.component';

const meta: Meta<LaunchTestingDialogComponent> = {
  component: LaunchTestingDialogComponent,
  decorators: [
    moduleMetadata({
      imports: [ DialogModule, MatProgressSpinnerModule ],
      declarations: [ WaveformVisualizerComponent, DictationDialogComponent, RoundedButtonComponent, DottyComponent ],
      providers: [
        {
          provide: TESTING_DIALOG_TYPE,
          useValue: DictationDialogComponent
        },
        {
          provide: TESTING_DIALOG_OPTIONS,
          useValue: {
            ...DICTATION_DIALOG_CONFIG
          } as DialogConfig
        }
      ]
    })
  ],
  title: 'DictationDialogComponent',
};
export default meta;
type Story = StoryObj<DictationDialogComponent>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  // play: async ({ canvasElement }) => {
  //   const canvas = within(canvasElement);
  //   expect(canvas.getByText(/dictation-dialog works!/gi)).toBeTruthy();
  // },
};
