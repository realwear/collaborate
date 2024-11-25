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
import { ApplicationConfig, importProvidersFrom, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { HttpEvent, HttpHandlerFn, HttpRequest, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideGPTSupport } from './gptsubject';
import { CapturedReport } from './capturedreport.service';
import { AzAuthModule, azureAuthInterceptor, DeviceCode2Service, TeamsChatService } from '@rw/auth';
import { provideAzureAuthConfig } from '@rw/speech';
import { IndustryService } from './industry.service';
import { MatDialogModule } from '@angular/material/dialog';
import { Observable, first, from, switchMap } from 'rxjs';
import { environment } from './environment/environment';

function gptFn(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  if (req.url.startsWith('/api/gpt') || req.url.startsWith('/api/sendgrid/') || req.url.startsWith('/api/pdf/')) {
    const codeService = inject(DeviceCode2Service);

    const serviceName = `api://${environment.azure.clientId}/services.read`;

    return from(codeService.fetchAccessToken([serviceName])).pipe(
      first(),
      switchMap((token) => {
        const headers = req.headers.set('Authorization', `Bearer ${token}`);
        const newReq = req.clone({ headers });
        return next(newReq);
      })
    );
  }

  return next(req);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideAnimations(),
    provideHttpClient(withFetch(), withInterceptors([gptFn, azureAuthInterceptor])),
    CapturedReport,
    provideGPTSupport(),
    importProvidersFrom(AzAuthModule.forRoot2(environment.azure.clientId, environment.azure.tenantId)),
    TeamsChatService,
    IndustryService,
    importProvidersFrom(MatDialogModule),
    provideAzureAuthConfig({
      subscriptionKey: environment.speech.subscriptionKey,
      region: environment.speech.region,
    }),
  ],
};
