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
