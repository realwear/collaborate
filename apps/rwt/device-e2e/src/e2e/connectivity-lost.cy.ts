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
  getByTestId,
  getLangFixture,
  mockLoginIntercepts,
  prepareRealWearViewport,
  screenshot2,
  setupAndroidInterfaceSpy as setupAndroidInterfaceSpy,
} from '../support/app.po';

describe('connectivity-lost - login', () => {
  prepareRealWearViewport();

  it('should display dialog if offline is detected', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('rwt_initial', 'true');
      },
    });

    // Don't expect to see the offline dialog
    cy.get('nx-connectivity-lost-dialog').should('not.exist');

    // Need to go offline
    cy.window().then((win) => {
      win.document.dispatchEvent(new Event('rwt_goOffline'));
    });

    // Expect to see the offline dialog
    cy.get('nx-connectivity-lost-dialog').should('exist');
  });

  it('should display dialog if offline detected from start', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('rwt_initial', 'false');
      },
    });

    // Expect to see the offline dialog
    cy.get('nx-connectivity-lost-dialog').should('exist');
  });

  it('should close dialog if online is detected', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('rwt_initial', 'false');
      },
    });

    // Expect to see the offline dialog
    cy.get('nx-connectivity-lost-dialog').should('exist');

    // Need to go online
    cy.window().then((win) => {
      win.document.dispatchEvent(new Event('rwt_goOnline'));
    });

    // Don't expect to see the offline dialog
    cy.get('nx-connectivity-lost-dialog').should('not.exist');
  });

  it('should open the configurator', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('rwt_initial', 'false');
      },
    });

    // Expect to see the offline dialog
    cy.get('nx-connectivity-lost-dialog').should('exist');

    setupAndroidInterfaceSpy();

    // Click the configurator button
    getByTestId('get-connected').click();

    // Expect the configurator to be opened
    cy.get('@startConfigurator').should('have.been.calledOnce');
  });
});

describe('connectivity-lost - meetings', () => {
  prepareRealWearViewport();
  autoReloadOnTestChanges();

  beforeEach(() => {
    mockLoginIntercepts();

    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.sessionStorage.clear();
        win.localStorage.clear();
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

  it('should display dialog if offline is detected', () => {
    // Start initially as online
    cy.window().then((win) => {
      win.localStorage.setItem('rwt_initial', 'true');
    });

    cy.visit('/');

    // Don't expect to see the offline dialog
    cy.get('nx-connectivity-lost-dialog').should('not.exist');

    // Need to go offline
    cy.window().then((win) => {
      win.document.dispatchEvent(new Event('rwt_goOffline'));
    });

    // Expect to see the offline dialog
    cy.get('nx-connectivity-lost-dialog').should('exist');
  });

  it('should display dialog if offline detected from boot', () => {
    // Start initially as offline
    cy.window().then((win) => {
      win.localStorage.setItem('rwt_initial', 'false');
    });

    cy.visit('/');

    // Expect to see the offline dialog
    cy.get('nx-connectivity-lost-dialog').should('exist');
  });

  it('should close dialog if online is detected', () => {
    // Start initially as offline
    cy.window().then((win) => {
      win.localStorage.setItem('rwt_initial', 'false');
    });

    cy.visit('/');

    // Expect to see the offline dialog
    cy.get('nx-connectivity-lost-dialog').should('exist');

    // Need to go online
    cy.window().then((win) => {
      win.document.dispatchEvent(new Event('rwt_goOnline'));
    });

    // Don't expect to see the offline dialog
    cy.get('nx-connectivity-lost-dialog').should('not.exist');
  });

  it('should open the configurator', () => {
    // Start initially as offline
    cy.window().then((win) => {
      win.localStorage.setItem('rwt_initial', 'false');
    });

    cy.visit('/');

    // Expect to see the offline dialog
    cy.get('nx-connectivity-lost-dialog').should('exist');

    setupAndroidInterfaceSpy();

    // Click the configurator button
    getByTestId('get-connected').click();

    // Expect the configurator to be opened
    cy.get('@startConfigurator').should('have.been.calledOnce');
  });

  it.skip('should sign out', () => {
    // Start initially as offline
    cy.window().then((win) => {
      win.localStorage.setItem('rwt_initial', 'false');
    });

    cy.visit('/');

    // Expect to see the offline dialog
    cy.get('nx-connectivity-lost-dialog')
      .should('exist')
      .within(() => {
        // Click the sign out button
        getByTestId('sign-out').should('exist').click();
      });

    // Expect to be signed out (ie: the dialog to have disappeared)
    cy.get('nx-connectivity-lost-dialog').should('not.exist');
  });

  forEachMode((mode) => {
    forEachLang((lang) => {
      describe(`${lang} - ${mode}`, () => {
        beforeEachModeLang(mode, lang);
        beforeEach(() => {
          cy.window().then((win) => {
            win.localStorage.setItem('rwt_initial', 'false');

            cy.visit('/');
          });
        });

        it('should display the right translations', () => {
          getLangFixture(lang).then((fixture) => {
            cy.get('nx-connectivity-lost-dialog')
              .should('exist')
              .within(() => {
                cy.get('h2').should('contain.text', fixture['lost_connectivity_title']);
                cy.get('p').should('contain.text', fixture['lost_connectivity_message']);

                // getByTestId('sign-out').should('contain.text', fixture['sign_out']); // Currently disabled
                getByTestId('get-connected').should('contain.text', fixture['get_connected']);
              });
          });
          // This wait is here because the dark mode screenshot sometimes renders double height
          // eslint-disable-next-line cypress/no-unnecessary-waiting
          cy.wait(10);

          screenshot2();
        });
      });
    });
  });
});