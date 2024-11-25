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
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  beforeEachModeLang,
  forEachLang,
  forEachMode,
  getLangFixture,
  mockLoginIntercepts,
  prepareRealWearViewport,
  screenshot2,
  setupAndroidInterfaceSpy,
} from '../support/app.po';
import * as d from 'dayjs';

prepareRealWearViewport();

beforeEach(() => {
  cy.intercept('https://graph.microsoft.com/oidc/userinfo', (req) => {
    // Status code for not implemented
    req.reply(501);
  });

  cy.intercept('https://graph.microsoft.com/v1.0/me/calendarview*', (req) => {
    // Status code for not implemented
    req.reply(501);
  });
});

const setupMeetingInfra = (lang: string, baseTime: Date, ...meetings: (Date | { name: string; meetingTime: Date })[]) => {
  const meetingsToAdd: any[] = [];

  for (const meetingInstance of meetings) {
    const meetingTime: Date = meetingInstance instanceof Date ? meetingInstance : meetingInstance.meetingTime;

    const meetingTimeUTC = new Date(meetingTime.getTime() + meetingTime.getTimezoneOffset() * 60000);

    meetingsToAdd.push({
      isOnlineMeeting: true,
      isReminderOn: true,
      onlineMeetingProvider: 'teams',
      subject: 'name' in meetingInstance ? meetingInstance.name : 'Meeting',
      onlineMeeting: { joinUrl: 'https://teams.com' },
      start: { dateTime: meetingTimeUTC.toISOString(), timezone: 'UTC' },
      organizer: { emailAddress: { name: 'Fred Organizer' } },
    });
  }

  cy.clock().then((clock) => {
    clock.setSystemTime(baseTime);
  });

  cy.intercept('GET', 'https://graph.microsoft.com/v1.0/me/calendarview*', {
    value: meetingsToAdd,
  }).as('calendarview');

  cy.wait('@calendarview');

  cy.get('.rw-card.loading').should('not.exist');
  cy.get('nx-upcoming-meeting').should('have.length', meetings.length);

  meetingsToAdd.forEach(() => {
    cy.get('.rw-card').contains('Meeting');
    cy.get('.rw-card').contains('Fred Organizer');
  });

  getLangFixture(lang).then((json) => {
    meetings.forEach((meeting, i) => {
      cy.get('.rw-card').contains(json.meetings_join_number.replace('{{number}}', (i + 1).toString()));
    });
  });
};

let tokens: string | undefined;

