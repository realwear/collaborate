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
import { beforeEachModeLang, forEachLang, forEachMode, getLangFixture, prepareRealWearViewport, screenshot2 } from '../support/app.po';

prepareRealWearViewport();

forEachMode((mode) => {
  forEachLang((lang) => {
    describe(`login-dialog - ${lang} - ${mode}`, () => {
      beforeEachModeLang(mode, lang);

      it('should display device code', () => {
        cy.intercept('POST', '/api/auth/code2', (req) => {
          req.reply({
            device_code: 'device_code',
            user_code: 'ABCDEFGHI',
          });
        }).as('code2');

        cy.intercept('POST', '/api/auth/token2', (req) => {
          req.reply(400, {
            error: 'authorization_pending',
          });
        }).as('token2');

        cy.clock().then((clock) => {
          clock.setSystemTime(0);
        });

        cy.get('fluent-button').click();

        cy.tick(1000);

        cy.get('.code').contains('ABCDEFGHI');

        getLangFixture(lang).then((json) => {
          cy.get('.instruction').contains(json.azuresignin_instruction);
          cy.get('.instruction').contains(json.azuresignin_entercode);

          cy.get('.cancel').contains(json.cancel, { matchCase: false });
        });

        // Should remain visible after calling authorization pending
        cy.tick(5000);

        // Expect a pending call
        cy.wait('@token2');

        screenshot2();

        cy.get('.cancel').click();

        cy.tick(1000);

        cy.get('.code').should('not.exist');
      });

      it.skip('should show an error if unable to fetch the login code', () => {
        // Not Implemented Yet
      });

      it.skip('should close automatically after the device code timeout', () => {
        // Not Implemented Yet
      });
    });
  });
});

it('should display spinner if unable to reach the server', () => {
  cy.visit('/');

  cy.intercept('POST', '/api/auth/code2', (req) => {
    req.reply(500);
  }).as('code2_fail');

  cy.get('fluent-button').click();

  cy.wait('@code2_fail');

  cy.get('mat-spinner').should('exist');
  cy.get('.code').should('not.exist');

  cy.get('.cancel').click();

  cy.get('mat-spinner').should('not.exist');
});

it('should navigate to the signed in page on success', () => {
  cy.intercept('POST', '/api/auth/code2', (req) => {
    req.reply({
      device_code: 'device_code',
      user_code: 'ABCDEFGHI',
    });
  }).as('code2_success');

  cy.intercept('POST', '/api/auth/token2', (req) => {
    req.reply({
      access_token: 'access_token',
      refresh_token: 'refresh_token',
      id_token: 'id_token',
      scope: 'profile',
    });
  }).as('token2_success');

  cy.visit('/');

  cy.get('fluent-button').click();

  cy.wait('@code2_success');

  cy.wait('@token2_success');

  // Check for the sign out button
  getLangFixture('en').then((json) => {
    cy.get('.sign-out').contains(json.sign_out);
  });
});
