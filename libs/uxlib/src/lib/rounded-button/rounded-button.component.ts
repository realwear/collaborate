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
import { Component, HostBinding, Input } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[nx-rounded-button],a[nx-rounded-button]',
  templateUrl: './rounded-button.component.html',
  styleUrl: './rounded-button.component.scss',
})
export class RoundedButtonComponent {
  @Input() color?: 'primary' | 'accent' | 'warn' | null = null;

  @HostBinding('class.rounded-button-primary') get isPrimary() {
    return this.color === 'primary';
  }

  @HostBinding('class.rounded-button-accent') get isAccent() {
    return this.color === 'accent';
  }

  @HostBinding('class.rounded-button-warn') get isWarn() {
    return this.color === 'warn';
  }

  @HostBinding('class.large') get isLarge() {
    return this.size === 'large';
  }

  @Input() size?: 'small' | 'large' | null = null;

  @HostBinding('title') get hfText() {
    const ret = 'hf_no_number';

    if (!this.extraCommands?.length) {
      return ret;
    }

    let commands: string[] = [];

    if (typeof this.extraCommands === 'string') {
      commands = [ this.extraCommands ];
    } else {
      commands = this.extraCommands;
    }

    return `${ret}|hf_commands:${commands.join(',')}`;
  }

  @Input() extraCommands?: string[] | string;
}
