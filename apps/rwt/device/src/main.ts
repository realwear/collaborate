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
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { getBuildProps } from '@nx/uxlib';
import { ButtonDefinition, TextInputDefinition, SpinnerDefinition, FluentDesignSystem } from '@fluentui/web-components';

ButtonDefinition.define(FluentDesignSystem.registry);
TextInputDefinition.define(FluentDesignSystem.registry);
SpinnerDefinition.define(FluentDesignSystem.registry);

console.log(getBuildProps());

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));