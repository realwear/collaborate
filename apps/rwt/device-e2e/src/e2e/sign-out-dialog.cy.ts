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
