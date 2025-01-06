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
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/* eslint-disable @typescript-eslint/no-var-requires */
const summarySystemEnergy = require('!!raw-loader!./prompts/energy/summary-system.txt').default;
const summarySystemHealthcare = require('!!raw-loader!./prompts/healthcare/summary-system.txt').default;
const summarySystemAutomotive = require('!!raw-loader!./prompts/automotive/summary-system.txt').default;
const summarySystemManufacturing = require('!!raw-loader!./prompts/manufacturing/summary-system.txt').default;

/* eslint-enable @typescript-eslint/no-var-requires */

const industryValues = ['Energy', 'Healthcare', 'Manufacturing', 'Automotive', 'Chemical Spill'] as const;
export type Industries = (typeof industryValues)[number];

@Injectable()
export class IndustryService {
  readonly currentIndustry$: BehaviorSubject<Industries>;

  constructor() {
    // Fetch the default industry from the local storage
    const industry = localStorage.getItem('rw-industry') as Industries;

    // Make sure the save value is one of the selected industries
    if (industry && industryValues.includes(industry)) {
      this.currentIndustry$ = new BehaviorSubject(industry);
    } else {
      this.currentIndustry$ = new BehaviorSubject<Industries>('Energy');
    }
  }

  get currentIndustry(): Industries {
    return this.currentIndustry$.value;
  }

  get systemMessages(): SystemMessages {
    switch (this.currentIndustry) {
      case 'Automotive':
        return new AutomotiveMessages();
      case 'Healthcare':
        return new HealthcareMessages();
      case 'Energy':
        return new EnergyMessages();
      case 'Manufacturing':
        return new ManufacturingMessages();
      default:
        throw new Error('Invalid industry');
    }
  }

  switchIndustry(industry: Industries) {
    console.log(`Switching to ${industry}`);

    // Validate
    if (!industryValues.includes(industry)) {
      throw new Error('Invalid industry');
    }

    this.currentIndustry$.next(industry);

    // Save the industry to the local storage
    localStorage.setItem('rw-industry', industry);
  }
}

interface SystemMessages {
  summary: string;
  incident: string;

  summaryTitle: string;
  summaryDescription: string;

  handoverCommand: string;
}

class AutomotiveMessages implements SystemMessages {
  summary = summarySystemAutomotive;

  summaryTitle = 'Vehicle Handover Report';
  summaryDescription = 'vehicle handover';

  incident = 'Automotive Incident';

  handoverCommand = 'Vehicle Handover';
}

class HealthcareMessages implements SystemMessages {
  summary = summarySystemHealthcare;

  summaryTitle = 'Healthcare Shift Change Report';
  summaryDescription = 'shift change';

  incident = 'Healthcare Incident';

  handoverCommand = 'Shift Change';
}

class EnergyMessages implements SystemMessages {
  summary = summarySystemEnergy;

  summaryTitle = 'Energy Shift Change Report';
  summaryDescription = 'shift change';

  incident = 'Energy Incident';

  handoverCommand = 'Shift Change';
}

class ManufacturingMessages implements SystemMessages {
  summary = summarySystemManufacturing;

  summaryTitle = 'Manufacturing Shift Change Report';
  summaryDescription = 'shift change';

  incident = 'Manufacturing Incident';

  handoverCommand = 'Shift Change';
}
