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
import { Directive, ElementRef, Input, OnDestroy } from '@angular/core';
import { Subscription, filter, interval, tap } from 'rxjs';

@Directive({
  selector: '[rwAutoScroll]',
})
export class AutoScrollDirective implements OnDestroy {
  @Input('rwAutoScroll') isActive: boolean | null = false;

  readonly sub: Subscription;

  constructor(elementRef: ElementRef<HTMLElement>) {
    this.sub = interval(3000)
      .pipe(
        filter(() => !!this.isActive),
        tap(() => console.log('Scrolling'))
      )
      .subscribe(() => {
        // Scroll to very bottom smoothly
        elementRef.nativeElement.scrollTo({
          top: elementRef.nativeElement.scrollHeight,
          behavior: 'smooth',
        });
      });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
