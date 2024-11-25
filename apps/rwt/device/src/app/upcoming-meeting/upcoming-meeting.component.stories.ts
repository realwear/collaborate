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