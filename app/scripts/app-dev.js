/**
 * User Search App for Freshservice (Development version)
 * 
 * This is a non-module version with complete functionality for local development
 */

// Set module loading indicator
window.__MODULES_LOADED__ = true;

// Global app object
window.app = {
  initialized: false,
  client: null
};

// Simple API client implementation
function createApiClient() {
  return {
    searchUsers: function(query, callback) {
      console.log('Searching users for:', query);
      // Simulate API call for development
      setTimeout(function() {
        const mockUsers = [
          { id: 1, name: 'John Smith', email: 'john@example.com', department: 'IT' },
          { id: 2, name: 'Jane Doe', email: 'jane@example.com', department: 'Support' },
          { id: 3, name: 'Alice Johnson', email: 'alice@example.com', department: 'HR' }
        ].filter(user => 
          user.name.toLowerCase().includes(query.toLowerCase()) || 
          user.email.toLowerCase().includes(query.toLowerCase())
        );
        callback(null, mockUsers);
      }, 500);
    },
    
    searchRequesters: function(query, callback) {
      console.log('Searching requesters for:', query);
      // Simulate API call for development
      setTimeout(function() {
        const mockRequesters = [
          { id: 1, name: 'Sarah Wilson', email: 'sarah@example.com', department: 'Sales' },
          { id: 2, name: 'Michael Brown', email: 'michael@example.com', department: 'Marketing' },
          { id: 3, name: 'Emma Davis', email: 'emma@example.com', department: 'Finance' }
        ].filter(requester => 
          requester.name.toLowerCase().includes(query.toLowerCase()) || 
          requester.email.toLowerCase().includes(query.toLowerCase())
        );
        callback(null, mockRequesters);
      }, 500);
    },
    
    createDevClient: function() {
      return {
        iparams: {
          get: function(callback) {
            callback(null, {
              api_key: 'dev_api_key',
              domain: 'dev.freshservice.com',
              app_title: 'Change Management (Dev)'
            });
          }
        },
        data: {
          get: function(key, callback) {
            const stored = localStorage.getItem('fdk_data_' + key);
            callback(null, stored ? JSON.parse(stored) : null);
          },
          set: function(key, value, callback) {
            localStorage.setItem('fdk_data_' + key, JSON.stringify(value));
            callback(null, true);
          }
        },
        request: {
          get: function(url, options, callback) {
            console.log('Development mock request: GET', url);
            // Mock data based on URL
            let data = [];
            
            if (url.includes('agents')) {
              data = [
                { id: 1, name: 'John Smith', email: 'john@example.com', department: 'IT' },
                { id: 2, name: 'Jane Doe', email: 'jane@example.com', department: 'Support' }
              ];
            } else if (url.includes('requesters')) {
              data = [
                { id: 3, name: 'Sarah Wilson', email: 'sarah@example.com', department: 'Sales' },
                { id: 4, name: 'Michael Brown', email: 'michael@example.com', department: 'Marketing' }
              ];
            }
            
            setTimeout(function() {
              callback(null, { response: data });
            }, 500);
          },
          post: function(url, options, callback) {
            console.log('Development mock request: POST', url, options.body);
            setTimeout(function() {
              callback(null, { response: { success: true, id: Math.floor(Math.random() * 1000) } });
            }, 500);
          }
        }
      };
    }
  };
}

// Simple config manager
function createConfigManager() {
  return {
    config: {
      app_title: 'Change Management (Dev)',
      changeTypes: [
        { id: 'normal', name: 'Normal Change', description: 'Standard change with full approval flow' },
        { id: 'emergency', name: 'Emergency Change', description: 'Urgent change with expedited approval' },
        { id: 'standard', name: 'Standard Change', description: 'Pre-approved, routine change' }
      ]
    },
    
    initializeConfig: function(client) {
      console.log('Initializing config with client');
      // In development mode, just use default config
    },
    
    getConfig: function() {
      return this.config;
    }
  };
}

