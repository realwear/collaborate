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
declare let AndroidInterface: {
  isDarkMode(): boolean;
};

/**
 * Detects if the current window is running in light or dark mode.
 * Order of precedence:
 * 1. Session storage override - helpful for Cypress testing
 * 2. AndroidInterface.isDarkMode() - retrieves the night mode value from the RealWear host
 * 3. Browser preference - uses the browser's preference for dark mode
 * @param window
 * @returns
 */
export function detectColorScheme(window: Window) {
  const darkQueryOverride = window.sessionStorage.getItem('rw-dark-mode');
  if (darkQueryOverride === 'dark') {
    return 'dark';
  } else if (darkQueryOverride === 'light') {
    return 'light';
  }

  if (typeof AndroidInterface !== 'undefined') {
    if (AndroidInterface.isDarkMode()) {
      return 'dark';
    } else {
      return 'light';
    }
  }

  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}
