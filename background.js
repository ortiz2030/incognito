// Global variables
let currentIncognitoWindow = null;
let lastProcessedUrl = null;

// Function to check if a URL matches our patterns
function findMatchingUrl(url, urlPatterns) {
  if (!urlPatterns || !url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlPatterns.find(keyword => {
      let keywordHost;
      try {
        const keywordUrl = new URL(keyword.startsWith('http') ? keyword : 'https://' + keyword);
        keywordHost = keywordUrl.hostname;
      } catch {
        keywordHost = keyword;
      }
      return urlObj.hostname.includes(keywordHost);
    });
  } catch {
    return false;
  }
}

// Function to check if a URL is a service worker
function isServiceWorkerUrl(url) {
  try {
    const urlObj = new URL(url);
    if (
      urlObj.pathname.includes('service_worker') ||
      urlObj.pathname.includes('sw.js') ||
      urlObj.pathname.includes('sw_') ||
      (urlObj.pathname.endsWith('.js') && urlObj.search.includes('sw=true')) ||
      urlObj.hostname === 'www.googletagmanager.com'
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Function to check if the URL belongs to a known search engine
function isKnownSearchEngine(url) {
  const searchEngines = ['google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com'];
  try {
    const urlObj = new URL(url);
    return searchEngines.some(engine => urlObj.hostname.includes(engine));
  } catch {
    return false;
  }
}

// Helper function to escape special characters in a string
function escapeRegExp(string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

// Listen for when a navigation is committed
chrome.webNavigation.onCommitted.addListener(async (details) => {
  // Only process main frame navigations
  if (details.frameId !== 0) return;
  
  const url = details.url;
  
  // Prevent processing the same URL multiple times
  if (lastProcessedUrl === url) return;
  
  // Skip if it's a service worker or search engine
  if (isServiceWorkerUrl(url) || isKnownSearchEngine(url)) return;

  const result = await chrome.storage.sync.get(['urls', 'keepTabOpen']);
  if (!result.urls) return;

  const matchingURL = findMatchingUrl(url, result.urls);
  if (!matchingURL) return;

  lastProcessedUrl = url;

  // Open in incognito window
  chrome.windows.create({ url: url, incognito: true }, () => {
    if (!result.keepTabOpen) {
      // If we're not keeping the tab open, close it
      chrome.tabs.remove(details.tabId);
    } else {
      // If keeping the tab open, navigate back
      chrome.tabs.goBack(details.tabId);
    }
    // Reset the last processed URL after a delay
    setTimeout(() => {
      lastProcessedUrl = null;
    }, 1000);
  });
});

// Listen for window removal to reset currentIncognitoWindow
chrome.windows.onRemoved.addListener((windowId) => {
  if (currentIncognitoWindow && currentIncognitoWindow.id === windowId) {
    currentIncognitoWindow = null;
  }
});
