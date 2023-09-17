document.addEventListener("DOMContentLoaded", () => {
  const urlForm = document.getElementById("urlForm");
  const urlInput = document.getElementById("urlInput");
  const urlList = document.getElementById("urlList");
  const linkCountElement = document.getElementById("linkCount");
  const paypalButtonContainer = document.getElementById("paypal-button-container"); // Add this line

  let linkCount = 0; // Initialize the link count

  // Load saved URLs from storage and display them in the options page
  function loadUrls() {
    chrome.storage.sync.get("urls", (result) => {
      const urls = result.urls || [];

      urlList.innerHTML = "";

      urls.forEach((url) => {
        const li = createUrlListItem(url);
        urlList.appendChild(li);
      });

      // Update the remaining free link slots
      updateLinkCount();
    });
  }

  // Create a list item element for a URL
  function createUrlListItem(url) {
    const li = document.createElement("li");
    li.className = "url-item";

    const span = document.createElement("span");
    span.textContent = url;

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      deleteUrl(url);
    });

    li.appendChild(span);
    li.appendChild(deleteButton);

    return li;
  }

  // Handle form submission to add a new URL
  urlForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const newUrl = urlInput.value;

    if (newUrl) {
      // Check if the user has exceeded the link limit
      if (linkCount < 3) {
        // Save the new URL to storage
        chrome.storage.sync.get("urls", (result) => {
          const urls = result.urls || [];
          urls.push(newUrl);

          chrome.storage.sync.set({ urls }, () => {
            const li = createUrlListItem(newUrl);
            urlList.appendChild(li);

            urlInput.value = "";

            // Increment the link count
            linkCount++;
            // Update the remaining free link slots
            updateLinkCount();
          });
        });
      } else {
        // Charge $1 for each additional link using PayPal
        chargeForAdditionalLink();
      }
    }
  });

  // Delete a URL from storage and update the options page
  function deleteUrl(url) {
    chrome.storage.sync.get("urls", (result) => {
      const urls = result.urls || [];
      const index = urls.indexOf(url);

      if (index > -1) {
        urls.splice(index, 1);
        chrome.storage.sync.set({ urls }, () => {
          loadUrls();
          // Decrement the link count
          linkCount--;
          // Update the remaining free link slots
          updateLinkCount();
        });
      }
    });
  }

  // Update the remaining free link slots
  function updateLinkCount() {
    const remainingSlots = 3 - linkCount;
    linkCountElement.textContent = `Remaining free link slots: ${remainingSlots}`;
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
        // Capture the payment and update the UI
        return actions.order.capture().then(function(details) {
          // Payment successful, you can update your logic here
          console.log('Payment successful', details);
          // Close the payment dialog (if any)
          paypalButtonContainer.innerHTML = "";
          // Proceed with adding the URL or any other logic you have
        });
      }
    }).render(paypalButtonContainer); // Render the PayPal button in the specified container
  }

  // Initial loading of URLs
  loadUrls();
});