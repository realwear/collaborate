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
import { inject, ModuleWithProviders, NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { AzureSignInDialogComponent } from './azure-sign-in-dialog/azure-sign-in-dialog.component';
import { CommonModule } from '@angular/common';
import { UxlibModule } from '@nx/uxlib';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TokenRefresherFactoryService } from './token-refresher.service';
import { LocalStorageService } from './local-storage.service';
import { DeviceCode2Service } from './device-code2.service';
import { AZURE_CLIENT_ID } from './client-id.token';
import { AZURE_TENANT } from './tenant-id.token';
import { HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpHandlerFn, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [AzureSignInDialogComponent],
  imports: [MatDialogModule, MatProgressSpinnerModule, CommonModule, UxlibModule, TranslateModule],
  exports: [AzureSignInDialogComponent],
})
export class AzAuthModule {
  static forRoot2(clientId: string, tenantId: string | null): ModuleWithProviders<AzAuthModule> {
    console.debug('Initialising Auth for client ID: ', clientId);

    return {
      ngModule: AzAuthModule,
      providers: [
        LocalStorageService,
        DeviceCode2Service,
        TokenRefresherFactoryService,
        {
          provide: AZURE_CLIENT_ID,
          useValue: clientId,
        },
        {
          provide: AZURE_TENANT,
          useValue: tenantId,
        },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AzureAuthInterceptor,
          multi: true,
        },
      ],
    };
  }
}

class AzureAuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return azureAuthInterceptor(req, next.handle);
  }
}

export function azureAuthInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  // If the request starts with /api/auth, then add 2 headers to the request
  if (!req.url.startsWith('/api/auth')) {
    return next(req);
  }

  const clientId = inject(AZURE_CLIENT_ID);
  const tenantId = inject(AZURE_TENANT);

  const headers: { [name: string]: string | string[] } = {};

  headers['x-rw-client-id'] = clientId;

  if (tenantId) {
    headers['x-rw-tenant-id'] = tenantId;
  }

  const newReq = req.clone({
    setHeaders: headers,
  });

  return next(newReq);
}
