document.addEventListener("DOMContentLoaded", () => {
  const urlForm = document.getElementById("urlForm");
  const urlInput = document.getElementById("urlInput");
  const urlList = document.getElementById("urlList");

  // Load saved URLs from storage and display them in the options page
  function loadUrls() {
    chrome.storage.sync.get("urls", (result) => {
      const urls = result.urls || [];

      urlList.innerHTML = "";

      urls.forEach((url) => {
        const li = createUrlListItem(url);
        urlList.appendChild(li);
      });
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
    const newUrl = urlInput.value.trim();

    if (newUrl) {
      // Save the new URL to storage
      chrome.storage.sync.get("urls", (result) => {
        const urls = result.urls || [];
        const normalizedNew = normalizeUrl(newUrl);
        
        // Check for duplicates
        if (urls.some(url => normalizeUrl(url) === normalizedNew)) {
          urlInput.classList.add('error');
          urlInput.value = '';
          urlInput.placeholder = 'URL already exists!';
          setTimeout(() => {
            urlInput.classList.remove('error');
            urlInput.placeholder = 'Enter website URL to open in incognito mode';
          }, 2000);
          return;
        }

        urls.push(newUrl);
        chrome.storage.sync.set({ urls }, () => {
          urlInput.value = '';
          loadUrls();
        });
      });
    }
  });

  // Delete a URL from storage and update the options page
  function deleteUrl(url) {
    chrome.storage.sync.get("urls", (result) => {
      const urls = result.urls || [];
      const index = urls.indexOf(url);

      if (index > -1) {
        urls.splice(index, 1);
        chrome.storage.sync.set({ urls }, loadUrls);
      }
    });
  }

  // Add PayPal donate button
  const footer = document.createElement("div");
  footer.className = "footer";
  
  const donateButton = document.createElement("a");
  donateButton.href = "https://www.paypal.com/donate/?hosted_button_id=QH3Q75NN3CXJ6"; // Replace with your PayPal button ID
  donateButton.target = "_blank";
  donateButton.className = "donate-button";
  donateButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 3.993-.032.17a.804.804 0 0 1-.794.679H7.72a.483.483 0 0 1-.477-.558L7.418 21h1.518l.95-6.02h1.385c4.678 0 7.75-2.203 8.796-6.502zm-2.96-5.09c.762.868.983 1.81.752 3.285-.019.123-.04.24-.062.36-.735 3.773-3.089 5.446-6.956 5.446H8.957c-.63 0-1.174.414-1.354 1.002l-.014-.002-.93 5.894H3.121a.051.051 0 0 1-.05-.06l2.598-16.51A.95.95 0 0 1 6.607 2h5.976c2.183 0 3.716.469 4.523 1.388z"/>
    </svg>
    Support us
  `;
  
  footer.appendChild(donateButton);
  document.querySelector('.card').appendChild(footer);

  // Initial loading of URLs
  loadUrls();

  function normalizeUrl(url) {
    try {
      const urlObj = new URL(url.toLowerCase().trim());
      return urlObj.hostname + urlObj.pathname.replace(/\/$/, '');
    } catch {
      return url.toLowerCase().trim();
    }
  }

  function isDuplicateUrl(newUrl, existingUrls) {
    const normalizedNew = normalizeUrl(newUrl);
    return existingUrls.some(url => normalizeUrl(url) === normalizedNew);
  }

  urlForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();

    chrome.storage.sync.get("urls", (result) => {
      const urls = result.urls || [];
      
      if (isDuplicateUrl(url, urls)) {
        urlInput.classList.add('error');
        urlInput.value = '';
        urlInput.placeholder = 'URL already exists!';
        setTimeout(() => {
          urlInput.classList.remove('error');
          urlInput.placeholder = 'Enter website URL to open in incognito mode';
        }, 2000);
        return;
      }

      urls.push(url);
      chrome.storage.sync.set({ urls }, () => {
        urlInput.value = '';
        loadUrls();
      });
    });
  });
});
