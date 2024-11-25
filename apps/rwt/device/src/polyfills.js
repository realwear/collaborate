// Create a polyfill to override the .push method of the document.adoptedStyleSheets array because it isn't supported on some old browsers
// This polyfill is required for the RWT app to work on Chrome < 109

console.log('navigator.userAgent', navigator.userAgent);
if (parseInt(/Chrome\/([0-9.]+)/.exec(navigator.userAgent)[1].split('.')[0]) < 109) {

  // Create a new object with the same prototype as the original array
  // Intercept the push method to prevent the error
  // And update the array of the original underlying object

  const styleSheets = document.adoptedStyleSheets;

  // eslint-disable-next-line no-undef
  const styleSheetsProxy = new Proxy(styleSheets, {
    get: function (target, prop, receiver) {
      if (prop === 'push') {
        return function (styleSheet) {
          if (styleSheet instanceof CSSStyleSheet) {
            target = [...target, styleSheet];
          }
        };
      }
      return Reflect.get(target, prop, receiver);
    }
  });

  // Override the original array with the new proxy object
  Object.defineProperty(document, 'adoptedStyleSheets', {
    get: function () {
      return styleSheetsProxy;
    }
  });

}