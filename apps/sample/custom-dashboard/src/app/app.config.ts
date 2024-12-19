import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { azureAuthInterceptor, provideAzureAdConfig } from '@rw/auth';
import { environment } from './environment/environment';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAzureSpeechAuthConfig } from '@rw/speech';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([azureAuthInterceptor])),
    provideAzureAdConfig(environment.azure.clientId, environment.azure.tenantId),
    provideAzureSpeechAuthConfig({
      subscriptionKey: environment.speech.subscriptionKey,
      region: environment.speech.region,
    }),
  ],
};
