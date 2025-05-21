/**
 * User Search App for Freshservice
 * 
 * Allows searching users and requesters by name or email
 * using the Freshservice API v2
 */

// Immediately hide spinner overlay to prevent loading state
document.addEventListener('DOMContentLoaded', function() {
  const spinner = document.getElementById('spinnerOverlay');
  if (spinner) {
    console.log('Forcibly hiding spinner overlay');
    spinner.classList.add('d-none');
  }
});

// Handle CSP errors
window.addEventListener('securitypolicyviolation', function(e) {
  console.error('CSP violation:', e.blockedURI, 'violated directive:', e.violatedDirective);
});

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

// Fix for local development environment
(function() {
  // Check if we're in a local development environment
  const isLocalDev = window.location.href.includes('localhost') || 
    window.location.hostname.includes('127.0.0.1');
  
  // Separate check for dev mode without enabling example domains
  const isDevMode = window.location.href.includes('dev=true');
  
  if (isLocalDev || isDevMode) {
    console.log("Development environment detected");
    
    // HTTPS to HTTP conversion disabled
    
    // Fix for resource loading (images, scripts, etc.)
    if (document.addEventListener) {
      document.addEventListener('DOMContentLoaded', function() {
        console.log('Protocol conversion disabled by user request');
      });
    }
  }
  
  // Parse URL parameters for configuration
  const urlParams = new URLSearchParams(window.location.search);
  const forceDevMode = urlParams.get('dev') === 'true';
  const apiUrlParam = urlParams.get('api_url');
  const apiKeyParam = urlParams.get('api_key');
  const appTitleParam = urlParams.get('app_title');
  
  // Store parameters from URL if provided
  window.__DEV_PARAMS__ = window.__DEV_PARAMS__ || {};
  
  if (apiUrlParam) {
    console.log('API URL parameter found:', apiUrlParam);
    window.__DEV_PARAMS__.api_url = apiUrlParam;
  }
  
  if (apiKeyParam) {
    console.log('API Key parameter found (value hidden for security)');
    window.__DEV_PARAMS__.api_key = apiKeyParam;
  }
  
  if (appTitleParam) {
    console.log('App Title parameter found:', appTitleParam);
    window.__DEV_PARAMS__.app_title = appTitleParam;
  }
  
  // Add dev mode status to window object 
  window.__DEV_MODE__ = isLocalDev || isDevMode || forceDevMode;
  
  if (window.__DEV_MODE__) {
    console.log('Development mode active');
    // Add a visual indicator for dev mode
    document.addEventListener('DOMContentLoaded', function() {
      const devBadge = document.createElement('div');
      devBadge.style.position = 'fixed';
      devBadge.style.top = '5px';
      devBadge.style.right = '5px';
      devBadge.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
      devBadge.style.color = 'white';
      devBadge.style.padding = '3px 6px';
      devBadge.style.fontSize = '10px';
      devBadge.style.borderRadius = '3px';
      devBadge.style.zIndex = '9999';
      devBadge.textContent = 'DEV MODE';
      document.body.appendChild(devBadge);
    });
  }
})();

  // Add a diagnostic function to run after a short delay
function runDiagnostics() {
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
    if (element && id === 'searchButton') {
      // Add direct click handler as a fallback
      element.onclick = function() {
        console.log('Search button clicked via direct onclick handler');
        if (typeof performSearch === 'function') {
          performSearch();
        } else {
          console.error('performSearch function not available');
        }
      };
    }
  });
  
  // Log global app object
  console.log('Global app object:', window.app);
  console.log('Global client object:', window.client);
  
  // More detailed debugging of app state
  console.log('--------- DETAILED APP DIAGNOSTICS ---------');
  
  // Check for app state
  if (typeof app !== 'undefined') {
    console.log('App object:', app);
    
    // Display API configuration status
    const apiStatus = {
      apiUrl: app.apiUrl || 'Not configured',
      hasApiKey: !!app.apiKey,
      isUsingExampleDomain: (app.apiUrl || '').includes('example.freshservice.com'),
      appTitle: app.appTitle || 'Default title',
      configuredEndpoints: app.endpoints || 'No endpoints configured'
    };
    
    console.log('API CONFIGURATION STATUS:', apiStatus);
    
    if (apiStatus.isUsingExampleDomain) {
      console.error('⚠️ CONFIGURATION ISSUE DETECTED: Using example domain');
      console.error('To fix this issue, add the following to your URL:');
      console.error('?api_url=yourdomain.freshservice.com&api_key=your-api-key');
      
      // Show a visual warning in the UI
      const container = document.querySelector('.container');
      if (container) {
        const warning = document.createElement('div');
        warning.className = 'alert alert-danger mt-2 mb-2';
        warning.innerHTML = `
          <strong>Configuration Issue Detected:</strong> Using example domain.<br>
          <p>To fix this issue, add the following to your URL:</p>
          <code>?api_url=yourdomain.freshservice.com&api_key=your-api-key</code>
        `;
        container.insertBefore(warning, container.firstChild);
      }
    }
    
    // Add more debug info
    console.log('Window location:', window.location.href);
    console.log('URL has dev=true:', window.location.href.includes('dev=true'));
    
    // Check configuration storage
    if (window.client && window.client.db) {
      console.log('Client DB is available, checking stored configuration...');
      window.client.db.get('app_config')
        .then(config => {
          console.log('Stored configuration in client.db:', config);
          if (config && config.apiUrl && config.apiUrl.includes('example.freshservice.com')) {
            console.error('⚠️ STORAGE ISSUE: example domain found in client.db storage');
          }
        })
        .catch(err => console.error('Error checking client.db:', err));
    }
    
    // Check localStorage backup
    try {
      const localStorageData = localStorage.getItem('freshservice_change_management_iparams');
      if (localStorageData) {
        const localConfig = JSON.parse(localStorageData);
        console.log('Backup configuration in localStorage:', localConfig);
        if (localConfig.api_url && localConfig.api_url.includes('example.freshservice.com')) {
          console.error('⚠️ STORAGE ISSUE: example domain found in localStorage');
        }
      }
    } catch (e) {
      console.error('Error checking localStorage:', e);
    }
    
    // Check if the client has iparams method
    if (window.client) {
      console.log('Client object available');
      console.log('Client has iparams:', !!window.client.iparams);
      console.log('Client has context:', !!window.client.context);
      console.log('Client has db:', !!window.client.db);
      
      // Try to get client details
      const clientInfo = {
        type: typeof window.client,
        methods: Object.keys(window.client || {})
      };
      console.log('Client details:', clientInfo);
    } else {
      console.error('Client object not available');
    }
  }
  
  console.log('------------------------------------------');
}

// Fake client for local development testing with sample data
    function createFakeClient() {
      console.log('Creating fake client for development testing');
      
      return {
        iparams: {
          get: function() {
            console.log('Fake client: iparams.get called');
            
            // Never use example domain, use empty string if no params provided
            return Promise.resolve({
              api_url: window.__DEV_PARAMS__?.api_url || '',
              api_key: window.__DEV_PARAMS__?.api_key || ''
            });
          }
        },
    db: {
      set: function(key, value) {
        console.log('Fake client: db.set called with key:', key);
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return Promise.resolve({ Created: true });
        } catch (e) {
          return Promise.reject(e);
        }
      },
      get: function(key) {
        console.log('Fake client: db.get called with key:', key);
        try {
          const value = localStorage.getItem(key);
          return Promise.resolve(value ? JSON.parse(value) : null);
        } catch (e) {
          return Promise.reject(e);
        }
      }
    },
    request: {
      get: function(url) {
        console.log('Fake client: request.get called with:', url);
        return Promise.reject({
          status: 400,
          message: 'This is a fake client for development only. API calls will not work.'
        });
      }
    }
  };
}

