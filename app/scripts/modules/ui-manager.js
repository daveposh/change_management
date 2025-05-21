/**
 * UI Manager
 * Handles all UI-related functionality including event listeners,
 * rendering results, and UI updates
 */

export class UIManager {
  constructor(configManager) {
    this.configManager = configManager;
  }

  /**
   * Setup all UI components and event listeners
   */
  setupUI() {
    console.log('Setting up UI components');
    this.setupEventListeners();
    this.updateAppTitle(this.configManager.appTitle);
    this.setupSavedSearches();
  }

  /**
   * Setup event listeners for the app
   */
  setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Search button click event
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
      console.log('Search button found, adding click event');
      searchButton.addEventListener('click', () => {
        if (window.app && window.app.search) {
          window.app.search.performSearch();
        }
      });
    }
    
    // Enter key press in search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      console.log('Search input found, adding keypress event');
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && window.app && window.app.search) {
          window.app.search.performSearch();
        }
      });
    }
    
    // Tab switching
    const tabs = document.querySelectorAll('.nav-link');
    if (tabs.length > 0) {
      console.log('Nav tabs found, adding click events');
      tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
          e.preventDefault();
          
          // Hide all tab panes
          document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('show', 'active');
          });
          
          // Show the selected tab pane
          const target = document.querySelector(this.getAttribute('href'));
          if (target) {
            target.classList.add('show', 'active');
          }
          
          // Set active tab
          tabs.forEach(t => t.classList.remove('active'));
          this.classList.add('active');
        });
      });
    }
  }

  /**
   * Update the application title displayed on the page
   */
  updateAppTitle(title) {
    const titleElement = document.getElementById('appTitle');
    if (titleElement) {
      // Make sure we don't use null/undefined title
      const displayTitle = title || this.configManager.appTitle || 'Change Management';
      titleElement.textContent = displayTitle;
      console.log('Application title updated to:', displayTitle);
    }
  }

  /**
   * Setup saved searches dropdown
   */
  setupSavedSearches() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    // Create a parent container for search input and dropdown
    const parentDiv = document.createElement('div');
    parentDiv.className = 'input-group';
    
    // Insert parent div before search input
    searchInput.parentNode.insertBefore(parentDiv, searchInput);
    
    // Move search input into parent div
    parentDiv.appendChild(searchInput);
    
    // Create dropdown button
    const dropdownButton = document.createElement('div');
    dropdownButton.className = 'input-group-append';
    dropdownButton.innerHTML = `
      <button class="btn btn-outline-secondary dropdown-toggle" type="button" 
              id="savedSearchesDropdown" data-toggle="dropdown" 
              aria-haspopup="true" aria-expanded="false" title="Saved Searches">
        <svg width="16" height="16" viewBox="0 0 16 16" class="bi bi-bookmark" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5V2zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1H4z"/>
        </svg>
      </button>
      <div class="dropdown-menu dropdown-menu-right" aria-labelledby="savedSearchesDropdown" id="savedSearchesMenu">
        <!-- Saved searches will be added here -->
        <div class="dropdown-item text-center text-muted small" id="noSavedSearchesMsg">No saved searches</div>
        <div class="dropdown-divider"></div>
        <div class="px-3 py-2">
          <button class="btn btn-sm btn-outline-primary btn-block" id="saveCurrentSearchBtn">
            Save Current Search
          </button>
        </div>
      </div>
    `;
    
    // Add dropdown to input group
    parentDiv.appendChild(dropdownButton);
    
    // Load saved searches
    this.loadSavedSearches();
    
    // Add event listener for save button
    document.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'saveCurrentSearchBtn') {
        this.saveCurrentSearch();
      }
    });
  }

  /**
   * Load saved searches from localStorage
   */
  loadSavedSearches() {
    setTimeout(() => {
      const savedSearchesMenu = document.getElementById('savedSearchesMenu');
      const noSavedSearchesMsg = document.getElementById('noSavedSearchesMsg');
      
      if (!savedSearchesMenu) return;
      
      try {
        // Get saved searches from localStorage
        const savedSearches = JSON.parse(localStorage.getItem('freshservice_saved_searches') || '[]');
        
        // Remove existing search items
        const children = Array.from(savedSearchesMenu.children);
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          if (child.classList.contains('saved-search-item')) {
            savedSearchesMenu.removeChild(child);
          }
        }
        
        // Show or hide "no saved searches" message
        if (savedSearches.length === 0) {
          if (noSavedSearchesMsg) noSavedSearchesMsg.style.display = 'block';
        } else {
          if (noSavedSearchesMsg) noSavedSearchesMsg.style.display = 'none';
          
          // Add saved searches to dropdown
          savedSearches.forEach((search, index) => {
            const item = document.createElement('a');
            item.className = 'dropdown-item saved-search-item';
            item.href = '#';
            item.setAttribute('data-search', search.query);
            item.setAttribute('data-index', index);
            
            // Handle click on saved search
            item.addEventListener('click', function(e) {
              e.preventDefault();
              const searchInput = document.getElementById('searchInput');
              if (searchInput) {
                searchInput.value = this.getAttribute('data-search');
                
                // Auto-execute the search
                if (window.app && window.app.search) {
                  window.app.search.performSearch();
                }
              }
            });
            
            // Add delete button for each search
            item.innerHTML = `
              <div class="d-flex justify-content-between align-items-center">
                <span>${this.escapeHtml(search.query)}</span>
                <button class="btn btn-sm btn-link text-danger p-0 ml-2 delete-saved-search" 
                        title="Delete this saved search" data-index="${index}">
                  <svg width="14" height="14" viewBox="0 0 16 16" class="bi bi-x" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                  </svg>
                </button>
              </div>
            `;
            
            // Insert before the divider
            const divider = savedSearchesMenu.querySelector('.dropdown-divider');
            if (divider) {
              savedSearchesMenu.insertBefore(item, divider);
            } else {
              savedSearchesMenu.appendChild(item);
            }
          });
          
          // Add event listeners for delete buttons
          document.querySelectorAll('.delete-saved-search').forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation(); // Prevent triggering parent click
              
              const index = parseInt(btn.getAttribute('data-index'), 10);
              this.deleteSavedSearch(index);
            });
          });
        }
      } catch (error) {
        console.error('Error loading saved searches:', error);
      }
    }, 500); // Short delay to ensure DOM is ready
  }

  /**
   * Save current search query
   */
  saveCurrentSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput || !searchInput.value.trim()) return;
    
    try {
      // Get current query
      const query = searchInput.value.trim();
      
      // Get current tab (users or requesters)
      const activeTab = document.querySelector('.nav-link.active');
      const searchType = activeTab && activeTab.id === 'users-tab' ? 'users' : 'requesters';
      
      // Get existing saved searches
      const savedSearches = JSON.parse(localStorage.getItem('freshservice_saved_searches') || '[]');
      
      // Check if search already exists to avoid duplicates
      const exists = savedSearches.some(item => item.query === query && item.type === searchType);
      
      if (!exists) {
        // Add new search
        savedSearches.push({
          query,
          type: searchType,
          timestamp: new Date().toISOString()
        });
        
        // Sort by newest first
        savedSearches.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Keep only the 10 most recent searches
        const trimmedSearches = savedSearches.slice(0, 10);
        
        // Save to localStorage
        localStorage.setItem('freshservice_saved_searches', JSON.stringify(trimmedSearches));
        
        // Show success message
        this.showNotification('Search saved!', 'success');
        
        // Reload the dropdown
        this.loadSavedSearches();
      }
    } catch (error) {
      console.error('Error saving search:', error);
    }
  }

  /**
   * Delete a saved search by index
   */
  deleteSavedSearch(index) {
    try {
      // Get existing saved searches
      const savedSearches = JSON.parse(localStorage.getItem('freshservice_saved_searches') || '[]');
      
      // Remove the search at the specified index
      if (index >= 0 && index < savedSearches.length) {
        savedSearches.splice(index, 1);
        
        // Save updated list to localStorage
        localStorage.setItem('freshservice_saved_searches', JSON.stringify(savedSearches));
        
        // Reload the dropdown
        this.loadSavedSearches();
      }
    } catch (error) {
      console.error('Error deleting saved search:', error);
    }
  }

  /**
   * Show a notification message
   */
  showNotification(message, type = 'info') {
    // Check if change-form.js has a notification function
    if (typeof window.showNotification === 'function') {
      return window.showNotification(message, type);
    }
    
    // Create our own notification
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 15px';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '9999';
    notification.textContent = message;
    
    // Set color based on type
    if (type === 'success') {
      notification.style.backgroundColor = '#28a745';
      notification.style.color = 'white';
    } else if (type === 'danger' || type === 'error') {
      notification.style.backgroundColor = '#dc3545';
      notification.style.color = 'white';
    } else if (type === 'warning') {
      notification.style.backgroundColor = '#ffc107';
      notification.style.color = 'black';
    } else {
      notification.style.backgroundColor = '#17a2b8';
      notification.style.color = 'white';
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 2 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 2000);
  }

  /**
   * Show an error message
   */
  showError(message) {
    console.error("Error:", message);
    
    // Try to use the notification system
    return this.showNotification(message, 'danger');
  }

  /**
   * Show a warning message
   */
  showWarning(message) {
    console.warn(message);
    
    const warningElement = document.createElement('div');
    warningElement.className = 'alert alert-warning mt-2 mb-2';
    warningElement.innerHTML = message;
    
    // Add to page if possible
    const container = document.querySelector('.container');
    if (container) {
      container.insertBefore(warningElement, container.firstChild);
    }
    
    return warningElement;
  }

  /**
   * Run diagnostic checks on the app
   */
  runDiagnostics() {
    console.log("Running diagnostics...");
    
    // Check if key elements exist
    const elements = [
      'searchInput', 
      'searchButton', 
      'usersResults', 
      'requestersResults',
      'users-tab',
      'requesters-tab',
      'spinnerOverlay'
    ];
    
    elements.forEach(id => {
      const element = document.getElementById(id) || document.querySelector(`#${id}`);
      console.log(`Element '${id}' exists:`, !!element);
    });
    
    // Log global app object
    console.log('Global app object:', window.app);
    console.log('Global client object:', window.client);
    
    // Check API configuration status
    if (window.app && window.app.config) {
      const apiStatus = {
        apiUrl: window.app.config.apiUrl || 'Not configured',
        hasApiKey: !!window.app.config.apiKey,
        isUsingExampleDomain: (window.app.config.apiUrl || '').includes('example.freshservice.com'),
        appTitle: window.app.config.appTitle || 'Default title'
      };
      
      console.log('API CONFIGURATION STATUS:', apiStatus);
      
      if (apiStatus.isUsingExampleDomain) {
        console.error('⚠️ CONFIGURATION ISSUE DETECTED: Using example domain');
        this.showWarning(`
          <strong>Configuration Issue Detected:</strong> Using example domain.<br>
          <p>To fix this issue, add the following to your URL:</p>
          <code>?api_url=yourdomain.freshservice.com&api_key=your-api-key</code>
        `);
      }
    }
  }

  /**
   * Render search results to the UI
   */
  renderSearchResults(type, results) {
    console.log(`Rendering ${results.length} results for ${type}`);
    
    // Check if there's a more specific search handler in change-form.js
    if (window.renderSearchResults && typeof window.renderSearchResults === 'function' && 
        window.renderSearchResults !== this.renderSearchResults) {
      return window.renderSearchResults(type, results);
    }
    
    // Otherwise, implement basic rendering here
    const resultsContainerId = `${type}Results`;
    const resultsContainer = document.getElementById(resultsContainerId);
    
    if (!resultsContainer) {
      console.error(`Results container '${resultsContainerId}' not found in the DOM`);
      return;
    }
    
    if (results.length === 0) {
      resultsContainer.innerHTML = `<div class="alert alert-info">No ${type} found matching your search criteria.</div>`;
      return;
    }
    
    // Build HTML for results
    let html = '<div class="list-group">';
    
    results.forEach(result => {
      const displayName = `${result.first_name || ''} ${result.last_name || ''}`.trim() || 'Unknown';
      const email = result.email || '';
      
      html += `
        <div class="list-group-item" 
             data-id="${result.id}" 
             data-name="${displayName}" 
             data-email="${email}" 
             data-department="${result.department || ''}"
             onclick="selectUser('${type === 'users' ? 'agent' : 'requester'}', this.dataset)">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h5 class="mb-1">${displayName}</h5>
              <p class="mb-1">${email}</p>
              ${result.department ? `<small class="text-muted">Department: ${result.department}</small>` : ''}
            </div>
            <span class="badge badge-primary badge-pill">Select</span>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    resultsContainer.innerHTML = html;
  }

  /**
   * Helper function to escape HTML
   */
  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
} 