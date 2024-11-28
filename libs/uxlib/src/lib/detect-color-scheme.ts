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
