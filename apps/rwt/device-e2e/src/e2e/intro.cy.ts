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
import {
  autoReloadOnTestChanges,
  beforeEachModeLang,
  forEachLang,
  forEachMode,
  getLangFixture,
  prepareRealWearViewport,
  screenshot2,
  setModeLang,
} from '../support/app.po';

prepareRealWearViewport();
autoReloadOnTestChanges();

forEachMode((mode) => {
  forEachLang((lang) => {
    describe(`intro-page - ${lang} - ${mode}`, () => {
      beforeEachModeLang(mode, lang);

      it('should display welcome message', () => {
        // Open the file [lang].json
        getLangFixture(lang).then((json) => {
          cy.log('Loaded ' + lang + '.json');
          cy.get('.explanation').contains(json.login_explanation);

          cy.get('fluent-button').contains(json.login_button);

          cy.get('.rw-card').contains(json.connect_to_me);
        });

        screenshot2();
      });

      it.skip('should show an error if the code has expired', () => {
        // Not Implemented Yet
      });

      it('should show an error if date is not valid', () => {
        // Set the system time to 10 minutes in the past
        cy.clock().then((clock) => {
          clock.setSystemTime(new Date(Date.now() - 600000));
        });

        cy.visit('/');

        // Look for the snackbar with the error message
        getLangFixture(lang).then((json) => {
          cy.contains(json.invalid_date);
        });

        screenshot2();
      });
    });
  });
});

describe('intro-page - onResume/onPause events', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad: (win) => setModeLang(win, 'light', 'en'),
    });
  });

  const testOnPause = (existingCodeFn?: (oldCode: string) => void) => {
    // Wait for text (trim) to have more length than 0
    cy.get('nx-connect-code')
      .invoke('text')
      .should('have.length.gt', 1)
      .then((text) => {
        expect(text.trim()).to.match(/^[A-Za-z0-9]{5}$/);

        existingCodeFn?.(text.trim());
      });

    // Trigger the rwt_onPause event
    cy.window().then((win) => {
      win.document.dispatchEvent(new Event('rwt_onPause'));
    });

    // Wait for text (trim) to have nothing inside it
    cy.get('nx-connect-code')
      .invoke('text')
      .should('have.length.lte', 1)
      .then((text) => {
        expect(text.trim()).to.match(/^$/);
      });

    // Wait for the spinner to appear, because the code is being refreshed
    cy.get('nx-connect-code mat-spinner').should('exist');
  };

  // Waiting for a rebase to be able to test this
  it('should have no code if the pause event is triggered', () => {
    testOnPause();
  });

  it('should show the code again when the resume event is triggered', () => {
    let existingCode = '';

    testOnPause((c) => (existingCode = c));

    cy.then(() => {
      expect(existingCode).not.to.be.empty;
    });

    // Wait for the code fetcher service to completely stop
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);

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

  it('should display the code', () => {
    // Check that mat-spinner exists inside nx-connect-code
    cy.get('nx-connect-code mat-spinner').should('exist');

    // Then, make sure that it doesn't exist, because it should disappear
    cy.get('nx-connect-code mat-spinner').should('not.exist');

    // Check that a 5-digit code containing letters and numbers is displayed inside nx-connect-code.
    // Get the text and check that it matches the regex
    cy.get('nx-connect-code')
      .invoke('text')
      .should('have.length.gt', 1)
      .then((text) => {
        expect(text.trim()).to.match(/^[A-Za-z0-9]{5}$/);
      });
  });

  it('should show flash the code when the code is about to expire', () => {
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
