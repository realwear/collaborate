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
/* eslint-disable cypress/no-unnecessary-waiting */
import {
  beforeEachModeLang,
  forEachLang,
  forEachMode,
  getByTestId,
  getLangFixture,
  mockLoginIntercepts,
  prepareRealWearViewport,
  screenshot2,
  setupAndroidInterfaceSpy,
} from '../support/app.po';

prepareRealWearViewport();

const mockNoMeetings = () => {
  cy.intercept('https://graph.microsoft.com/v1.0/me/calendarview*', (req) => {
    // Status code for not implemented
    req.reply({
      value: [],
    });
  });

  cy.intercept('https://graph.microsoft.com/oidc/userinfo', (req) => {
    req.reply({
      name: 'Frank Sinatra',
    });
  });
};

const checkRingtonePlaying = () => {
  // Audio should be playing and duration should be greater than 0 and currenttime should be greater than 0
  getByTestId('ringtone').should('have.prop', 'duration').should('be.gt', 0);
  getByTestId('ringtone').should('have.prop', 'currentTime').should('be.gt', 0);
  getByTestId('ringtone').should('have.prop', 'paused').should('be.false');

  cy.log('Ringtone is playing');
};

const runAll = (mode: string, lang: string) => {
  beforeEachModeLang(mode, lang);

  beforeEach(() => {
    mockNoMeetings();
  });

  afterEach(() => {
    // Pause any audio that is playing
    cy.get('body').then(($body) => {
      if ($body.find('audio').length) {
        cy.get('audio').then(($audio) => {
          $audio[0].pause();
        });
      }
    });
  });

  it('should display an incoming call dialog and timeout if not answered', () => {
    let foundConnectCode = '';

    cy.clock(0, ['setTimeout']);

    // Wait for the connect code to be displayed
    cy.get('nx-connect-code')
      .invoke('text')
      .should('have.length.gt', 1)
      .then((text) => {
        expect(text.trim()).to.match(/^[A-Za-z0-9]{5}$/);
        foundConnectCode = text.trim();
      })
      .then(() => {
        // Send a request to the api to simulate an incoming call
        cy.request('POST', '/api/createmeeting/test', {
          name: 'John Doe',
          email: 'john.doe@example.com',
          meetingUrl: 'https://example.com/meeting',
          meetingSubject: 'Incoming rest call',
          connectCode: foundConnectCode?.trim()?.toLocaleUpperCase(),
        });
      });

    cy.get('nx-incoming-meeting-dialog')
      .should('be.visible')
      .within(($dialog) => {
        // Look for the name
        getByTestId('name').should('have.text', 'John Doe');

        getLangFixture(lang).then((json) => {
          cy.wrap($dialog).contains(json.incoming_call_calling_you);

          getByTestId('accept').contains(json.incoming_call_accept);
          getByTestId('decline').contains(json.incoming_call_decline);

          cy.wrap($dialog).contains('JD');
        });

        // Audio should be playing and duration should be greater than 0 and currenttime should be greater than 0
        checkRingtonePlaying();
      });

    screenshot2();

    cy.tick(21000);

    // Dialog should be closed
    cy.get('nx-incoming-meeting-dialog').should('not.exist');
  });

  it('should reject an incoming call', () => {
    let foundConnectCode = '';

    cy.clock(0, ['setTimeout']);

    // Wait for the connect code to be displayed
    cy.get('nx-connect-code')
      .invoke('text')
      .should('have.length.gt', 1)
      .then((text) => {
        expect(text.trim()).to.match(/^[A-Za-z0-9]{5}$/);
        foundConnectCode = text.trim();
      })
      .then(() => {
        // Send a request to the api to simulate an incoming call
        cy.request('POST', '/api/createmeeting/test', {
          name: 'John Doe',
          email: 'john.doe@example.com',
          meetingUrl: 'https://example.com/meeting',
          meetingSubject: 'Incoming rest call',
          connectCode: foundConnectCode?.trim()?.toLocaleUpperCase(),
        });
      });

    cy.get('nx-incoming-meeting-dialog').should('be.visible');

    cy.wait(50);

    // Wait for the audio to start playing
    checkRingtonePlaying();

    getByTestId('decline').click();

    // The buttons should be disabled
    getByTestId('decline').should('have.attr', 'aria-disabled', 'true');
    getByTestId('accept').should('have.attr', 'aria-disabled', 'true');

    // It should still be visible
    cy.get('nx-incoming-meeting-dialog').should('be.visible');

    // After 1.5 seconds, the dialog should be closed
    cy.tick(1500);

    // Now it will be closed
    cy.get('nx-incoming-meeting-dialog').should('not.exist');
  });

  it('should accept an incoming call', () => {
    setupAndroidInterfaceSpy();

    let foundConnectCode = '';

    cy.intercept('POST', '/api/provisioned/acstoken', (req) => {
      req.reply({
        token: 'token',
        userId: 'userId',
      });
    });

    cy.clock(0, ['setTimeout']);

    // Wait for the connect code to be displayed
    cy.get('nx-connect-code')
      .invoke('text')
      .should('have.length.gt', 1)
      .then((text) => {
        expect(text.trim()).to.match(/^[A-Za-z0-9]{5}$/);
        foundConnectCode = text.trim();
      })
      .then(() => {
        // Send a request to the api to simulate an incoming call
        cy.request('POST', '/api/createmeeting/test', {
          name: 'John Doe',
          email: 'john.doe@example.com',
          joinUrl: 'https://example.com/meeting',
          meetingSubject: 'Incoming rest call',
          connectCode: foundConnectCode?.trim()?.toLocaleUpperCase(),
        });
      });

    cy.get('nx-incoming-meeting-dialog').should('be.visible');

    cy.wait(50);

    // We want the ringtone to be playing before we click accept
    checkRingtonePlaying();

    getByTestId('accept').click();

    // The button should be disabled
    getByTestId('decline').should('have.attr', 'aria-disabled', 'true');
    getByTestId('accept').should('have.attr', 'aria-disabled', 'true');

    // It should still be visible
    cy.get('nx-incoming-meeting-dialog').should('be.visible');

    // Make sure the call was made to actually join the meeting
    // This will trigger the onPause event in the background naturally
    cy.get('@joinMeeting').should('have.been.calledOnceWith', 'token', 'https://example.com/meeting', 'RealWear Navigator', 'Test meeting');

    // After 5 seconds, the dialog should be closed
    cy.tick(5000);

    // Now it will be closed
    cy.get('nx-incoming-meeting-dialog').should('not.exist');
  });

  it('should accept an incoming call and handle onPause', () => {
    setupAndroidInterfaceSpy();

    let foundConnectCode = '';

    cy.intercept('POST', '/api/provisioned/acstoken', (req) => {
      req.reply({
        token: 'token',
        userId: 'userId',
      });
    });

    cy.clock(0, ['setTimeout']);

    // Wait for the connect code to be displayed
    cy.get('nx-connect-code')
      .invoke('text')
      .should('have.length.gt', 1)
      .then((text) => {
        expect(text.trim()).to.match(/^[A-Za-z0-9]{5}$/);
        foundConnectCode = text.trim();
      })
      .then(() => {
        cy.on('fail', () => {
          throw new Error('This will always fail on production configurations');
        });

        // Send a request to the api to simulate an incoming call
        cy.request('POST', '/api/createmeeting/test', {
          name: 'John Doe',
          email: 'john.doe@example.com',
          joinUrl: 'https://example.com/meeting',
          meetingSubject: 'Incoming rest call',
          connectCode: foundConnectCode?.trim()?.toLocaleUpperCase(),
        });
      });

    cy.get('nx-incoming-meeting-dialog').should('be.visible');

    cy.wait(50);

    // We want the ringtone to be playing before we click accept
    checkRingtonePlaying();

    getByTestId('accept').click();

    // The button should be disabled
    getByTestId('decline').should('have.attr', 'aria-disabled', 'true');
    getByTestId('accept').should('have.attr', 'aria-disabled', 'true');

    // It should still be visible
    cy.get('nx-incoming-meeting-dialog').should('be.visible');

    // Make sure the call was made to actually join the meeting
    // This will trigger the onPause event in the background naturally
    cy.get('@joinMeeting').should('have.been.calledOnceWith', 'token', 'https://example.com/meeting', 'RealWear Navigator', 'Test meeting');

    // Fire the rwt_onPause event
    cy.window()
      .then((win) => {
        win.document.dispatchEvent(new Event('rwt_onPause'));
      })
      .log('Fired onPause event');

    // Now it will be closed immediately
    cy.get('nx-incoming-meeting-dialog').should('not.exist');
  });
};

describe('Intro Page', () => {
  forEachMode((mode) => {
    forEachLang((lang) => {
      describe(`Incoming Call - Intro - ${lang} - ${mode}`, () => {
        runAll(mode, lang);
      });
    });
  });
});

describe('Meeting Page', () => {
  let tokens: string | null = null;

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

  forEachMode((mode) => {
    forEachLang((lang) => {
      describe(`Incoming Call - Meeting - ${lang} - ${mode}`, () => {
        runAll(mode, lang);
      });
    });
  });
});
