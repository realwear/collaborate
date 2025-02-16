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