// UI Manager
function createUIManager(configManager) {
  return {
    configManager: configManager,
    
    setupUI: function() {
      console.log('Setting up UI components');
      const config = this.configManager.getConfig();
      this.updateAppTitle(config.app_title);
    },
    
    updateAppTitle: function(title) {
      const appTitleEl = document.getElementById('appTitle');
      if (appTitleEl) {
        appTitleEl.textContent = title || 'Change Management';
      }
    },
    
    renderSearchResults: function(type, results) {
      console.log(`Rendering ${results.length} results for ${type}`);
      const resultsEl = document.getElementById(`${type}Results`);
      
      if (!resultsEl) {
        console.error(`Results container for ${type} not found`);
        return false;
      }
      
      if (results.length === 0) {
        resultsEl.innerHTML = '<div class="p-3 text-muted">No results found</div>';
        return true;
      }
      
      let html = '';
      results.forEach(function(item) {
        html += `
          <div class="result-item p-2" data-id="${item.id}">
            <div class="d-flex justify-content-between">
              <div>
                <div class="font-weight-bold">${item.name}</div>
                <div class="small text-muted">${item.email}</div>
              </div>
              <button type="button" class="btn btn-sm btn-primary select-item" 
                data-id="${item.id}" 
                data-name="${item.name}"
                data-email="${item.email}"
                data-dept="${item.department || ''}"
                data-type="${type}"
                onclick="selectItem('${type}', ${item.id}, '${item.name}', '${item.email}', '${item.department || ''}')">
                Select
              </button>
            </div>
          </div>`;
      });
      
      resultsEl.innerHTML = html;
      return true;
    },
    
    runDiagnostics: function() {
      console.log('Running UI diagnostics for development mode');
    }
  };
}

// User search service
function createUserSearchService(apiClient, uiManager) {
  return {
    apiClient: apiClient,
    uiManager: uiManager,
    
    searchUsers: function(query, callback) {
      console.log('Searching users for query:', query);
      const self = this;
      
      this.apiClient.searchUsers(query, function(error, results) {
        if (error) {
          console.error('Error searching users:', error);
          if (callback) callback(error, null);
          return;
        }
        
        // Render results if no callback provided
        if (!callback) {
          self.uiManager.renderSearchResults('agent', results);
        } else {
          callback(null, results);
        }
      });
    },
    
    searchRequesters: function(query, callback) {
      console.log('Searching requesters for query:', query);
      const self = this;
      
      this.apiClient.searchRequesters(query, function(error, results) {
        if (error) {
          console.error('Error searching requesters:', error);
          if (callback) callback(error, null);
          return;
        }
        
        // Render results if no callback provided
        if (!callback) {
          self.uiManager.renderSearchResults('requester', results);
        } else {
          callback(null, results);
        }
      });
    },
    
    performSearch: function() {
      console.log('Performing search with current inputs');
    }
  };
}

// Function to toggle loading spinner
function toggleSpinner(show) {
  const spinner = document.getElementById('spinnerOverlay');
  if (spinner) {
    if (show) {
      spinner.classList.remove('d-none');
    } else {
      spinner.classList.add('d-none');
    }
  }
}

