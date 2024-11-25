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
