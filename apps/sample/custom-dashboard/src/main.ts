import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { ButtonDefinition, FluentDesignSystem } from '@fluentui/web-components';

ButtonDefinition.define(FluentDesignSystem.registry);

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
