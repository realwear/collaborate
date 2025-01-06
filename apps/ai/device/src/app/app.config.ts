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
