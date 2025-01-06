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
