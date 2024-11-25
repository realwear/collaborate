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