describe('meetings', () => {
  beforeEach(() => {
    mockLoginIntercepts();

    cy.visit('/', {
      onBeforeLoad: (win) => {
        if (tokens) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          win.localStorage.setItem('rw-tokens2', tokens!);
        }
      },
    });

    cy.session('user1', () => {
      cy.visit('/');
      cy.get('fluent-button').click();

      cy.wait('@code2_success');
      cy.wait('@token2_success');

      cy.window().then((win) => {
        tokens = JSON.stringify(win.localStorage.getItem('rw-tokens2'));
      });

      cy.get('.sign-out').should('exist');
    });
  });

  it('should show a really long meeting and ellipsize', () => {
    cy.visit('/');

    // Generate a random long string of 200 chars with spaces in the words (group 3-5 chars together)
    const longString = Array.from({ length: 200 }, () => {
      return Array.from({ length: Math.floor(Math.random() * 3) + 3 }, () => {
        return String.fromCharCode(Math.floor(Math.random() * 26) + 65);
      }).join('');
    }).join(' ');

    const baseTime = new Date('2024-01-01T00:00:00Z');

    // Meeting time = baseTime + 2hrs
    const meetingTime = new Date('2024-01-01T02:33:00Z');

    setupMeetingInfra('en', baseTime, { name: longString, meetingTime });

    // TODO - Add a check here
  });

  forEachMode((mode) => {
    forEachLang((lang) => {
      describe(`meetings - ${lang} - ${mode}`, () => {
        beforeEachModeLang(mode, lang);

        it('should show the full name for no given name', () => {
          cy.intercept('GET', 'https://graph.microsoft.com/oidc/userinfo', (req) => {
            req.reply({
              name: 'Fred User',
              given_name: null,
            });
          });

          getLangFixture(lang).then((json) => {
            cy.get('.welcome').contains(json.meetings_welcome.replace('{{name}}', 'Fred User'));
          });
        });

        it('should show the given name', () => {
          cy.intercept('GET', 'https://graph.microsoft.com/oidc/userinfo', (req) => {
            req.reply({
              name: 'Fred User',
              given_name: 'Fred',
            });
          });

          getLangFixture(lang).then((json) => {
            cy.get('.welcome').contains(json.meetings_welcome.replace('{{name}}', 'Fred'));
          });
        });

        it('should show empty meetings', () => {
          cy.intercept('GET', 'https://graph.microsoft.com/v1.0/me/calendarview*', (req) => {
            req.reply({ value: [] });
          }).as('calendarview_empty');

          cy.visit('/');

          cy.get('.sign-out').should('exist');

          // Expect to see the class .rw-card.loading 3 times
          cy.get('.rw-card.loading').should('have.length', 3);

          cy.wait('@calendarview_empty');

          getLangFixture(lang).then((json) => {
            cy.get('.sign-out').contains(json.sign_out);
            cy.get('.meetings').contains(json.meetings_empty_list);
          });

          screenshot2();
        });

        describe('connect to me', () => {
          it('should display a spinner when generating the connect code', () => {
            // Check that mat-spinner exists inside nx-connect-code
            cy.get('nx-connect-code mat-spinner').should('exist').log('Spinner exists');

            // Check that mat-spinner disappears
            cy.get('nx-connect-code mat-spinner').should('not.exist').log('Spinner removed');
          });

          it('should display a connect code', () => {
            // Wait for text (trim) to have more length than 0
            cy.get('nx-connect-code')
              .invoke('text')
              .should('have.length.gt', 1)
              .then((text) => {
                expect(text.trim()).to.match(/^[A-Za-z0-9]{5}$/);
              });
          });

          it('should display a new connect code when onPause/onResume event is triggered', () => {
            // Wait for text (trim) to have more length than 0
            cy.get('nx-connect-code')
              .invoke('text')
              .should('have.length.gt', 1)
              .then((text) => {
                expect(text.trim()).to.match(/^[A-Za-z0-9]{5}$/);
              });

            // Trigger the rwt_onPause event
            cy.window().then((win) => {
              win.document.dispatchEvent(new Event('rwt_onPause'));
            });

            // Wait for the code fetcher service to completely stop
            // eslint-disable-next-line cypress/no-unnecessary-waiting
            cy.wait(1000);

            let existingCode: string | undefined;

            // Wait for text (trim) to have nothing inside it
            cy.get('nx-connect-code')
              .invoke('text')
              .should('have.length.lte', 1)
              .then((text) => {
                existingCode = text.trim();
                expect(text.trim()).to.match(/^$/);
              });

            // Wait for the spinner to appear, because the code is being refreshed
            cy.get('nx-connect-code mat-spinner').should('exist');

            // Trigger the rwt_onResume event
            cy.window().then((win) => {
              win.document.dispatchEvent(new Event('rwt_onResume'));
            });

            // Wait for the spinner to disappear
            cy.get('nx-connect-code mat-spinner').should('not.exist');

            // Wait for text (trim) to have more length than 0
            cy.get('nx-connect-code')
              .invoke('text')
              .should('have.length.gt', 1)
              .then((text) => {
                expect(text.trim()).to.match(/^[A-Za-z0-9]{5}$/);
                expect(text.trim()).not.to.equal(existingCode);
              });
          });

          it.skip('should display an error if the code has expired', () => {
            // Not Implemented Yet
          });

          it('should flash when the code is nearing expiry', () => {
            cy.clock().then((clock) => {
              // Set the system time to now
              clock.setSystemTime(new Date());
            });

            let existingCode = '';

            // Wait for text (trim) to have more length than 0
            cy.get('nx-connect-code')
              .invoke('text')
              .should('have.length.gt', 1)
              .then((text) => {
                expect(text.trim()).to.match(/^[A-Za-z0-9]{5}$/);
                existingCode = text.trim();
              });

            // Advance the time by 60 seconds
            cy.tick(60000);

            cy.on('fail', () => {
              throw new Error('This code only works in Development mode as the timings are different');
            });

            cy.get('nx-connect-code').should('have.class', 'refreshing');

            // Advance the time by 20 seconds
            cy.tick(20000);

            cy.get('nx-connect-code').should('not.have.class', 'refreshing');

            // Wait for the code to be updated and to be different than existing code
            cy.get('nx-connect-code')
              .invoke('text')
              .should('have.length.gt', 1)
              .then((text) => {
                expect(text.trim()).to.match(/^[A-Za-z0-9]{5}$/);
                expect(text.trim()).to.not.equal(existingCode);
              });
          });
        });

        describe('1 meeting', () => {
          it('should show 1 meeting more than 60 minutes away', () => {
            const baseTime = new Date('2024-01-01T00:00:00Z');

            // Meeting time = baseTime + 2hrs
            const meetingTime = new Date('2024-01-01T02:33:00Z');

            setupMeetingInfra(lang, baseTime, meetingTime);

            getLangFixture(lang).then((json) => {
              const timeformat = json.relative_date_format;
              const time = d(meetingTime).format(timeformat);
              cy.get('.rw-card').contains(time.toLocaleUpperCase());
            });
          });

          it('should show 1 meeting less than 60 minutes away', () => {
            const baseTime = new Date('2024-01-01T00:00:00Z');

            // Meeting time = baseTime + 30mins
            const meetingTime = new Date('2024-01-01T00:30:00Z');

            setupMeetingInfra(lang, baseTime, meetingTime);

            getLangFixture(lang).then((json) => {
              const relative_minutes = json.relative_date_minutes;

              cy.get('.rw-card').contains(relative_minutes.replace('{{minutesUntil}}', '30'));
            });
          });

          it('should show 1 meeting less than 1 minute away', () => {
            const baseTime = new Date('2024-01-01T00:00:00Z');

            // Meeting time = baseTime + 30s
            const meetingTime = new Date('2024-01-01T00:00:30Z');

            setupMeetingInfra(lang, baseTime, meetingTime);

            getLangFixture(lang).then((json) => {
              const relative_seconds = json.relative_date_minute;

              cy.get('.rw-card').contains(relative_seconds);
            });
          });

          it('should show 1 meeting now', () => {
            const baseTime = new Date('2024-01-01T00:30:00Z');

            // Meeting time = baseTime
            const meetingTime = new Date('2024-01-01T00:00:00Z');

            setupMeetingInfra(lang, baseTime, meetingTime);

            getLangFixture(lang).then((json) => {
              const relative_now = json.relative_date_now;

              cy.get('.rw-card').contains(relative_now);
            });
          });
        });

        describe('2 meetings', () => {
          it('should show 2 meetings', () => {
            const baseTime = new Date('2024-01-01T00:00:00Z');

            // Meeting time = baseTime + 2hrs
            const meetingTime1 = new Date('2024-01-01T02:01:00Z');
            const meetingTime2 = new Date('2024-01-01T04:17:00Z');

            setupMeetingInfra(lang, baseTime, meetingTime1, meetingTime2);

            getLangFixture(lang).then((json) => {
              cy.get('.rw-card').contains(d(meetingTime1).format(json.relative_date_format).toLocaleUpperCase());
              cy.get('.rw-card').contains(d(meetingTime2).format(json.relative_date_format).toLocaleUpperCase());
            });
          });

          it('should show 2 meetings now', () => {
            const baseTime = new Date('2024-01-01T00:30:00Z');

            // Meeting time = baseTime + 2hrs
            const meetingTime1 = new Date('2024-01-01T00:00:00Z');
            const meetingTime2 = new Date('2024-01-01T00:05:00Z');

            setupMeetingInfra(lang, baseTime, meetingTime1, meetingTime2);

            getLangFixture(lang).then((json) => {
              // Should have 2 instances of the same text
              cy.get('.rw-card').contains(json.relative_date_now);
            });
          });
        });

        describe('3 meetings', () => {
          it('should show 3 meetings all in the future', () => {
            const baseTime = new Date('2024-01-01T00:00:00Z');

            // Meeting time = baseTime + 2hrs
            const meetingTime1 = new Date('2024-01-01T02:01:00Z');
            const meetingTime2 = new Date('2024-01-01T04:17:00Z');
            const meetingTime3 = new Date('2024-01-01T06:33:00Z');

            setupMeetingInfra(lang, baseTime, meetingTime1, meetingTime2, meetingTime3);

            getLangFixture(lang).then((json) => {
              cy.get('.rw-card').contains(d(meetingTime1).format(json.relative_date_format).toLocaleUpperCase());
              cy.get('.rw-card').contains(d(meetingTime2).format(json.relative_date_format).toLocaleUpperCase());
              cy.get('.rw-card').contains(d(meetingTime3).format(json.relative_date_format).toLocaleUpperCase());
            });

            screenshot2();
          });

          it('should show 3 meetings now', () => {
            const baseTime = new Date('2024-01-01T00:30:00Z');

            // Meeting time = baseTime + 2hrs
            const meetingTime1 = new Date('2024-01-01T00:00:00Z');
            const meetingTime2 = new Date('2024-01-01T00:05:00Z');
            const meetingTime3 = new Date('2024-01-01T00:10:00Z');

            setupMeetingInfra(lang, baseTime, meetingTime1, meetingTime2, meetingTime3);

            getLangFixture(lang).then((json) => {
              // Should have 3 instances of the same text
              cy.get('.rw-card').contains(json.relative_date_now);
            });

            screenshot2();
          });
        });

        describe('Joining Meeting', () => {
          it('should hide the joining dialog after 10 seconds if able to join the meeting', () => {
            cy.intercept('POST', '/api/provisioned/acstoken', (req) => {
              req.reply({
                token: 'acsToken',
              });
            });

            cy.intercept('https://graph.microsoft.com/oidc/userinfo', (req) => {
              // Status code for not implemented
              req.reply({
                name: 'Fred User',
                given_name: 'Fred',
              });
            });

            cy.reload();

            setupAndroidInterfaceSpy();

            const baseTime = new Date('2024-01-01T00:00:00Z');

            // Meeting time = baseTime + 2hrs
            const meetingTime = new Date('2024-01-01T02:33:00Z');

            setupMeetingInfra(lang, baseTime, meetingTime);

            getLangFixture(lang).then((json) => {
              // Get the meeting join button for the first meeting
              const text = json.meetings_join_number.replace('{{number}}', '1');

              cy.get('fluent-button-wrapper').contains(text).click();

              cy.tick(100, { log: false });

              cy.get('.mdc-dialog')
                .should('be.visible')
                .within(() => {
                  cy.contains(json.meetings_dialog_title);
                  cy.contains(json.meetings_dialog_message);
                });

              cy.get('@joinMeeting').should('have.been.calledOnceWith', 'acsToken', 'https://teams.com', 'Fred User', 'Meeting');

              screenshot2();

              // It should close after 11 seconds
              cy.tick(11000);

              cy.get('.mdc-dialog').should('not.exist').log('Dialog closed');
            });
          });

          it('should hide the joining dialog after the onPause event if able to join the meeting', () => {
            cy.intercept('POST', '/api/provisioned/acstoken', (req) => {
              req.reply({
                token: 'acsToken',
              });
            });

            cy.intercept('https://graph.microsoft.com/oidc/userinfo', (req) => {
              // Status code for not implemented
              req.reply({
                name: 'Fred User',
                given_name: 'Fred',
              });
            });

            cy.reload();

            cy.window().then((win) => {
              const a = {
                joinMeeting: () => {
                  return true;
                },
              };

              (win as any).AndroidInterface = a;

              // Spy on the join meeting method
              cy.spy(a, 'joinMeeting').as('joinMeeting');
            });

            const baseTime = new Date('2024-01-01T00:00:00Z');

            // Meeting time = baseTime + 2hrs
            const meetingTime = new Date('2024-01-01T02:33:00Z');

            setupMeetingInfra(lang, baseTime, meetingTime);

            getLangFixture(lang).then((json) => {
              // Get the meeting join button for the first meeting
              const text = json.meetings_join_number.replace('{{number}}', '1');

              cy.get('fluent-button-wrapper').contains(text).click();

              cy.tick(100, { log: false });

              cy.get('.mdc-dialog')
                .should('be.visible')
                .within(() => {
                  cy.contains(json.meetings_dialog_title);
                  cy.contains(json.meetings_dialog_message);
                });

              cy.get('@joinMeeting').should('have.been.calledOnceWith', 'acsToken', 'https://teams.com', 'Fred User', 'Meeting');

              // Fire the rwt_onPause event
              cy.window().then((win) => {
                win.document.dispatchEvent(new Event('rwt_onPause'));
              });

              cy.tick(500);

              cy.get('.mdc-dialog').should('not.exist').log('Dialog closed');
            });
          });

          it('should show an error dialog if unable to join the meeting', () => {
            const baseTime = new Date('2024-01-01T00:00:00Z');

            // Meeting time = baseTime + 2hrs
            const meetingTime = new Date('2024-01-01T02:33:00Z');

            setupMeetingInfra(lang, baseTime, meetingTime);

            getLangFixture(lang).then((json) => {
              // Get the meeting join button for the first meeting
              const text = json.meetings_join_number.replace('{{number}}', '1');

              cy.get('fluent-button-wrapper').contains(text).click();

              cy.on('uncaught:exception', (err) => {
                cy.log(err.message);
                return false;
              });

              cy.tick(100, { log: false });

              cy.get('.mdc-dialog')
                .should('be.visible')
                .within(() => {
                  cy.contains(json.meetings_dialog_title);
                  cy.contains(json.meetings_dialog_failed);

                  cy.contains(json.meetings_dialog_message).should('not.exist');
                });

              cy.tick(5000);

              cy.get('.mdc-dialog').should('not.exist').log('Dialog closed');
            });
          });
        });
      });
    });
  });
});
