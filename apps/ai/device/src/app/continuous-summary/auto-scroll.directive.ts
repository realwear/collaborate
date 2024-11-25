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
