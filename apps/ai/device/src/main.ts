import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { getBuildProps } from '@nx/uxlib';

console.log(getBuildProps());

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
