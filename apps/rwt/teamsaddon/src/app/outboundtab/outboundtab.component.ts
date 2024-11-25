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
import { CUSTOM_ELEMENTS_SCHEMA, Component, ElementRef, HostBinding, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { app, authentication } from '@microsoft/teams-js';
import { TextInput, setTheme } from '@fluentui/web-components';
import { teamsDarkTheme, teamsLightTheme, teamsHighContrastTheme } from '@fluentui/tokens';
import { FormControl, FormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { HelpDialogComponent } from '../dialog/dialog.component';
import { HelpDialogData, HelpDialogType } from '../dialog/dialog.types';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, MatDialogModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './outboundtab.component.html',
  styleUrl: './outboundtab.component.scss',
})
export class OutboundTabComponent {
  readonly roomCodeControl = new FormControl('', [Validators.required]);

  private currentContext: app.Context | null = null;

  // Hide the entire component until the context is loaded
  @HostBinding('class.hidden') hidden = true;

  readonly authState$ = new BehaviorSubject<'loading' | 'authenticated' | 'unauthenticated' | 'outside'>('loading');

  @ViewChild('dialogTemplate', { static: true }) dialogTemplate!: TemplateRef<unknown>;

  private handleTheme(theme: string) {
    this.hidden = false;
    switch (theme) {
      case 'dark':
        setTheme(teamsDarkTheme);
        break;
      case 'contrast':
        setTheme(teamsHighContrastTheme);
        break;
      default:
        setTheme(teamsLightTheme);
        break;
    }
  }

  @ViewChild('roomCode') set roomValue(value: ElementRef<TextInput>) {
    if (!value) {
      return;
    }

    value.nativeElement.value = this.roomCodeControl.value || '';

    this.roomCodeControl.valueChanges.subscribe((newValue) => {
      value.nativeElement.value = newValue || '';
    });

    value.nativeElement.oninput = () => {
      this.roomCodeControl.setValue(value.nativeElement.value?.toLocaleUpperCase());
      this.roomCodeControl.markAsTouched();
    };

    value.nativeElement.onkeydown = (keyDownEvent) => {
      if (keyDownEvent.key === 'Enter') {
        this.roomCodeControl.markAsTouched();
        this.joinMeeting();
      }
    };
  }

  constructor(private translationService: TranslateService, private dialog: MatDialog) {
    translationService.setDefaultLang('en');

    // If we don't have a context after 1 second, set the theme to Light to at least display something
    let hasInitialised = false;
    setTimeout(() => {
      if (!hasInitialised) {
        this.handleTheme('light');
      }
    }, 1000);

    app.initialize().then(
      () => {
        hasInitialised = true;
        app.getContext().then((context) => {
          // Save the context
          this.currentContext = context;

          this.handleTheme(context.app.theme);

          let currentLanguage = 'en';

          if (context.app.locale?.startsWith('fr')) {
            currentLanguage = 'fr';
          } else if (context.app.locale?.startsWith('es')) {
            currentLanguage = 'es';
          } else if (context.app.locale?.startsWith('ja')) {
            currentLanguage = 'ja';
          } else if (context.app.locale?.startsWith('de')) {
            currentLanguage = 'de';
          }

          // currentLanguage = 'es'; // UNCOMMENT TO OVERRIDE THE LANGUAGE

          translationService.use(currentLanguage);
        });

        this.startAuthTokenFlow();

        app.registerOnThemeChangeHandler((theme) => {
          this.handleTheme(theme);
        });
      },
      (error) => {
        console.debug('Error initializing Teams:', error);

        translationService.use(translationService.getBrowserLang() || 'en');

        this.authState$.next('outside');
      }
    );
  }

  startAuthTokenFlow() {
    return authentication.getAuthToken().then(
      (token) => {
        fetch('/api/createmeeting/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        }).then(
          (response) => {
            this.authState$.next(response.status === 204 ? 'authenticated' : 'unauthenticated');
            // this.authState$.next('unauthenticated'); // UNCOMMENT TO FORCE THE CONSENT FLOW
          },
          () => {
            this.authState$.next('unauthenticated');
          }
        );
      },
      () => {
        this.authState$.next('unauthenticated');
      }
    );
  }

  consent() {
    if (!this.currentContext) {
      return;
    }

    authentication
      .authenticate({
        url: window.location.origin + `/tabauth?tid=${this.currentContext.user?.tenant?.id}&upn=${this.currentContext.user?.loginHint}`,
        width: 600,
        height: 535,
      })
      .then(() => {
        this.consentSuccess();
      })
      .catch(() => {
        this.consentFailure();
      });
  }

  //Callback function for a successful authorization
  consentSuccess() {
    this.startAuthTokenFlow();
  }

  consentFailure() {
    // console.error("Consent failed: ", reason);
    // this.setState({ error: true });
  }

  joinMeeting() {
    this.roomCodeControl.disable();
    authentication.getAuthToken().then(
      (token) => {
        fetch(window.location.origin + '/api/createmeeting', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: token,
            connectCode: this.roomCodeControl.value?.toLocaleUpperCase()?.trim(),
            subject: this.translationService.instant('connect_meeting_subject'),
          }),
        })
          .then(
            (response) => {
              if (response.ok) return response.json();

              throw new Error('Failed to create meeting');
            },
            () => {
              throw new Error('Failed to create meeting');
            }
          )
          .then(
            (data) => {
              this.roomCodeControl.enable();
              return app.openLink(data.joinUrl).then(() => console.log('OPENED'), console.error);
            },
            (error) => {
              console.error('Failed to create meeting', error);
              this.roomCodeControl.enable();

              this.roomCodeControl.setErrors({ invalid: true });
            }
          );
      },
      () => {
        console.error('Failed to get auth token');
      }
    );
  }

  openDialog(dataType: HelpDialogType): void {
    const dialogData = this.getDialogData(dataType);

    this.dialog.open(HelpDialogComponent, {
      data: dialogData,
      panelClass: 'help-dialog',
    });
  }

  getDialogData(type: HelpDialogType): HelpDialogData {
    const dialogDataMap: { [name: string]: HelpDialogData } = {
      power: {
        type: 'power',
        titleKey: 'connect_help_step1_header',
        imgSrc: 'assets/power_button.webp',
        imgAlt: 'RealWear Headset Power Button',
      },
      wifi: {
        type: 'wifi',
        titleKey: 'connect_help_step2_header',
        imgSrc: 'assets/wifi.png',
        imgAlt: 'RealWear Headset WiFi Setup',
      },
      code: {
        type: 'code',
        titleKey: 'connect_help_step3_header',
        imgSrc: 'assets/connect_code.png',
        imgAlt: 'RealWear Headset Support Code',
      },
    };
    return dialogDataMap[type];
  }
}
