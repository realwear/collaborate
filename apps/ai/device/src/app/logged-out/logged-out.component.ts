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
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoggedOutBaseComponent } from '@rw/auth';
import { UxlibModule } from '@nx/uxlib';

@Component({
  selector: 'nx-logged-out',
  standalone: true,
  imports: [CommonModule, UxlibModule],
  templateUrl: './logged-out.component.html',
  styleUrl: './logged-out.component.scss',
})
export class LoggedOutComponent extends LoggedOutBaseComponent {
  override signin(): void {
    const graphScopes = ['User.Read', 'openid', 'profile', 'Chat.ReadWrite', 'Files.ReadWrite'];

    this.deviceCodeService.start(...graphScopes);
  }
}
