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
import { Route } from '@angular/router';
import { RealTimeTranslationModule } from './real-time-translation/real-time-translation.module';
import { IntroComponent } from './intro/intro.component';
import { FaultReporterModule } from './fault-reporter/fault-reporter.module';
import { ContinuousSummaryModule } from './continuous-summary/continuous-summary.module';
import { LoggedOutComponent } from './logged-out/logged-out.component';
import { loginAuthGuard } from '@rw/auth';
import { PhotoTestComponent } from './photo-test/photo-test.component';
import { ScratchComponent } from './scratch/scratch.component';
import { ChemicalSpillComponent } from './chemical-spill/chemical-spill.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: IntroComponent,
    canActivate: [loginAuthGuard('/login')],
  },
  {
    path: 'scratch',
    component: ScratchComponent,
  },
  {
    path: 'spill',
    component: ChemicalSpillComponent,
  },
  {
    path: 'photo',
    component: PhotoTestComponent,
  },
  {
    path: 'login',
    component: LoggedOutComponent,
  },
  {
    path: 'rtt',
    loadChildren: () => RealTimeTranslationModule,
  },
  {
    path: 'report',
    loadChildren: () => FaultReporterModule,
  },
  {
    path: 'summary',
    loadChildren: () => ContinuousSummaryModule,
  },
];
