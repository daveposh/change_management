/**
 * User Search App for Freshservice
 * 
 * Allows searching users and requesters by name or email
 * using the Freshservice API v2
 */

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

// Ensure spinner is hidden after a timeout (failsafe)
function setupSpinnerTimeout() {
  // Force hide spinner after 8 seconds in case initialization hangs
  setTimeout(function() {
    const spinner = document.getElementById('spinnerOverlay');
    if (spinner && !spinner.classList.contains('d-none')) {
      console.warn('Spinner timeout reached - forcing spinner to hide');
      toggleSpinner(false);
    }
  }, 8000);
}

// Fix for local development environment
(function() {
  // Check if we're in a local development environment
  const isLocalDev = window.location.href.includes('localhost') || 
    window.location.hostname.includes('127.0.0.1');
  
  // Separate check for dev mode without enabling example domains
  const isDevMode = window.location.href.includes('dev=true');
  
  if (isLocalDev || isDevMode) {
    console.log("Development environment detected - applying protocol fixes");
    
    // Fix AJAX requests to convert https://localhost to http://localhost
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      if (typeof url === 'string' && (url.startsWith('https://localhost') || url.includes('://localhost:'))) {
        console.log('Converting HTTPS to HTTP for localhost URL:', url);
        url = url.replace(/^(https?:\/\/)localhost/, 'http://localhost');
      }
      return originalFetch.call(this, url, options);
    };
    
    // Fix XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
      if (typeof url === 'string' && (url.startsWith('https://localhost') || url.includes('://localhost:'))) {
        console.log('Converting HTTPS to HTTP for localhost URL in XHR:', url);
        url = url.replace(/^(https?:\/\/)localhost/, 'http://localhost');
      }
      return originalOpen.call(this, method, url, async, user, password);
    };
    
    // Fix for resource loading (images, scripts, etc.)
    if (document.addEventListener) {
      document.addEventListener('DOMContentLoaded', function() {
        console.log('Adding fix for resource loading in development mode');
        // Replace any HTTPS localhost URLs in link, script, and img tags
        const elements = document.querySelectorAll('link, script, img');
        elements.forEach(function(el) {
          const src = el.src || el.href;
          if (src && typeof src === 'string' && (src.startsWith('https://localhost') || src.includes('://localhost:'))) {
            console.log('Converting resource URL from HTTPS to HTTP:', src);
            const newSrc = src.replace(/^(https?:\/\/)localhost/, 'http://localhost');
            if (el.src) el.src = newSrc;
            if (el.href) el.href = newSrc;
          }
        });
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
      performSearch
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
          console.log('Dev client: Making real API call to:', url);
          
          // Check if URL is using example.freshservice.com
          if (url.includes('example.freshservice.com')) {
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
          return fetch(url, {
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
    
    // Show the loading indicator
    toggleSpinner(true);
    
    // Set up spinner timeout as a failsafe
    setupSpinnerTimeout();
    
    // Create a safety net if client is not defined yet
    if (typeof client === 'undefined') {
      console.warn('Client object not available, creating fallback client');
      window.client = createDevClient();
    }
    
    // Attempt to get client from the Freshworks SDK
    try {
      client.initialized()
        .then(function() {
          console.log('Freshworks Client initialized');
          onClientReady(client);
        })
        .catch(function(error) {
          console.error('Failed to initialize Freshworks client:', error);
          // Fall back to direct initialization without the client
          initializeFallback();
        });
    } catch (error) {
      console.error('Error initializing client:', error);
      initializeFallback();
      // Hide spinner on error
      toggleSpinner(false);
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
    
    // Ensure spinner is hidden
    toggleSpinner(false);
  }
  
  function onClientReady(client) {
    // Ensure we only initialize once
    if (window.app && window.app.initialized) {
      console.log('App already initialized, skipping initialization');
      toggleSpinner(false);
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
        
        // Hide spinner once initialization is done
        toggleSpinner(false);
      })
      .catch(error => {
        console.error('Error during initialization:', error);
        // Hide spinner on error
        toggleSpinner(false);
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
      // Hide spinner after configuration is loaded
      toggleSpinner(false);
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
          
          // Ensure config prompt is properly displayed
          showConfigurationPrompt();
          // Ensure spinner is hidden when showing config form
          toggleSpinner(false);
        } else {
          // Configuration loaded successfully
          toggleSpinner(false);
        }
      })
      .catch(error => {
        console.error('Error loading configuration:', error);
        // Show configuration prompt on error
        showConfigurationPrompt();
        // Ensure spinner is hidden
        toggleSpinner(false);
      });
  }
  
  // Helper function to show configuration prompt
  function showConfigurationPrompt() {
    console.log('Showing configuration prompt');
    
    // Create a more prominent configuration prompt
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
      // Check if configuration prompt already exists
      if (!document.querySelector('.alert.alert-warning h4')) {
        // Create element for the prompt
        const promptElement = document.createElement('div');
        promptElement.innerHTML = configPrompt;
        container.insertBefore(promptElement, container.firstChild);
        
        // Add event listeners to the buttons after a short delay
        setTimeout(setupConfigButtonListeners, 500);
      }
    }
  }
  
  // Setup event listeners for configuration form buttons
  function setupConfigButtonListeners() {
    const container = document.querySelector('.container');
    if (!container) return;
    
    // Add test connection button handler
    const testConnectionBtn = document.getElementById('testConnectionBtn');
    if (testConnectionBtn) {
      testConnectionBtn.addEventListener('click', testConnectionHandler);
    }
    
    // Add save button handler
    const saveBtn = document.getElementById('saveConfigBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', saveConfigHandler);
    }
  }
  
  // Handler for test connection button
  function testConnectionHandler() {
    const container = document.querySelector('.container');
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
            const existingMessages = container.querySelectorAll('.alert-success, .alert-danger');
            existingMessages.forEach(el => {
              if (el.textContent.includes('Connection successful') || el.textContent.includes('Connection failed')) {
                el.remove();
              }
            });
            
            // Find the configuration prompt
            const promptElement = container.querySelector('.alert.alert-warning');
            if (promptElement) {
              container.insertBefore(successMsg, promptElement.nextSibling);
            } else {
              container.insertBefore(successMsg, container.firstChild);
            }
          })
          .catch(error => {
            // Error - show warning
            const errorMsg = document.createElement('div');
            errorMsg.className = 'alert alert-danger mt-2';
            errorMsg.innerHTML = `Connection failed: ${error.message || 'Unknown error'}`;
            
            // Remove any existing messages
            const existingMessages = container.querySelectorAll('.alert-success, .alert-danger');
            existingMessages.forEach(el => {
              if (el.textContent.includes('Connection successful') || el.textContent.includes('Connection failed')) {
                el.remove();
              }
            });
            
            // Find the configuration prompt
            const promptElement = container.querySelector('.alert.alert-warning');
            if (promptElement) {
              container.insertBefore(errorMsg, promptElement.nextSibling);
            } else {
              container.insertBefore(errorMsg, container.firstChild);
            }
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
        
        // Find the configuration prompt
        const promptElement = container.querySelector('.alert.alert-warning');
        if (promptElement) {
          container.insertBefore(errorMsg, promptElement.nextSibling);
        } else {
          container.insertBefore(errorMsg, container.firstChild);
        }
      }
    }
  }
  
  // Handler for save config button
  function saveConfigHandler() {
    const container = document.querySelector('.container');
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
        
        // Find the configuration prompt
        const promptElement = container.querySelector('.alert.alert-warning');
        if (promptElement) {
          container.insertBefore(errorMsg, promptElement.nextSibling);
        } else {
          container.insertBefore(errorMsg, container.firstChild);
        }
      }
    }
  }
  
  // Function to test API credentials
  function testApiCredentials() {
    return new Promise((resolve, reject) => {
      if (!app.apiUrl || !app.apiKey) {
        reject(new Error('API URL or API Key not provided'));
        return;
      }
      
      // Create URL for testing
      const testUrl = `${app.apiUrl}/api/v2/agents?per_page=1`;
      
      // Create Basic Auth token
      const authToken = btoa(app.apiKey + ':X');
      
      // Use fetch to make the request
      fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + authToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        resolve(data);
      })
      .catch(error => {
        reject(error);
      });
    });
  }
  
  // ... existing code ...
})();
