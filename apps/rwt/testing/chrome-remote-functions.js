let savedTokens;

async function loadTokens() {

  if (savedTokens === undefined || !savedTokens?.length) {
    console.log("No Saved Tokens, login manually, then run saveTokens()");
    return;
  }

  // Restore the tokens from the save tokens
  await Runtime.evaluate({ expression: `localStorage.setItem('rw-tokens2', '${savedTokens}');` });
  await Page.reload();
}

async function saveTokens() {
  // Save the current tokens
  savedTokens = (await Runtime.evaluate({ expression: 'localStorage.getItem("rw-tokens2");'})).result.value;

  console.log(`Tokens Saved: ${savedTokens?.length} chars`);
}

async function clearTokens() {

  // Save the latest token state
  await this.saveTokens();

  // Delete the stored tokens and reload the page (basically forces a logout)
  await Runtime.evaluate({ expression: 'localStorage.removeItem("rw-tokens2"); '})
  await Page.reload();
}

function delay(ms) { return new Promise(done => setTimeout(done, ms))}

async function logout() {
  try {
      // Get the root document node
      const { root: { nodeId: documentNodeId } } = await DOM.getDocument();

      // Find the button element with text "Sign out" (case insensitive)
      const { nodeId: buttonNodeId } = await DOM.querySelector({
          nodeId: documentNodeId,
          selector: 'button'
      });

      const { result } = await Runtime.evaluate({
          expression: `
              Array.from(document.querySelectorAll('fluent-button')).find(button => 
                  button.textContent.trim().toLowerCase() === 'sign out'
              )
          `
      });

      if (result && result.objectId) {
          // Click the button if found
          await Runtime.callFunctionOn({
              objectId: result.objectId,
              functionDeclaration: 'function() { this.click(); }'
          });

          console.log('Button clicked');
      } else {
          console.log('Button with text "Sign out" not found');
      }
  } catch (err) {
      console.error('Error finding or clicking the button:', err);
  }
}

async function loginAndLogout(ms) {
  if (!ms) {
    ms = 1000;
  }

  await loadTokens();

  await delay(ms);

  await saveTokens();

  await logout();
}

async function callOnPause() {
  // Fire the rwt_onPause event
  await Runtime.evaluate({ expression: 'document.dispatchEvent(new Event("rwt_onPause"));' });
}

async function callOnResume() {
  // Fire the rwt_onResume event
  await Runtime.evaluate({ expression: 'document.dispatchEvent(new Event("rwt_onResume"));' });
}

async function websocketDisable() {
  // Store in setting storage that websockets are disabled and reload
  await Runtime.evaluate({ expression: 'sessionStorage.setItem("rw-disabledwebsockets", "true");' });
  await Page.reload();
}

async function websocketEnable() {
  // Store in setting storage that websockets are enabled and reload
  await Runtime.evaluate({ expression: 'sessionStorage.removeItem("rw-disabledwebsockets");' });
  await Page.reload();
}

async function emulate3G() {
  // Enable Network domain events
  await Network.enable();

  // Emulate network conditions (3G speed)
  await Network.emulateNetworkConditions({
    offline: false,
    latency: 100, // Latency in milliseconds
    downloadThroughput: 750 * 1024 / 8, // 750 Kbps (approx 3G download speed)
    uploadThroughput: 250 * 1024 / 8,   // 250 Kbps (approx 3G upload speed)
    connectionType: 'cellular3g'
  });
}

async function emulate4G() {
  await Network.enable();

  await Network.emulateNetworkConditions({
    offline: false,
    latency: 50,                      // 50ms latency (mild delay)
    downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps download speed
    uploadThroughput: 750 * 1024 / 8,          // 750 Kbps upload speed
    connectionType: 'cellular4g'      // Emulate a 4G connection
  });
}

async function resetNetwork() {
  // Enable network (just in case)
  await Network.enable();

  await Network.emulateNetworkConditions({
    offline: false,
    latency: 0,                      // No latency
    downloadThroughput: -1,          // Default to no throttling
    uploadThroughput: -1,            // Default to no throttling
    connectionType: 'none'           // Default connection type
  });
}