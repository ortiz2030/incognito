// Register the onBeforeNavigate event listener
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  chrome.storage.sync.get(['urls'], (result) => {
    if (result.urls) {
      const url = details.url;
      const isSearchEngine = isKnownSearchEngine(url);

      // Iterate through the stored URLs to find a match
      const matchingURL = result.urls.find(keyword => {
        const regexPattern = new RegExp(`^https?:\/\/.*${escapeRegExp(keyword)}.*`, 'i');
        return regexPattern.test(url);
      });

      if (matchingURL && !isSearchEngine) {
        // Close the current tab
        chrome.tabs.remove(details.tabId, () => {
          // Create a new incognito window with the matching URL
          chrome.windows.create({ url: url, incognito: true });
        });
      }
    }
  });
}, { url: [{ urlMatches: '.*' }] });

// Helper function to escape special characters in a string to be used in a regular expression
function escapeRegExp(string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

// Function to check if the URL belongs to a known search engine
function isKnownSearchEngine(url) {
  const searchEngines = ['google.com', 'bing.com', 'yahoo.com','duckduckgo.com']; // Add more search engine domains if needed

  for (const engine of searchEngines) {
    const regexPattern = new RegExp(`^https?:\\/\\/${escapeRegExp(engine)}\\/.*`, 'i');
    if (regexPattern.test(url)) {
      return true;
    }
  }

  return false;
}
