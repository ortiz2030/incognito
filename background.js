// Initialize the link count variable
let linkCount = 0;

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
        // Check if the user has exceeded the link limit
        if (linkCount < 3) {
          linkCount++; // Increment the link count
        } else {
          // Charge $1 for each additional link using PayPal
          chargeForAdditionalLink();
        }

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
  const searchEngines = ['google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com']; // Add more search engine domains if needed

  for (const engine of searchEngines) {
    const regexPattern = new RegExp(`^https?:\\/\\/${escapeRegExp(engine)}\\/.*`, 'i');
    if (regexPattern.test(url)) {
      return true;
    }
  }

  return false;
}

// Function to handle the payment process
function chargeForAdditionalLink() {
  // Use the PayPal SDK to create a payment request
  paypal.Buttons({
    createOrder: function(data, actions) {
      // Set up the order details, including the payment amount
      return actions.order.create({
        purchase_units: [{
          amount: {
            value: '1.00' // The amount to charge for an additional link
          }
        }]
      });
    },
    onApprove: function(data, actions) {
      // Capture the payment and allow the user to proceed
      return actions.order.capture().then(function(details) {
        // Payment successful, you can update your logic here
        console.log('Payment successful', details);
        // Close the current tab and create a new incognito window
        chrome.tabs.remove(details.tabId, () => {
          chrome.windows.create({ url: url, incognito: true });
        });
      });
    }
  }).render('#paypal-button-container'); // Replace with the ID of your payment button element
}
