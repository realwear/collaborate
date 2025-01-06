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
import { Component, CUSTOM_ELEMENTS_SCHEMA, HostBinding, Input, ViewEncapsulation } from "@angular/core";
import { ButtonAppearance, ButtonSize } from "@fluentui/web-components";


@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'fluent-button-wrapper',
  standalone: true,
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
  encapsulation: ViewEncapsulation.Emulated,
  template: `
    <fluent-button
      [class.nowrap]="nowrap"
      [appearance]="appearance"
      [attr.disabled]="disabled ? 'disabled' : null"
      role="button"
      [class.warning]="isWarning"
      [class.success]="isSuccess"
      [class.danger]="isDanger"
      [size]="size"
      [title]="hfText">
        <ng-content></ng-content>
    </fluent-button>`
})
export class FluentButtonCustomComponent {
  @Input() appearance?: ButtonAppearance;

  @Input() size?: ButtonSize;

  @Input() nowrap?: boolean;

  @HostBinding('attr.aria-disabled') @Input() disabled?: boolean;

  @Input() mode?: null | 'success' | 'warning' | 'danger';

  @HostBinding('class.warning') get isWarning() { return this.mode === 'warning'; }
  @HostBinding('class.success') get isSuccess() { return this.mode === 'success'; }
  @HostBinding('class.danger') get isDanger() { return this.mode === 'danger'; }

  get hfText() {
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