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
import { Component, CUSTOM_ELEMENTS_SCHEMA, HostBinding, Input, ViewEncapsulation } from '@angular/core';
import { ButtonAppearance, ButtonSize } from '@fluentui/web-components';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'fluent-button-wrapper',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  encapsulation: ViewEncapsulation.Emulated,
  template: ` <fluent-button
    [class.nowrap]="nowrap"
    [appearance]="appearance"
    [attr.disabled]="disabled ? 'disabled' : null"
    role="button"
    [class.warning]="isWarning"
    [class.success]="isSuccess"
    [class.danger]="isDanger"
    [size]="size"
    [title]="hfText"
  >
    <ng-content></ng-content>
  </fluent-button>`,
})
export class FluentButtonCustomComponent {
  @Input() appearance?: ButtonAppearance;

  @Input() size?: ButtonSize;

  @Input() nowrap?: boolean;

  @HostBinding('attr.aria-disabled') @Input() disabled?: boolean;

  @Input() mode?: null | 'success' | 'warning' | 'danger';

  @HostBinding('class.warning') get isWarning() {
    return this.mode === 'warning';
  }
  @HostBinding('class.success') get isSuccess() {
    return this.mode === 'success';
  }
  @HostBinding('class.danger') get isDanger() {
    return this.mode === 'danger';
  }

  get hfText() {
    const ret = 'hf_no_number';

    if (!this.extraCommands?.length) {
      return ret;
    }

    let commands: string[] = [];

    if (typeof this.extraCommands === 'string') {
      commands = [this.extraCommands];
    } else {
      commands = this.extraCommands;
    }

    return `${ret}|hf_commands:${commands.join(',')}`;
  }

  @Input() extraCommands?: string[] | string;
}
