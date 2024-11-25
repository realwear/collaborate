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
  forEachLang,
  getByTestId,
  getLangFixture,
  mockLoginIntercepts,
  prepareRealWearViewport,
  screenshot2,
  setModeLang,
} from '../support/app.po';

describe('Sign Out Dialog', () => {
  prepareRealWearViewport();

  autoReloadOnTestChanges();

  beforeEach(() => {
    mockLoginIntercepts();

    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        setModeLang(win, 'light', 'en');
      },
    });

    cy.session('user1', () => {
      cy.visit('/');
      cy.get('fluent-button').click();

      cy.wait('@code2_success');
      cy.wait('@token2_success');

      cy.get('.sign-out').should('exist');
    });
  });

  it('has sign out buttons', () => {
    cy.visit('/');
    getByTestId('sign-out').should('exist');
  });

  it('should open sign out dialog', () => {
    cy.visit('/');
    getByTestId('sign-out').click();
    cy.get('nx-sign-out-dialog').should('exist');
  });

  it('should close the dialog on cancel', () => {
    cy.visit('/');
    getByTestId('sign-out').click();
    cy.get('nx-sign-out-dialog').within(() => {
      getByTestId('cancel').click();
    });
    cy.get('nx-sign-out-dialog').should('not.exist');
  });

  it('should should sign out on confirm', () => {
    cy.visit('/');
    getByTestId('sign-out').click();
    getByTestId('confirm').click();
    cy.get('nx-sign-out-dialog').should('not.exist');

    // We expect to see the sign in button
    getByTestId('sign-in').should('exist');
  });

  describe('Light/Dark Mode', () => {
    it('should display in light mode', () => {
      cy.window().then((win) => {
        setModeLang(win, 'light', 'en');
      });
      cy.visit('/');
      getByTestId('sign-out').click();
      cy.get('nx-sign-out-dialog').should('exist');
      screenshot2();
    });

    it('should display in dark mode', () => {
      cy.window().then((win) => {
        setModeLang(win, 'dark', 'en');
      });

      cy.visit('/');
      getByTestId('sign-out').click();
      cy.get('nx-sign-out-dialog').should('exist');
      screenshot2();
    });
  });

  forEachLang((lang) => {
    describe('Sign Out Dialog - ' + lang, () => {
      beforeEach(() => {
        cy.window().then((win) => {
          setModeLang(win, 'dark', lang);
        });
        cy.visit('/');
        getByTestId('sign-out').click();
      });

      it('should display correct translations', () => {
        getLangFixture(lang).then((langData) => {
          // Within the nx-sign-out-dialog component
          cy.get('nx-sign-out-dialog').within(() => {
            cy.get('h2').should('contain.text', langData['sign_out_confirm']);
            getByTestId('cancel').should('contain.text', langData['cancel']);
            getByTestId('confirm').should('contain.text', langData['sign_out']);
          });

          screenshot2();
        });
      });
    });
  });
});
