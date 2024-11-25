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
import { Meta, StoryFn } from '@storybook/angular';
import { RoundedButtonComponent } from './rounded-button.component';

const meta: Meta<RoundedButtonComponent> = {
  component: RoundedButtonComponent,
  title: 'RoundedButtonComponent',
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    color: {
      options: ['primary', 'accent', 'warn', 'default'],
      control: { type: 'radio' },
      defaultValue: 'default'
    }
  }
};

export default meta;

const Template: StoryFn<RoundedButtonComponent> = (args: RoundedButtonComponent) => ({
  props: args,
  template: `<button nx-rounded-button color='${args.color}'>Button</button>`
});

export const Primary = Template.bind({});