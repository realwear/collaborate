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
/* eslint-disable @typescript-eslint/no-inferrable-types */
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { Observable, interval, map, shareReplay, startWith } from 'rxjs';
import { FluentButtonCustomComponent } from '../fluent-button.component';
import { UxlibModule } from '@nx/uxlib';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'nx-upcoming-meeting',
  standalone: true,
  imports: [ CommonModule, FluentButtonCustomComponent, UxlibModule, TranslateModule ],
  templateUrl: './upcoming-meeting.component.html',
  styleUrl: './upcoming-meeting.component.scss'
})
export class UpcomingMeetingComponent {

  @HostBinding('class.rw-card') @HostBinding('class.brand-left') readonly b = true;

  @Input() startTime: Date | null = null;

  @Input() meetingIndex: number = 1;

  @Input() title: string = '';

  @Input() organizer: string = '';

  @Output() joinMeeting = new EventEmitter<void>();

  @HostBinding('class.loading') @Input() loading: boolean = false;

  @HostBinding('class.empty') @Input() empty: boolean = false;

  readonly timeToMeeting$: Observable<Date> = this.createTimeToMeetingObs();

  createTimeToMeetingObs(): Observable<Date> {
    return interval(30 * 1000).pipe(
      startWith(true),
      map(() => this.startTime || new Date()),
      shareReplay(1)
    );
  }
}