(function() {
  // Initialize the app
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Document ready, initializing app...');
    
    // Initialize global app object with functions for change-form.js
    window.app = {
      // Expose search functions
      searchUsers,
      searchRequesters,
      onClientReady,
      performSearch,
      // Add renderResults function to the global app object
      renderResults: function(type, results) {
        console.log(`Rendering ${results.length} results for ${type}`);
        
        // This is a simple implementation that formats search results to the DOM
        // Since this is used by the change-form.js, we delegate to its renderer
        if (type === 'users' || type === 'requesters') {
          // First, check if there's a more specific search handler in change-form.js
          if (window.renderSearchResults && typeof window.renderSearchResults === 'function') {
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
      }
    };
    
    // Start app initialization
    initializeApp();
  });

  // Real client for development testing that makes actual API calls
  function createDevClient() {
    console.log('Creating real dev client for sandbox testing');
    
    // Try to load saved iparams from a test function first
    const savedIparams = null;
    
    return {
      iparams: {
        get: function() {
          console.log('Dev client: iparams.get called');
          
          // Use URL parameters first if provided
          if (window.__DEV_PARAMS__?.api_url || window.__DEV_PARAMS__?.api_key) {
            console.log('Using configuration from URL parameters');
            const params = {
              api_url: window.__DEV_PARAMS__?.api_url || savedIparams?.api_url || 'example.freshservice.com',
              api_key: window.__DEV_PARAMS__?.api_key || savedIparams?.api_key || 'dev-placeholder-key',
              app_title: window.__DEV_PARAMS__?.app_title || savedIparams?.app_title || 'Change Management',
              change_types: window.__DEV_PARAMS__?.change_types || savedIparams?.change_types || [
                "Standard Change",
                "Emergency Change",
                "Non-Standard Change"
              ]
            };
            
            // Save to data storage
            this.saveConfigToStorage(params);
            
            return Promise.resolve(params);
          }
          
          // Try to load from data storage
          return this.loadConfigFromStorage()
            .then(config => {
                          if (config) {
              console.log('Using saved iparams from data storage');
              return config;
            }
            
            // Default config if nothing is found - no example domains
            const defaultConfig = {
              api_url: '', // Empty string instead of example domain
              api_key: '',
              app_title: 'Change Management',
              change_types: [
                "Standard Change",
                "Emergency Change",
                "Non-Standard Change"
              ]
            };
            
            return defaultConfig;
            })
            .catch(err => {
              console.error('Error loading from data storage:', err);
              // Return default config on error - no example domains
              return {
                api_url: '', // Empty string instead of example domain
                api_key: '',
                app_title: 'Change Management',
                change_types: [
                  "Standard Change",
                  "Emergency Change",
                  "Non-Standard Change"
                ]
              };
            });
        },
        
        saveConfigToStorage: function(config) {
          console.log('Saving configuration to data storage');
          try {
            if (window.client && window.client.db) {
              window.client.db.set('app_config', config)
                .then(() => console.log('Saved config to data storage'))
                .catch(err => console.error('Error saving to data storage:', err));
            } else {
              // Fallback to localStorage for dev mode
              localStorage.setItem('freshservice_change_management_iparams', JSON.stringify(config));
              console.log('Saved config to localStorage (fallback)');
            }
          } catch (e) {
            console.error('Error saving configuration:', e);
          }
        },
        
        loadConfigFromStorage: function() {
          console.log('Loading configuration from data storage');
          
          // First try to load from client.db
          if (window.client && window.client.db) {
            return window.client.db.get('app_config')
              .then(config => {
                if (config) {
                  console.log('Found config in data storage');
                  return config;
                }
                
                // If not found in client.db, try localStorage fallback
                try {
                  const savedData = localStorage.getItem('freshservice_change_management_iparams');
                  if (savedData) {
                    const savedConfig = JSON.parse(savedData);
                    console.log('Found config in localStorage, migrating to data storage');
                    
                    // Migrate to client.db
                    this.saveConfigToStorage(savedConfig);
                    
                    return savedConfig;
                  }
                } catch (e) {
                  console.error('Error reading from localStorage:', e);
                }
                
                return null;
              })
              .catch(err => {
                console.error('Error reading from data storage:', err);
                
                // Fallback to localStorage
                try {
                  const savedData = localStorage.getItem('freshservice_change_management_iparams');
                  if (savedData) {
                    return JSON.parse(savedData);
                  }
                } catch (e) {
                  console.error('Error reading from localStorage:', e);
                }
                
                return null;
              });
          } else {
            // If client.db is not available, use localStorage
            return new Promise((resolve) => {
              try {
                const savedData = localStorage.getItem('freshservice_change_management_iparams');
                if (savedData) {
                  resolve(JSON.parse(savedData));
                } else {
                  resolve(null);
                }
              } catch (e) {
                console.error('Error reading from localStorage:', e);
                resolve(null);
              }
            });
          }
        }
      },
      db: {
        set: function(key, value) {
          console.log('Dev client: db.set called with key:', key);
          try {
            localStorage.setItem(key, JSON.stringify(value));
            return Promise.resolve({ Created: true });
          } catch (e) {
            return Promise.reject(e);
          }
        },
        get: function(key) {
          console.log('Dev client: db.get called with key:', key);
          try {
            const value = localStorage.getItem(key);
            return Promise.resolve(value ? JSON.parse(value) : null);
          } catch (e) {
            return Promise.reject(e);
          }
        }
      },
      request: {
        get: function(url) {
          // Ensure we use the full URL with the configured API URL
          let apiUrl = url;
          
          // If the URL is a relative path, prepend the configured API URL
          if (url.startsWith('/')) {
            if (window.app && window.app.apiUrl) {
              apiUrl = window.app.apiUrl + url;
              console.log('Dev client: Making real API call to full URL:', apiUrl);
            } else {
              console.error('API URL not configured but trying to make API call');
              return Promise.reject({
                status: 400,
                statusText: 'API URL not configured'
              });
            }
          } else {
            console.log('Dev client: Making real API call to provided URL:', apiUrl);
          }
          
          // Check if URL is using example.freshservice.com
          if (apiUrl.includes('example.freshservice.com')) {
            const warningMsg = 'API call using example.freshservice.com detected. This will not work with real data.';
            console.error(warningMsg);
            console.error('Please configure your actual Freshservice URL in the app settings.');
            console.error('Add ?api_url=yourdomain.freshservice.com&api_key=your_api_key to your URL to fix this issue.');
            
            // Display a more helpful error in the UI
            showError(`${warningMsg} Add ?api_url=yourdomain.freshservice.com&api_key=your_api_key to your URL.`);
            
            return Promise.reject({
              status: 400,
              statusText: 'Invalid API URL: Using example.freshservice.com placeholder. Please configure your actual Freshservice domain.'
            });
          }
          
          // Get API key from iparams in localStorage or dev params
          let apiKey = window.__DEV_PARAMS__?.api_key;
          
          // If not in URL params, try localStorage
          if (!apiKey) {
            try {
              // Try client.db first through our app object
              if (app && app.apiKey) {
                apiKey = app.apiKey;
                console.log('Using API key from app configuration');
              } else {
                const savedData = localStorage.getItem('freshservice_change_management_iparams');
                if (savedData) {
                  const savedIparams = JSON.parse(savedData);
                  apiKey = savedIparams.api_key;
                  console.log('Using API key from saved settings');
                }
              }
            } catch (e) {
              console.error('Error reading API key from storage:', e);
            }
          }
          
          // Default if still not found
          if (!apiKey) {
            console.warn('No API key found, using placeholder. API calls will likely fail.');
            apiKey = 'dev-placeholder-key';
          }
          
          const authToken = btoa(apiKey + ':X');
          
          // Make a real fetch call to the Freshservice API
          return fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Authorization': 'Basic ' + authToken,
              'Content-Type': 'application/json'
            }
          })
          .then(response => {
            if (!response.ok) {
              throw {
                status: response.status,
                statusText: response.statusText
              };
            }
            return response.json().then(data => {
              // Format response to match the client.request.get format
              return {
                response: JSON.stringify(data),
                status: response.status
              };
            });
          })
          .catch(error => {
            console.error('Error making API call:', error);
            throw error;
          });
        }
      }
    };
  }
  
  // Initialize by directly accessing the Freshworks Client factory
  function initializeApp() {
    console.log('Initializing Change Management app');
    
    // Show the loading indicator - but with timeout protection
    toggleSpinner(true);
    setTimeout(() => toggleSpinner(false), 5000); // Force hide after 5 seconds
    
    // Create a safety net if client is not defined yet
    if (typeof client === 'undefined') {
      console.warn('Client object not available, creating fallback client');
      window.client = createDevClient();
    }
    
    // Attempt to get client from the Freshworks SDK
    try {
      // Set a timeout to proceed anyway if the initialization takes too long
      const initTimeout = setTimeout(() => {
        console.warn('Client initialization taking too long, proceeding with fallback');
        initializeFallback();
      }, 3000);
      
      client.initialized()
        .then(function() {
          clearTimeout(initTimeout);
          console.log('Freshworks Client initialized');
          onClientReady(client);
        })
        .catch(function(error) {
          clearTimeout(initTimeout);
          console.error('Failed to initialize Freshworks client:', error);
          // Fall back to direct initialization without the client
          initializeFallback();
        });
    } catch (error) {
      console.error('Error initializing client:', error);
      initializeFallback();
    }
      
    // Set up integration with change form
    integrateWithChangeForm();
  }
  
  // Fallback initialization - try Freshworks App SDK methods
  function initializeFallback() {
    console.log('Using initialization fallback methods');
    
    // If window.client already exists, use it
    if (window.client) {
      console.log('Client already available in window.client');
      onClientReady(window.client);
      return;
    }
    
    // Check if we're in Freshservice and can force creation of client
    if (typeof apploader !== 'undefined' && apploader._client) {
      console.log('Using apploader._client');
      window.client = apploader._client;
      onClientReady(apploader._client);
      return;
    }
    
    // Create dev client that makes real API calls
    console.log('Creating client with saved settings');
    const devClient = createDevClient();
    window.client = devClient;
    onClientReady(devClient);
  }
  
  function onClientReady(client) {
    // Ensure we only initialize once
    if (window.app && window.app.initialized) {
      console.log('App already initialized, skipping initialization');
      return;
    }
    
    console.log('Client ready, initializing app features');
    window.app = window.app || {};
    window.app.initialized = true;
    window.app.client = client;
    
    // Clear any example domains from storage before loading config
    clearExampleDomainsFromStorage(client)
      .then(() => {
        // Load API configuration
        loadApiConfiguration(client);
        
        // Add event listeners
        setupEventListeners();
        
        // Run diagnostics after a short delay
        setTimeout(runDiagnostics, 2000);
      });
  }
  
  // Show warning message but don't block the app
  function showWarning(message) {
    console.warn(message);
    const warningElement = document.createElement('div');
    warningElement.className = 'alert alert-warning mt-2 mb-2';
    warningElement.innerHTML = message;
    
    // Add to page if possible
    const container = document.querySelector('.container');
    if (container) {
      container.insertBefore(warningElement, container.firstChild);
    }
    
    return warningElement; // Return the element in case the caller needs it
  }
  
  // Function to clear any example domains from storage before loading config
  function clearExampleDomainsFromStorage(client) {
    console.log('Checking for example domains in storage...');
    
    return new Promise((resolve) => {
      // Check client.db storage for app_config
      if (client && client.db) {
        client.db.get('app_config')
          .then(config => {
            if (config && config.apiUrl && config.apiUrl.includes('example.freshservice.com')) {
              console.warn('Found example domain in client.db, clearing it...');
              
              // Show warning to the user about the example domain
              showWarning('Example domain detected in storage. Cleaning up configuration...');
              
              // Create a clean config without the example domain
              const cleanConfig = {
                ...config,
                apiUrl: '' // Clear the example domain
              };
              
              // Try to preserve the API key and other settings if they're valid
              if (!config.apiKey || config.apiKey === 'dev-placeholder-key') {
                cleanConfig.apiKey = ''; // Clear placeholder API key
              }
              
              return client.db.set('app_config', cleanConfig)
                .then(() => {
                  console.log('Successfully cleared example domain from client.db');
                  return true;
                })
                .catch(err => {
                  console.error('Error clearing example domain from client.db:', err);
                  return false;
                });
            } else {
              console.log('No example domain found in client.db');
              return false;
            }
          })
          .catch(err => {
            console.error('Error checking client.db for example domain:', err);
            return false;
          })
          .finally(() => {
            // Also check localStorage, which might be used as a fallback
            try {
              const localStorageData = localStorage.getItem('freshservice_change_management_iparams');
              if (localStorageData) {
                const localConfig = JSON.parse(localStorageData);
                if (localConfig.api_url && localConfig.api_url.includes('example.freshservice.com')) {
                  console.warn('Found example domain in localStorage, clearing it...');
                  
                  // Create a clean config without the example domain
                  const cleanLocalConfig = {
                    ...localConfig,
                    api_url: '' // Clear the example domain
                  };
                  
                  // Try to preserve the API key and other settings if they're valid
                  if (!localConfig.api_key || localConfig.api_key === 'dev-placeholder-key') {
                    cleanLocalConfig.api_key = ''; // Clear placeholder API key
                  }
                  
                  localStorage.setItem('freshservice_change_management_iparams', JSON.stringify(cleanLocalConfig));
                  console.log('Successfully cleared example domain from localStorage');
                }
              }
            } catch (e) {
              console.error('Error clearing example domain from localStorage:', e);
            }
            
            // Add a reset button to the UI
            addConfigResetButton(client);
            
            // Resolve the promise to continue initialization
            resolve();
          });
      } else {
        console.log('Client.db not available, skipping example domain check');
        // Add a reset button to the UI even if client.db is not available
        addConfigResetButton(client);
        resolve();
      }
    });
  }
  
  // Add a reset button to the UI to allow manual configuration reset
  function addConfigResetButton(client) {
    document.addEventListener('DOMContentLoaded', function() {
      const container = document.querySelector('.container');
      if (!container) return;
      
      // Check if reset button already exists
      if (document.getElementById('resetConfigButton')) return;
      
      // Create a reset button
      const resetButton = document.createElement('button');
      resetButton.id = 'resetConfigButton';
      resetButton.className = 'btn btn-sm btn-outline-danger mt-1 mb-3';
      resetButton.innerHTML = '<i class="fas fa-sync-alt"></i> Reset Configuration';
      resetButton.title = 'Clear all saved settings and reload';
      resetButton.style.float = 'right';
      
      // Add click handler
      resetButton.addEventListener('click', function() {
        // Show confirmation dialog using DOM elements
        const confirmDialog = document.createElement('div');
        confirmDialog.className = 'modal fade show';
        confirmDialog.style.display = 'block';
        confirmDialog.style.backgroundColor = 'rgba(0,0,0,0.5)';
        confirmDialog.innerHTML = `
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Confirm Reset</h5>
                <button type="button" class="close" data-dismiss="modal">&times;</button>
              </div>
              <div class="modal-body">
                <p>Are you sure you want to reset all configuration? This will clear all saved settings.</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirmReset">Reset</button>
              </div>
            </div>
          </div>
        `;
        
        // Add to body
        document.body.appendChild(confirmDialog);
        
        // Handle close button
        const closeBtn = confirmDialog.querySelector('.close');
        if (closeBtn) {
          closeBtn.addEventListener('click', function() {
            document.body.removeChild(confirmDialog);
          });
        }
        
        // Handle cancel button
        const cancelBtn = confirmDialog.querySelector('.btn-secondary');
        if (cancelBtn) {
          cancelBtn.addEventListener('click', function() {
            document.body.removeChild(confirmDialog);
          });
        }
        
        // Handle confirm button
        const confirmBtn = document.getElementById('confirmReset');
        if (confirmBtn) {
          confirmBtn.addEventListener('click', function() {
            // Close the dialog
            document.body.removeChild(confirmDialog);
            
            // Clear data from client.db
            if (client && client.db) {
              client.db.set('app_config', {})
                .then(() => console.log('Cleared app_config from client.db'))
                .catch(err => console.error('Error clearing app_config from client.db:', err));
            }
            
            // Clear data from localStorage
            localStorage.removeItem('freshservice_change_management_iparams');
            localStorage.removeItem('appConfig');
            
            // Show success message
            const successMsg = document.createElement('div');
            successMsg.className = 'alert alert-success';
            successMsg.innerHTML = 'Configuration reset successfully. Reloading...';
            container.insertBefore(successMsg, container.firstChild);
            
            // Reload the page after a short delay to apply changes
            setTimeout(function() {
              location.reload();
            }, 1500);
          });
        }
      });
      
      // Add to the DOM
      const titleElement = document.getElementById('appTitle');
      if (titleElement && titleElement.parentNode) {
        titleElement.parentNode.appendChild(resetButton);
      } else {
        container.insertBefore(resetButton, container.firstChild);
      }
    });
  }
  
  function loadApiConfiguration(client) {
    console.log('Loading API configuration from client');
    
    // Create global app object if it doesn't exist
    window.app = window.app || {};
    
    // First check for URL parameters that override everything
    const urlParams = new URLSearchParams(window.location.search);
    const apiUrlParam = urlParams.get('api_url');
    const apiKeyParam = urlParams.get('api_key');
    
    if (apiUrlParam && apiKeyParam) {
      console.log('Using configuration from URL parameters');
      
      // Process API URL to ensure it has proper format
      let apiUrl = apiUrlParam;
      if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
        apiUrl = 'https://' + apiUrl;
      }
      
      app.apiUrl = apiUrl;
      app.apiKey = apiKeyParam;
      app.appTitle = urlParams.get('app_title') || 'Change Management';
      app.changeTypes = [
        "Standard Change", 
        "Emergency Change", 
        "Non-Standard Change"
      ];
      
      // Set up API endpoints
      app.endpoints = {
        users: `${app.apiUrl}/api/v2/agents`,
        requesters: `${app.apiUrl}/api/v2/requesters`,
        groups: `${app.apiUrl}/api/v2/groups`
      };
      
      console.log('API endpoints configured from URL parameters:', app.endpoints);
      
      // Save working config to storage for persistence
      saveConfigToStorage(client, {
        apiUrl: app.apiUrl,
        apiKey: app.apiKey,
        appTitle: app.appTitle,
        changeTypes: app.changeTypes
      });
      
      updateAppTitle(app.appTitle);
      return;
    }
    
    function loadFromIparams() {
      console.log('Loading from client.iparams.get()');
      
      // Add safety check for client.iparams
      if (!client || !client.iparams || typeof client.iparams.get !== 'function') {
        console.warn('client.iparams.get not available, skipping');
        return Promise.resolve(false);
      }
      
      return client.iparams.get().then(params => {
        if (params && params.api_url) {
          console.log('Using configuration from iparams');
          
          // Process API URL to ensure it has proper format
          let apiUrl = params.api_url;
          if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
            apiUrl = 'https://' + apiUrl;
          }
          
          // Verify it's not using the example domain
          if (apiUrl.includes('example.freshservice.com')) {
            console.warn('Found example domain in iparams, will check storage instead');
            return false;
          }
          
          app.apiUrl = apiUrl;
          app.apiKey = params.api_key;
          app.appTitle = params.app_title || 'Change Management';
          app.changeTypes = params.change_types || [
            "Standard Change", 
            "Emergency Change", 
            "Non-Standard Change"
          ];
          
          // Set up API endpoints
          app.endpoints = {
            users: `${app.apiUrl}/api/v2/agents`,
            requesters: `${app.apiUrl}/api/v2/requesters`,
            groups: `${app.apiUrl}/api/v2/groups`
          };
          
          console.log('API endpoints configured from iparams:', app.endpoints);
            
          // Save working config to storage for persistence
          saveConfigToStorage(client, {
            apiUrl: app.apiUrl,
            apiKey: app.apiKey,
            appTitle: app.appTitle,
            changeTypes: app.changeTypes
          });
          
          updateAppTitle(app.appTitle);
          return true;
        }
        return false;
      }).catch(err => {
        console.error('Error loading from iparams:', err);
        return false;
      });
    }
    
    function loadFromStorage() {
      console.log('Loading from client.db storage');
      return client.db.get('app_config')
        .then(config => {
          if (config && config.apiUrl) {
            console.log('Using configuration from data storage');
            
            // Process API URL to ensure it has proper format
            let apiUrl = config.apiUrl;
            if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
              apiUrl = 'https://' + apiUrl;
            }
            
            // Verify it's not using the example domain
            if (apiUrl.includes('example.freshservice.com')) {
              console.warn('Found example domain in storage, will use defaults');
              return false;
            }
            
            app.apiUrl = apiUrl;
            app.apiKey = config.apiKey;
            app.appTitle = config.appTitle || 'Change Management';
            app.changeTypes = config.changeTypes || [
              "Standard Change", 
              "Emergency Change", 
              "Non-Standard Change"
            ];
            
            // Set up API endpoints
            app.endpoints = {
              users: `${app.apiUrl}/api/v2/agents`,
              requesters: `${app.apiUrl}/api/v2/requesters`,
              groups: `${app.apiUrl}/api/v2/groups`
            };
            
            console.log('API endpoints configured from storage:', app.endpoints);
            updateAppTitle(app.appTitle);
            return true;
          }
          return false;
        })
        .catch(err => {
          console.error('Error loading from storage:', err);
          return false;
        });
    }
    
    // Try to load from localStorage as a fallback for migration
    function loadFromLocalStorage() {
      console.log('Trying to load from localStorage as last resort');
      try {
        const savedData = localStorage.getItem('freshservice_change_management_iparams');
        if (savedData) {
          const config = JSON.parse(savedData);
          
          if (config && config.api_url && !config.api_url.includes('example.freshservice.com')) {
            console.log('Using configuration from localStorage');
            
            // Process API URL to ensure it has proper format
            let apiUrl = config.api_url;
            if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
              apiUrl = 'https://' + apiUrl;
            }
            
            app.apiUrl = apiUrl;
            app.apiKey = config.api_key;
            app.appTitle = config.app_title || 'Change Management';
            app.changeTypes = config.change_types || [
              "Standard Change", 
              "Emergency Change", 
              "Non-Standard Change"
            ];
            
            // Set up API endpoints
            app.endpoints = {
              users: `${app.apiUrl}/api/v2/agents`,
              requesters: `${app.apiUrl}/api/v2/requesters`,
              groups: `${app.apiUrl}/api/v2/groups`
            };
            
            console.log('API endpoints configured from localStorage:', app.endpoints);
            
            // Migrate to client.db
            saveConfigToStorage(client, {
              apiUrl: app.apiUrl,
              apiKey: app.apiKey,
              appTitle: app.appTitle,
              changeTypes: app.changeTypes
            });
            
            updateAppTitle(app.appTitle);
            return true;
          }
        }
      } catch (e) {
        console.error('Error reading from localStorage:', e);
      }
      return false;
    }
    
    // First try to load from iparams (app settings)
    loadFromIparams()
      .then(found => {
        if (!found) {
          // Try to load from data storage if not found in iparams
          return loadFromStorage();
        }
        return found;
      })
      .then(found => {
        if (!found) {
          // Try localStorage as last resort
          return loadFromLocalStorage();
        }
        return found;
      })
      .then(found => {
        if (!found) {
          // Don't use example domain as default anymore
          console.warn('No valid configuration found, prompting for configuration');
          app.apiUrl = ''; // Empty string instead of example domain
          app.apiKey = '';
          app.appTitle = 'Change Management';
          app.changeTypes = [
            "Standard Change", 
            "Emergency Change", 
            "Non-Standard Change"
          ];
          
          // Show a more prominent configuration prompt
          const configPrompt = `
            <div class="alert alert-warning mt-2 mb-2">
              <h4>Configuration Required</h4>
              <p>Please configure your Freshservice domain and API key using one of the following methods:</p>
              <ol>
                <li>Add URL parameters: <code>?api_url=yourdomain.freshservice.com&api_key=your_api_key</code></li>
                <li>Install the app properly through Freshservice Admin interface</li>
              </ol>
              <div class="input-group mt-3">
                <div class="input-group-prepend">
                  <span class="input-group-text">Domain</span>
                </div>
                <input type="text" id="configApiUrl" class="form-control" placeholder="yourdomain.freshservice.com">
              </div>
              <div class="input-group mt-2">
                <div class="input-group-prepend">
                  <span class="input-group-text">API Key</span>
                </div>
                <input type="text" id="configApiKey" class="form-control" placeholder="Your Freshservice API key">
              </div>
              <div class="mt-2">
                <button id="saveConfigBtn" class="btn btn-primary">Save Configuration</button>
                <button id="testConnectionBtn" class="btn btn-outline-info ml-2">Test Connection</button>
              </div>
            </div>
          `;
          
          // Add to page
          const container = document.querySelector('.container');
          if (container) {
            // Create element for the prompt
            const promptElement = document.createElement('div');
            promptElement.innerHTML = configPrompt;
            container.insertBefore(promptElement, container.firstChild);
            
                          // Add event listeners to the buttons
              setTimeout(() => {
                // Add test connection button handler
                const testConnectionBtn = document.getElementById('testConnectionBtn');
                if (testConnectionBtn) {
                  testConnectionBtn.addEventListener('click', function() {
                    const apiUrlInput = document.getElementById('configApiUrl');
                    const apiKeyInput = document.getElementById('configApiKey');
                    
                    if (apiUrlInput && apiKeyInput) {
                      const apiUrl = apiUrlInput.value.trim();
                      const apiKey = apiKeyInput.value.trim();
                      
                      if (apiUrl && apiKey) {
                        // Show testing status
                        testConnectionBtn.disabled = true;
                        testConnectionBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Testing...';
                        
                        // Process API URL to ensure it has proper format
                        let fullApiUrl = apiUrl;
                        if (!fullApiUrl.startsWith('http://') && !fullApiUrl.startsWith('https://')) {
                          fullApiUrl = 'https://' + fullApiUrl;
                        }
                        
                        // Temporarily set the app configuration
                        const origApiUrl = app.apiUrl;
                        const origApiKey = app.apiKey;
                        
                        app.apiUrl = fullApiUrl;
                        app.apiKey = apiKey;
                        
                        // Test the connection
                        testApiCredentials()
                          .then(data => {
                            // Success - show confirmation
                            const successMsg = document.createElement('div');
                            successMsg.className = 'alert alert-success mt-2';
                            
                            if (data && data.agents && data.agents.length > 0) {
                              const agentName = `${data.agents[0].first_name} ${data.agents[0].last_name}`;
                              successMsg.innerHTML = `Connection successful! Found agent: ${agentName}`;
                            } else {
                              successMsg.innerHTML = 'Connection successful! API credentials are valid.';
                            }
                            
                            // Remove any existing messages
                            const existingMessages = container.querySelectorAll('.alert');
                            existingMessages.forEach(el => {
                              if (el.textContent.includes('Connection successful') || el.textContent.includes('Connection failed')) {
                                el.remove();
                              }
                            });
                            
                            container.insertBefore(successMsg, promptElement.nextSibling);
                          })
                          .catch(error => {
                            // Error - show warning
                            const errorMsg = document.createElement('div');
                            errorMsg.className = 'alert alert-danger mt-2';
                            errorMsg.innerHTML = `Connection failed: ${error.message}`;
                            
                            // Remove any existing messages
                            const existingMessages = container.querySelectorAll('.alert');
                            existingMessages.forEach(el => {
                              if (el.textContent.includes('Connection successful') || el.textContent.includes('Connection failed')) {
                                el.remove();
                              }
                            });
                            
                            container.insertBefore(errorMsg, promptElement.nextSibling);
                          })
                          .finally(() => {
                            // Reset the app configuration
                            app.apiUrl = origApiUrl;
                            app.apiKey = origApiKey;
                            
                            // Reset button
                            testConnectionBtn.disabled = false;
                            testConnectionBtn.innerHTML = 'Test Connection';
                          });
                      } else {
                        // Show error for missing fields
                        const errorMsg = document.createElement('div');
                        errorMsg.className = 'alert alert-danger mt-2';
                        errorMsg.innerHTML = 'Please enter both domain and API key to test connection';
                        
                        // Remove any existing error messages
                        const existingErrors = container.querySelectorAll('.alert-danger');
                        existingErrors.forEach(el => {
                          if (el.textContent.includes('Please enter both')) {
                            el.remove();
                          }
                        });
                        
                        container.insertBefore(errorMsg, promptElement.nextSibling);
                      }
                    }
                  });
                }
                
                // Add save button handler
                const saveBtn = document.getElementById('saveConfigBtn');
                if (saveBtn) {
                  saveBtn.addEventListener('click', function() {
                    const apiUrlInput = document.getElementById('configApiUrl');
                    const apiKeyInput = document.getElementById('configApiKey');
                  
                  if (apiUrlInput && apiKeyInput) {
                    const apiUrl = apiUrlInput.value.trim();
                    const apiKey = apiKeyInput.value.trim();
                    
                    if (apiUrl && apiKey) {
                      // Process API URL to ensure it has proper format
                      let fullApiUrl = apiUrl;
                      if (!fullApiUrl.startsWith('http://') && !fullApiUrl.startsWith('https://')) {
                        fullApiUrl = 'https://' + fullApiUrl;
                      }
                      
                      // Update app configuration
                      app.apiUrl = fullApiUrl;
                      app.apiKey = apiKey;
                      
                      // Set up API endpoints
                      app.endpoints = {
                        users: `${app.apiUrl}/api/v2/agents`,
                        requesters: `${app.apiUrl}/api/v2/requesters`,
                        groups: `${app.apiUrl}/api/v2/groups`
                      };
                      
                      // Save to storage
                      saveConfigToStorage(client, {
                        apiUrl: app.apiUrl,
                        apiKey: app.apiKey,
                        appTitle: app.appTitle,
                        changeTypes: app.changeTypes
                      });
                      
                      // Show success message
                      const successMsg = document.createElement('div');
                      successMsg.className = 'alert alert-success';
                      successMsg.innerHTML = 'Configuration saved successfully. Reloading...';
                      container.insertBefore(successMsg, container.firstChild);
                      
                      // Reload the page after a short delay
                      setTimeout(function() {
                        location.reload();
                      }, 1500);
                    } else {
                      // Show error for missing fields
                      const errorMsg = document.createElement('div');
                      errorMsg.className = 'alert alert-danger mt-2';
                      errorMsg.innerHTML = 'Please enter both domain and API key';
                      
                      // Remove any existing error messages
                      const existingErrors = container.querySelectorAll('.alert-danger');
                      existingErrors.forEach(el => {
                        if (el.textContent.includes('Please enter both')) {
                          el.remove();
                        }
                      });
                      
                      // Add the new error message
                      container.insertBefore(errorMsg, promptElement.nextSibling);
                    }
                  }
                });
              }
            }, 500);
          }
          
          updateAppTitle(app.appTitle);
        }
      });
  }
  
  function saveConfigToStorage(client, config) {
    console.log('Saving config to data storage');
    if (client && client.db) {
      client.db.set('app_config', config)
        .then(() => console.log('Config saved to data storage'))
        .catch(err => console.error('Error saving config to data storage:', err));
    }
  }
  
  // Setup event listeners for the app
  function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Search button click event
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
      console.log('Search button found, adding click event');
      searchButton.addEventListener('click', function() {
        console.log('Search button clicked');
        performSearch();
      });
    } else {
      console.error('Search button not found in the DOM');
    }
    
    // Enter key press in search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      console.log('Search input found, adding keypress event');
      searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          console.log('Enter key pressed in search input');
          performSearch();
        }
      });
      
      // Add saved searches dropdown
      addSavedSearchesDropdown(searchInput);
    } else {
      console.error('Search input not found in the DOM');
    }
    
    // Tab switching
    const tabs = document.querySelectorAll('.nav-link');
    if (tabs.length > 0) {
      console.log('Nav tabs found, adding click events');
      tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
          e.preventDefault();
          console.log('Tab clicked:', this.id);
          
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
    } else {
      console.error('Nav tabs not found in the DOM');
    }
    
    console.log('Event listeners setup complete');
  }
  
  // Add saved searches dropdown next to search input
  function addSavedSearchesDropdown(searchInput) {
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
    loadSavedSearches();
    
    // Add event listener for save button
    document.addEventListener('click', function(e) {
      if (e.target && e.target.id === 'saveCurrentSearchBtn') {
        saveCurrentSearch();
      }
    });
  }
  
  // Load saved searches from localStorage
  function loadSavedSearches() {
    setTimeout(() => {
      const savedSearchesMenu = document.getElementById('savedSearchesMenu');
      const noSavedSearchesMsg = document.getElementById('noSavedSearchesMsg');
      
      if (!savedSearchesMenu) return;
      
      try {
        // Get saved searches from localStorage
        const savedSearches = JSON.parse(localStorage.getItem('freshservice_saved_searches') || '[]');
        
        // Remove existing search items (except the last two items - divider and save button)
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
                performSearch();
              }
            });
            
            // Add delete button for each search
            item.innerHTML = `
              <div class="d-flex justify-content-between align-items-center">
                <span>${escapeHtml(search.query)}</span>
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
            btn.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation(); // Prevent triggering parent click
              
              const index = parseInt(this.getAttribute('data-index'), 10);
              deleteSavedSearch(index);
            });
          });
        }
      } catch (error) {
        console.error('Error loading saved searches:', error);
      }
    }, 500); // Short delay to ensure DOM is ready
  }
  
  // Save current search query
  function saveCurrentSearch() {
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
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = '#28a745';
        notification.style.color = 'white';
        notification.style.padding = '10px 15px';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '9999';
        notification.textContent = 'Search saved!';
        
        document.body.appendChild(notification);
        
        // Auto-remove after 2 seconds
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 2000);
        
        // Reload the dropdown
        loadSavedSearches();
      }
    } catch (error) {
      console.error('Error saving search:', error);
    }
  }
  
  // Delete a saved search by index
  function deleteSavedSearch(index) {
    try {
      // Get existing saved searches
      const savedSearches = JSON.parse(localStorage.getItem('freshservice_saved_searches') || '[]');
      
      // Remove the search at the specified index
      if (index >= 0 && index < savedSearches.length) {
        savedSearches.splice(index, 1);
        
        // Save updated list to localStorage
        localStorage.setItem('freshservice_saved_searches', JSON.stringify(savedSearches));
        
        // Reload the dropdown
        loadSavedSearches();
      }
    } catch (error) {
      console.error('Error deleting saved search:', error);
    }
  }
  
  // Determine if search term is an advanced query or a simple search
  function isAdvancedQuery(searchTerm) {
    // Check for common advanced query patterns
    return (
      searchTerm.includes(':') || // Field specification
      searchTerm.includes('AND ') || 
      searchTerm.includes(' AND') || 
      searchTerm.includes('OR ') || 
      searchTerm.includes(' OR') || 
      searchTerm.includes('(') || // Parentheses for grouping
      searchTerm.includes(')') ||
      searchTerm.includes('~[') || // Prefix search
      searchTerm.includes('<') || // Less than
      searchTerm.includes('>') || // Greater than
      searchTerm.includes('!=')   // Not equal
    );
  }
  
  // Perform search based on input
  function performSearch() {
    console.log('performSearch() called');
    
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) {
      console.error('Search input element not found');
      return showError('Search input element not found');
    }
    
    const searchTerm = searchInput.value.trim();
    console.log('Search term:', searchTerm);
    
    if (!searchTerm) {
      console.warn('Empty search term');
      return showError('Please enter a search term');
    }
    
    // Check if API URL and key are configured
    if (!app.apiUrl || !app.apiKey) {
      console.error('API configuration missing', { apiUrl: app.apiUrl, apiKeyExists: !!app.apiKey });
      
      // Show a more helpful error message with configuration instructions
      const errorMessage = `
        <strong>API Configuration Missing</strong>
        <p>Please configure the app using one of these methods:</p>
        <ol>
          <li>Add URL parameters: <code>?api_url=yourdomain.freshservice.com&api_key=your_api_key</code></li>
          <li>Use the Reset button to clear configuration and set it up again</li>
          <li>Install the app properly through Freshservice Admin interface</li>
        </ol>
      `;
      return showError(errorMessage);
    }
    
    // Validate API URL format
    if (!app.apiUrl.includes('.freshservice.com')) {
      console.error('Invalid API URL format:', app.apiUrl);
      return showError(`Invalid API URL format: ${app.apiUrl}<br>URL must include .freshservice.com domain`);
    }
    
    // Show loading spinner
    toggleSpinner(true);
    
    // Get active tab
    const activeTab = document.querySelector('.nav-link.active');
    if (!activeTab) {
      console.error('No active tab found');
      toggleSpinner(false);
      return showError('No active tab found');
    }
    
    const searchType = activeTab.id === 'users-tab' ? 'users' : 'requesters';
    console.log('Search type:', searchType);
    
    // Clear previous results
    const resultsContainer = document.getElementById(`${searchType}Results`);
    if (resultsContainer) {
      resultsContainer.innerHTML = '';
      
      // Add search status message
      const statusMsg = document.createElement('div');
      statusMsg.className = 'alert alert-info mt-2';
      statusMsg.id = 'searchStatus';
      
      // Check if this is an advanced query
      const isAdvanced = isAdvancedQuery(searchTerm);
      
      // Format the status message based on query type
      if (isAdvanced) {
        statusMsg.innerHTML = `
          Executing advanced query for ${searchType}:<br>
          <code class="text-dark bg-light p-1">${escapeHtml(searchTerm)}</code>
        `;
      } else {
        statusMsg.innerHTML = `Searching for ${searchType} matching: <strong>${escapeHtml(searchTerm)}</strong>...`;
      }
      
      resultsContainer.appendChild(statusMsg);
      
    } else {
      console.error(`Results container '${searchType}Results' not found`);
      toggleSpinner(false);
      return showError('Results container not found');
    }
    
    // Prepare the search query
    let queryString;
    
    // Check if this is an advanced query
    if (isAdvancedQuery(searchTerm)) {
      // Use the search term directly as the query parameter
      console.log('Using advanced query:', searchTerm);
      queryString = searchTerm;
    } else {
      // Use the prefix search syntax for first_name, last_name, or email
      console.log('Using prefix search across multiple fields');
      queryString = `~[first_name|last_name|email]:'${searchTerm}'`;
    }
    
    // Perform search based on active tab with the query
    const searchPromise = searchType === 'users' ? 
      searchUsers(queryString) : 
      searchRequesters(queryString);
    
    // Add a timeout to detect long-running searches
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        // Check if the spinner is still visible after 10 seconds
        if (!document.getElementById('spinnerOverlay').classList.contains('d-none')) {
          console.log('Search taking longer than expected, updating status message');
          const statusMsg = document.getElementById('searchStatus');
          if (statusMsg) {
            statusMsg.innerHTML = `
              Still searching... <br>
              <small class="text-muted">If this takes too long, check your API configuration or network connection.</small>
              <small class="text-muted d-block mt-1">Complex queries may take longer to complete.</small>
            `;
          }
        }
      }, 10000); // 10 seconds timeout
      
      // This resolve doesn't affect the actual search
      resolve();
    });
    
    // Run both promises (the actual search and the timeout checker)
    Promise.all([searchPromise, timeoutPromise])
      .catch(error => {
        console.error('Error in search operation:', error);
      });
  }
  
  // Helper function to escape HTML
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  // Search for users via Freshservice API
  function searchUsers(query) {
    return new Promise((resolve, reject) => {
      // Check if API URL and key are available
      if (!app.apiUrl || !app.apiKey) {
        console.error('API URL or API Key not configured');
        showError('API configuration missing. Please check your settings.');
        toggleSpinner(false);
        return reject(new Error('API configuration missing'));
      }
      
      // Show loading spinner
      toggleSpinner(true);
      
      try {
        // Restore the original working query format for agents
        const queryString = `~[first_name|last_name|email]:'${query}'`;
        const encodedQuery = encodeURIComponent(queryString);
        const apiPath = `/api/v2/agents?query="${encodedQuery}"`;
        
        // Ensure we're using the full URL
        const fullApiUrl = app.apiUrl + apiPath;
        console.log('Request URL:', fullApiUrl);
        
        // Use client.request instead of fetch
        if (window.client && window.client.request) {
          // Create an object to track if the request has been aborted
          const abortInfo = { isAborted: false };
          
          // Create the request promise - pass the full path or just the API path depending on how client.request works
          const requestPromise = window.client.request.get(apiPath, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          })
          .then(response => {
            // Skip processing if the request was aborted
            if (abortInfo.isAborted) {
              console.log('Request was aborted');
              return { agents: [] };
            }
            
            // Parse the response JSON
            const data = JSON.parse(response.response);
            return data;
          })
          .then(data => {
            console.log('API response:', data);
            
            if (data && data.agents && Array.isArray(data.agents)) {
              console.log(`Found ${data.agents.length} agents matching the query`);
              // Call the globally defined renderResults function to display in the UI
              app.renderResults('users', data.agents);
              resolve(data.agents);
            } else {
              console.warn('Response contained no agents array:', data);
              // Check if data is in a different format
              if (data && Array.isArray(data)) {
                console.log('Data appears to be an array directly, using as agents');
                app.renderResults('users', data);
                resolve(data);
              } else {
                app.renderResults('users', []);
                resolve([]);
              }
            }
          })
          .catch(error => {
            // Skip rendering if the request was aborted
            if (abortInfo.isAborted) {
              console.log('Request was aborted');
              return resolve([]);
            }
            
            console.error('API request failed:', error);
            
            let errorMessage = 'API request failed';
            if (error.status) {
              errorMessage += ` (Status: ${error.status})`;
            }
            if (error.message) {
              errorMessage += `: ${error.message}`;
            }
            
            showError(errorMessage);
            app.renderResults('users', []);
            resolve([]);
          })
          .finally(function() {
            toggleSpinner(false);
          });
          
          // Add an abort method to the promise
          requestPromise.abort = () => {
            abortInfo.isAborted = true;
            // Note: client.request doesn't support aborting directly, 
            // but we can prevent the handlers from processing the response
          };
          
          return requestPromise;
        } else {
          // Fallback to fetch if client.request is not available
          const authToken = btoa(app.apiKey + ':X');
          console.log('Auth token created (first 10 chars):', authToken.substring(0, 10) + '...');
          
          // Always use the full URL for direct fetch
          const apiUrl = fullApiUrl;
          console.log('Using direct fetch with URL:', apiUrl);
          
          // Create an AbortController to handle request cancellation
          const controller = new AbortController();
          const signal = controller.signal;
          
          // Attach the abort controller to the promise for external cancellation
          const fetchPromise = fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Authorization': 'Basic ' + authToken,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            signal: signal
          });
          
          // Add abort method to the promise
          fetchPromise.abort = () => controller.abort();
          
          // Return the fetch promise
          fetchPromise
            .then(response => {
              if (!response.ok) {
                const error = new Error(`API request failed: ${response.status} ${response.statusText}`);
                error.status = response.status;
                throw error;
              }
              return response.json();
            })
            .then(data => {
              console.log('API response:', data);
              
              if (data && data.agents && Array.isArray(data.agents)) {
                console.log(`Found ${data.agents.length} agents matching the query`);
                // Call the globally defined renderResults function to display in the UI
                app.renderResults('users', data.agents);
                resolve(data.agents);
              } else {
                console.warn('Response contained no agents array:', data);
                // Check if data is in a different format
                if (data && Array.isArray(data)) {
                  console.log('Data appears to be an array directly, using as agents');
                  app.renderResults('users', data);
                  resolve(data);
                } else {
                  app.renderResults('users', []);
                  resolve([]);
                }
              }
            })
            .catch(error => {
              // Skip rendering if the request was aborted
              if (error.name === 'AbortError') {
                console.log('Request was aborted');
                return resolve([]);
              }
              
              console.error('API request failed:', error);
              
              let errorMessage = 'API request failed';
              if (error.status) {
                errorMessage += ` (Status: ${error.status})`;
              }
              if (error.message) {
                errorMessage += `: ${error.message}`;
              }
              
              showError(errorMessage);
              app.renderResults('users', []);
              resolve([]);
            })
            .finally(function() {
              toggleSpinner(false);
            });
          
          // Return the fetch promise for external control
          return fetchPromise;
        }
      } catch (error) {
        console.error('Error in search:', error);
        showError(`Error making API request: ${error.message}`);
        app.renderResults('users', []);
        toggleSpinner(false);
        return reject(error);
      }
    });
  }
  
  // Search for requesters via Freshservice API
  function searchRequesters(query) {
    return new Promise((resolve, reject) => {
      if (!app.apiUrl || !app.apiKey) {
        console.error('API URL or API Key not configured');
        showError('API configuration missing. Please check your settings.');
        toggleSpinner(false);
        return reject(new Error('API configuration missing'));
      }
      
      console.log('Searching requesters with query:', query);
      
      // Show loading spinner
      toggleSpinner(true);
      
      try {
        // For requesters, use a simple query parameter (not the complex syntax)
        let apiPath;
        
        if (query.includes('@')) {
          // Email search
          const encodedEmail = encodeURIComponent(query);
          apiPath = `/api/v2/requesters?email=${encodedEmail}`;
        } else {
          // Name search - simple format
          const encodedQuery = encodeURIComponent(query);
          apiPath = `/api/v2/requesters?query=${encodedQuery}`;
        }
        
        // Full API URL for logging
        const fullApiUrl = app.apiUrl + apiPath;
        console.log('Requester search URL:', fullApiUrl);
        
        // Create auth token for direct fetch
        const authToken = btoa(app.apiKey + ':X');
        
        // Make direct fetch request to ensure correct URL
        fetch(fullApiUrl, {
          method: 'GET',
          headers: {
            'Authorization': 'Basic ' + authToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
        .then(response => {
          if (!response.ok) {
            // Log error details
            console.error(`Requester search error: ${response.status} ${response.statusText}`);
            
            // Try to get more error details
            response.text().then(text => {
              try {
                const errorData = JSON.parse(text);
                console.error('Error details:', errorData);
              } catch(e) {
                console.error('Error response (not JSON):', text);
              }
            }).catch(e => {/* ignore read errors */});
            
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('Requester search response:', data);
          
          // Process results
          let requesters = [];
          if (data && data.requesters && Array.isArray(data.requesters)) {
            requesters = data.requesters;
            console.log(`Found ${requesters.length} requesters matching '${query}'`);
          } else if (data && Array.isArray(data)) {
            requesters = data;
            console.log(`Found ${requesters.length} requesters (array format) matching '${query}'`);
          }
          
          // Render to UI
          app.renderResults('requesters', requesters);
          resolve(requesters);
        })
        .catch(error => {
          console.error('Requester search failed:', error);
          showError(`Error searching requesters: ${error.message}`);
          app.renderResults('requesters', []);
          resolve([]);
        })
        .finally(() => {
          toggleSpinner(false);
        });
      } catch (error) {
        console.error('Error in requester search:', error);
        showError(`Error in requester search: ${error.message}`);
        app.renderResults('requesters', []);
        toggleSpinner(false);
        resolve([]);
      }
    });
  }
  
  // Integration with change-form.js
  function integrateWithChangeForm() {
    console.log('Setting up integration with change-form.js');
    
    // Export our search functions to the app object for change-form.js to access
    if (!window.app) {
      window.app = {};
    }
    
    // Make the searchUsers and searchRequesters functions available on the app object
    window.app.searchUsers = searchUsers;
    window.app.searchRequesters = searchRequesters;
    
    // Also make our local render function available if needed
    window.app.renderResults = renderResults;
    
    // Test the API connection on startup
    setTimeout(() => {
      if (app.apiUrl && app.apiKey) {
        console.log('Testing API connection to:', app.apiUrl);
        testApiCredentials()
          .then(result => {
            console.log('API connection test successful:', result);
          })
          .catch(error => {
            console.error('API connection test failed:', error);
            showWarning(`API connection test failed: ${error.message || 'Unknown error'}. Please check your configuration.`);
          });
      }
    }, 2000);
  }
  
  // Test API credentials by making a simple request
  function testApiCredentials() {
    return new Promise((resolve, reject) => {
      if (!app.apiUrl || !app.apiKey) {
        return reject(new Error('API URL or API Key not configured'));
      }
      
      // Use a simple request to test - just get the first agent
      const apiPath = '/api/v2/agents?per_page=1';
      const fullApiUrl = app.apiUrl + apiPath;
      
      console.log('Testing API credentials with URL:', fullApiUrl);
      
      // Create auth token
      const authToken = btoa(app.apiKey + ':X');
      
      // Make direct fetch request to ensure we're using the correct URL
      fetch(fullApiUrl, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + authToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        resolve(data);
      })
      .catch(error => {
        console.error('API test failed:', error);
        reject(error);
      });
    });
  }
  
  // Update the application title displayed on the page
  function updateAppTitle(title) {
    const titleElement = document.getElementById('appTitle');
    if (titleElement) {
      // Make sure we don't use null/undefined title, use configured default or fallback
      const displayTitle = title || app.appTitle || 'Change Management';
      titleElement.textContent = displayTitle;
      console.log('Application title updated to:', displayTitle);
    } else {
      console.error('Title element not found in the DOM');
    }
  }
  
  // Show error message in the UI
  function showError(message, error) {
    console.error("Error:", message, error || '');
    
    // Hide spinner if visible
    toggleSpinner(false);
    
    // Try to use the notification system from change-form.js if available
    if (typeof showNotification === 'function') {
      return showNotification(message, 'danger');
    }
    
    // Fallback to creating our own error message
    const container = document.querySelector('.container');
    if (!container) return;
    
    const errorElement = document.createElement('div');
    errorElement.className = 'alert alert-danger alert-dismissible fade show';
    errorElement.setAttribute('role', 'alert');
    errorElement.innerHTML = `
      ${message}
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    `;
    
    // Add to page
    container.insertBefore(errorElement, container.firstChild);
    
    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      if (errorElement.parentNode) {
        errorElement.classList.remove('show');
        setTimeout(() => {
          if (errorElement.parentNode) {
            errorElement.parentNode.removeChild(errorElement);
          }
        }, 150);
      }
    }, 8000);
  }
})();
