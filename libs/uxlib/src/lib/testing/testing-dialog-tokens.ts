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
import { DialogConfig } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { InjectionToken } from '@angular/core';

export const TESTING_DIALOG_TYPE = new InjectionToken<ComponentType<unknown>>('Component to use for testing');

export const TESTING_DIALOG_OPTIONS = new InjectionToken<DialogConfig>('Options to use for testing dialog');