// Initialize the app
function initializeApp() {
  console.log('Initializing app in development mode...');
  
  // Show the loading indicator - but with timeout protection
  toggleSpinner(true);
  setTimeout(function() { 
    toggleSpinner(false);
  }, 5000);
  
  // Initialize core services
  const configManager = createConfigManager();
  const apiClient = createApiClient();
  const uiManager = createUIManager(configManager);
  const userSearchService = createUserSearchService(apiClient, uiManager);
  
  // Attach to global app object
  window.app = {
    config: configManager,
    api: apiClient,
    ui: uiManager,
    search: userSearchService,
    
    // Exposed methods for external components
    toggleSpinner: toggleSpinner,
    searchUsers: function(query, callback) { 
      return userSearchService.searchUsers(query, callback); 
    },
    searchRequesters: function(query, callback) { 
      return userSearchService.searchRequesters(query, callback); 
    },
    performSearch: function() { 
      return userSearchService.performSearch(); 
    },
    updateAppTitle: function(title) { 
      return uiManager.updateAppTitle(title); 
    },
    
    // Render search results globally for change-form.js
    renderResults: function(type, results) { 
      return uiManager.renderSearchResults(type, results); 
    }
  };
  
  // Create mock client for development
  const devClient = apiClient.createDevClient();
  window.client = devClient;
  onClientReady(devClient);
}

// Handle client ready state
function onClientReady(client) {
  console.log('Client ready, initializing app features');
  window.app.client = client;
  window.app.initialized = true;
  
  // Initialize configuration
  window.app.config.initializeConfig(client);
  
  // Setup UI components
  window.app.ui.setupUI();
  
  // Hide spinner
  toggleSpinner(false);
  
  // Run diagnostics after a delay
  setTimeout(function() {
    if (window.app && window.app.ui) {
      window.app.ui.runDiagnostics();
    }
  }, 2000);
}

// Add global helper for selecting items (used by rendered HTML)
window.selectItem = function(type, id, name, email, dept) {
  console.log(`Selected ${type}: ${name} (${id})`);
  
  // Update the selected item UI
  const selectedEl = document.getElementById(`selected${type.charAt(0).toUpperCase() + type.slice(1)}`);
  if (selectedEl) {
    selectedEl.classList.remove('d-none');
    
    // Update the details
    const nameEl = document.getElementById(`${type}Name`);
    const emailEl = document.getElementById(`${type}Email`);
    const deptEl = document.getElementById(`${type}Dept`);
    
    if (nameEl) nameEl.textContent = name;
    if (emailEl) emailEl.textContent = email;
    if (deptEl) deptEl.textContent = dept;
  }
  
  // Hide the results
  const resultsEl = document.getElementById(`${type}Results`);
  if (resultsEl) {
    resultsEl.innerHTML = '';
  }
  
  // Optional: Also store the selection
  if (window.app && window.app.client && window.app.client.data) {
    window.app.client.data.set(`selected_${type}`, { id, name, email, dept }, function() {});
  }
};

// Add global helper for clearing selections
window.clearSelectedItem = function(type) {
  console.log(`Clearing selected ${type}`);
  
  const selectedEl = document.getElementById(`selected${type.charAt(0).toUpperCase() + type.slice(1)}`);
  if (selectedEl) {
    selectedEl.classList.add('d-none');
  }
  
  // Optional: Clear stored selection
  if (window.app && window.app.client && window.app.client.data) {
    window.app.client.data.set(`selected_${type}`, null, function() {});
  }
};

// Make necessary functions available globally
window.updateAppTitle = function(title) {
  if (window.app && window.app.updateAppTitle) {
    window.app.updateAppTitle(title);
  }
};

// Global renderSearchResults function for change-form.js integration
window.renderSearchResults = function(type, results) {
  console.log(`Rendering ${results.length} results for ${type} (global function)`);
  if (window.app && window.app.renderResults) {
    return window.app.renderResults(type, results);
  }
};

// For backward compatibility, keep basic spinner functionality
document.addEventListener('DOMContentLoaded', function() {
  const spinner = document.getElementById('spinnerOverlay');
  if (spinner) {
    console.log('Forcibly hiding spinner overlay from app-dev.js');
    spinner.classList.add('d-none');
  }
  
  // Set a timeout to ensure spinner is hidden even if there are errors
  setTimeout(function() {
    const spinner = document.getElementById('spinnerOverlay');
    if (spinner) spinner.classList.add('d-none');
  }, 3000);

  // Initialize the app
  initializeApp();
}); 