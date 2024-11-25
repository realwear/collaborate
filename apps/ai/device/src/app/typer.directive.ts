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
import { Directive, ElementRef, Input } from '@angular/core';
import { TextBuilderSubject } from './textbuildersubject';

@Directive({
  standalone: true,
  selector: '[nxAppAsyncTyper], nx-app-async-typer',
})
export class AsyncTyperDirective {
  @Input('nxAppAsyncTyper') set text(value: TextBuilderSubject) {
    const thisElement = this.elementRef.nativeElement as HTMLElement;

    if (!value) {
      thisElement.innerText = '';
      return;
    }

    thisElement.innerText = value.value || '';

    value.subscribe((text) => {
      thisElement.append(text);
    });

    value.reset$.subscribe(() => {
      thisElement.innerText = '';
    });
  }

  constructor(private elementRef: ElementRef) {}
}
