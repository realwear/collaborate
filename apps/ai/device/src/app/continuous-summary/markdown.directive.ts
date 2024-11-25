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
import { marked } from 'marked';

@Directive({
  selector: '[rwMarkdown]',
})
export class MarkdownDirective {
  @Input() set rwMarkdown(value: string | null) {
    if (!value) {
      this.elementRef.nativeElement.innerHTML = '';
      return;
    }

    this.elementRef.nativeElement.innerHTML = marked.parse(value) as string;
  }

  constructor(private elementRef: ElementRef<HTMLElement>) {}
}
