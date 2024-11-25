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
let allLanguages = ['en', 'fr', 'es', 'ja', 'de'];
let modes = ['light', 'dark'];

if (Cypress.config('isInteractive')) {
  allLanguages = ['ja'];
  modes = ['dark'];
}

if (Cypress.env('language')) {
  const langs = Cypress.env('language');

  if (typeof langs === 'string') {
    allLanguages = langs.split(',');
  } else if (Array.isArray(langs)) {
    allLanguages = langs;
  }
}

export const getByTestId = (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
};

export const prepareRealWearViewport = () => {
  beforeEach(() => {
    cy.viewport(854, 480);
  });
};

export const forEachMode = (fn: (mode: string) => void) => modes.forEach(fn);
export const forEachLang = (fn: (lang: string) => void) => allLanguages.forEach(fn);

export const beforeEachModeLang = (mode: string, lang: string) =>
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad: (win) => setModeLang(win, mode, lang),
    }).log(`Visit / with mode=${mode} lang=${lang}`);

    if (mode === 'dark') {
      cy.get('body').should('have.css', 'background-color', 'rgb(41, 41, 41)').log('dark mode background');
    } else {
      cy.get('body').should('have.css', 'background-color', 'rgb(255, 255, 255)').log('light mode background');
    }
  });

/**
 * Take a screenshot of the current test with the test name and the current spec name
 * Doesn't do anything when running in interactive mode
 *
 * The screenshot is saved to the `validation` subdirectory and used for visual regression testing
 */
export const screenshot2 = () => {
  if (Cypress.config('isInteractive')) {
    return;
  }

  const subdirectory = 'validation';
  const testName = Cypress.currentTest.titlePath.join('-').replace(/[:/]/g, ''); // Sanitize the test name
  cy.screenshot(`${subdirectory}/${Cypress.spec.name}-${testName}`);
};

export const setModeLang = (window: Window, mode: string, lang: string) => {
  window.sessionStorage.setItem('rw-dark-mode', mode);
  window.sessionStorage.setItem('rw-lang', lang);
};

export const getLangFixture = (lang: string) => cy.fixture(`../../../device/src/app/translations/${lang}.json`);

export const setupAndroidInterfaceSpy = () =>
  cy.window().then((win) => {
    const a = {
      joinMeeting: () => {
        return true;
      },
      startConfigurator: () => {
        // Do nothing
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (win as any).AndroidInterface = a;

    // Spy on the join meeting method
    cy.spy(a, 'joinMeeting').as('joinMeeting');
    cy.spy(a, 'startConfigurator').as('startConfigurator');
  });

export const mockLoginIntercepts = () => {
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

  cy.intercept('POST', '/api/auth/refresh2', (req) => {
    req.reply({
      access_token: 'access_token',
      refresh_token: 'refresh_token',
      id_token: 'id_token',
      scope: 'profile',
    });
  }).as('refresh2_success');
};

export const autoReloadOnTestChanges = () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let interalVal: any;
    cy.on('window:load', (win) => {
      if (!Cypress.config('isInteractive')) {
        return;
      }

      const baseUrl = Cypress.config('baseUrl');

      if (!baseUrl) {
        return;
      }

      const wsUrl = `ws://` + baseUrl.replace(/^https?:\/\//, '') + '/ng-cli-ws';
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        interalVal = setInterval(() => {
          ws.send('ping');
        }, 5000);
      };

      ws.onmessage = (data) => {
        // If the data contains the word full-reload then restart the tests
        if (!data.data.includes('invalid')) {
          return;
        }

        const btn = win.top?.document.querySelector('.reporter .restart');

        if (btn && 'click' in btn) {
          (btn as HTMLButtonElement).click();
        }
      };
    });

    cy.on('window:unload', () => {
      clearInterval(interalVal);
    });
  });
};
