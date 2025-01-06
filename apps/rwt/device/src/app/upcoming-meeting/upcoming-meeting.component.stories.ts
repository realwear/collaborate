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
import { Meta, moduleMetadata } from '@storybook/angular';
import { UpcomingMeetingComponent } from './upcoming-meeting.component';
import { mockDateDecorator } from 'storybook-mock-date-decorator';
/* eslint-disable @nx/enforce-module-boundaries */
import { RelativeDatePipe } from 'libs/uxlib/src/lib/relative-date.pipe';
import { RoundedButtonComponent } from 'libs/uxlib/src/lib/rounded-button/rounded-button.component';
/* eslint-enable @nx/enforce-module-boundaries */

const meta: Meta<ExtraArgs> = {
  component: UpcomingMeetingComponent,
  decorators: [
    mockDateDecorator,
    moduleMetadata({
      declarations: [RoundedButtonComponent, RelativeDatePipe],
    }),
  ],
  title: 'UpcomingMeetingComponent',
  parameters: {
    layout: 'centered',
    date: new Date(2024, 1, 1, 12, 0, 0, 0)
  },
  argTypes: {
    dateDelta: {
        control: 'inline-radio',
        options: ['previous', '0s', '30s', '1min', '5min', '1hour', '6hour']
    },
  },
  args: {
    meetingIndex: 1,
    title: 'My Meeting',
    organizer: 'Fred Smith',
    dateDelta: '0s',
    loading: false
  },
};

export default meta;

export const Primary = (args: ExtraArgs) => {

    console.log(args.dateDelta);

    return {
        props: { ...args, startTime: addDrift(args.dateDelta) }
    };
};

type DateDelta = 'previous' | '0s' | '30s' | '1min' | '5min' | '1hour' | '6hour';

type ExtraArgs = UpcomingMeetingComponent & { dateDelta: DateDelta };

function addDrift(delta?: DateDelta) {

    const now = new Date();

    switch (delta) {
        case 'previous':
            return new Date(now.valueOf() - 1000 * 60 * 60 * 24);
        case '0s':
            return now;
        case '30s':
            return new Date(now.valueOf() + 1000 * 30);
        case '1min':
            return new Date(now.valueOf() + 1000 * 60);
        case '5min':
            return new Date(now.valueOf() + 1000 * 60 * 5);
        case '1hour':
            return new Date(now.valueOf() + 1000 * 60 * 60);
        case '6hour':
            return new Date(now.valueOf() + 1000 * 60 * 60 * 6);
    }

    return new Date();
}