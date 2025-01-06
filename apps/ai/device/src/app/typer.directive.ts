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
