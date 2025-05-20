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
      if (typeof url === 'string' && url.startsWith('https://localhost')) {
        console.log('Converting HTTPS to HTTP for localhost URL:', url);
        url = url.replace('https://localhost', 'http://localhost');
      }
      return originalFetch.call(this, url, options);
    };
    
    // Fix XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
      if (typeof url === 'string' && url.startsWith('https://localhost')) {
        console.log('Converting HTTPS to HTTP for localhost URL in XHR:', url);
        url = url.replace('https://localhost', 'http://localhost');
      }
      return originalOpen.call(this, method, url, async, user, password);
    };
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
    console.log('Initializing app...');
    
    // Check if we should use development mode
    if (window.__DEV_MODE__) {
      console.log('Development mode detected - using development client');
      const devClient = createDevClient();
      window.client = devClient;
      onClientReady(devClient);
      
      // Add a click handler to the dev badge to clear settings
      document.addEventListener('DOMContentLoaded', function() {
        const devBadge = document.querySelector('div[style*="DEV MODE"]');
        if (devBadge) {
          devBadge.style.cursor = 'pointer';
          devBadge.title = 'Click to clear saved settings';
          devBadge.addEventListener('click', function() {
            if (window.client && window.client.db) {
              window.client.db.delete('app_config')
                .then(() => {
                  console.log('Cleared settings from data storage');
                  // Also clear localStorage for complete cleanup
                  localStorage.removeItem('freshservice_change_management_iparams');
                  localStorage.removeItem('appConfig');
                })
                .catch(err => console.error('Error clearing settings from data storage:', err));
            } else {
              // Fallback to localStorage only
              localStorage.removeItem('freshservice_change_management_iparams');
              localStorage.removeItem('appConfig');
            }
            
            // Show notification instead of using alert
            const notification = document.createElement('div');
            notification.style.position = 'fixed';
            notification.style.top = '40px';
            notification.style.right = '10px';
            notification.style.backgroundColor = '#4CAF50';
            notification.style.color = 'white';
            notification.style.padding = '10px';
            notification.style.borderRadius = '4px';
            notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            notification.style.zIndex = '9999';
            notification.textContent = 'Settings cleared. Reload page to enter new settings.';
            
            // Add close button
            const closeBtn = document.createElement('span');
            closeBtn.textContent = '✕';
            closeBtn.style.marginLeft = '10px';
            closeBtn.style.cursor = 'pointer';
            closeBtn.onclick = function() {
              document.body.removeChild(notification);
            };
            notification.appendChild(closeBtn);
            
            // Add reload button
            const reloadBtn = document.createElement('button');
            reloadBtn.textContent = 'Reload Now';
            reloadBtn.style.marginLeft = '10px';
            reloadBtn.style.border = '1px solid white';
            reloadBtn.style.background = 'transparent';
            reloadBtn.style.color = 'white';
            reloadBtn.style.padding = '2px 5px';
            reloadBtn.style.cursor = 'pointer';
            reloadBtn.style.borderRadius = '3px';
            reloadBtn.onclick = function() {
              location.reload();
            };
            notification.appendChild(reloadBtn);
            
            // Auto-remove after 5 seconds
            document.body.appendChild(notification);
            setTimeout(function() {
              if (document.body.contains(notification)) {
                document.body.removeChild(notification);
              }
            }, 5000);
          });
        }
      });
      
      return;
    }
    
    // Standard Freshworks app initialization for production
    
    // Check if we're in Freshworks environment (with app loader)
    if (typeof FreshworksWidget !== 'undefined' || 
        typeof apploader !== 'undefined' || 
        document.querySelector('freshworks-app-root')) {
      console.log('Freshworks environment detected');
    }
    
    // Try to find the app.initialized method from parent contexts
    let freshworksApp = null;
    
    // First check our own context
    if (window.app && typeof window.app.initialized === 'function') {
      console.log('Found app.initialized in window.app');
      freshworksApp = window.app;
    } 
    // Check if we're in an iframe and try to access parent context
    else if (window.parent && window.parent !== window) {
      console.log('Checking parent window for app.initialized');
      try {
        if (window.parent.app && typeof window.parent.app.initialized === 'function') {
          console.log('Found app.initialized in parent.app');
          freshworksApp = window.parent.app;
        }
      } catch (e) {
        console.error('Error accessing parent window:', e);
      }
    }
    
    // If we found an app context with initialized method, use it
    if (freshworksApp) {
      console.log('Using found app.initialized method');
      try {
        // Standard initialization as recommended by Freshworks
        freshworksApp.initialized()
          .then(function(client) {
            console.log('Client initialization successful using app.initialized');
            window.client = client;
            onClientReady(client);
          })
          .catch(function(error) {
            console.error('Error initializing client using app.initialized:', error);
            initializeFallback();
          });
      } catch (error) {
        console.error('Error calling app.initialized:', error);
        initializeFallback();
      }
    } else {
      // No app.initialized found, try fallback
      console.log('No app.initialized method found, using fallback');
      initializeFallback();
    }
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
      // Build a simple query for first_name, last_name, or email
      // Per Freshservice docs, the query format should be "\"name:\'John\'\"" (with escaped quotes)
      console.log('Using simple query with OR conditions');
      queryString = `"first_name:'${searchTerm}'" OR "last_name:'${searchTerm}'" OR "email:'${searchTerm}'"`;
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
        showError('API configuration is missing. Please check app installation parameters.');
        // Resolve with sample data instead of rejecting
        const sampleData = renderSampleUsers(query);
        resolve(sampleData);
        return;
      }
      
      console.log('Searching users with query:', query);
      console.log('Using API URL:', app.apiUrl);
      
      // Validate API URL
      if (app.apiUrl === '' || !app.apiUrl.includes('.freshservice.com')) {
        showError(`Invalid API URL: ${app.apiUrl || '(empty)'} - Must be a valid Freshservice domain`);
        const sampleData = renderSampleUsers(query);
        resolve(sampleData);
        return;
      }
      
      // Make sure we have a client
      if (!window.client || !window.client.request) {
        // Try to use direct fetch instead of client
        console.log('Client request not available, using direct fetch');
        directFetchUsers(query).then(resolve).catch(reject);
        return;
      }
      
      // Create Basic Auth token
      const authToken = btoa(app.apiKey + ':X');
      console.log('Auth token created (first 10 chars):', authToken.substring(0, 10) + '...');
      
      const options = {
        headers: {
          'Authorization': 'Basic ' + authToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      // Build URL with proper encoding
      // According to Freshservice API docs, query should be without quotes in the URL parameter
      const encodedQuery = encodeURIComponent(query);
      const apiUrl = `${app.apiUrl}/api/v2/agents?query=${encodedQuery}`;
      console.log('Request URL:', apiUrl);
      
      // Make the API request with rate limiting
      console.log('Making rate-limited API request to get agents...');
      
      // Use apiUtils for rate limiting if available, otherwise fall back to normal request
      const requestMethod = window.apiUtils?.get || window.client.request.get.bind(window.client.request);
      
      requestMethod(window.client, apiUrl, options)
        .then(function(response) {
          console.log('API response received, status:', response.status);
          console.log('Full response object:', JSON.stringify(response, null, 2));
          
          try {
            // Step 1: Get the actual data from the response (which might be in different formats)
            let data;
            
            // Case 1: String response that needs parsing
            if (typeof response.response === 'string') {
              console.log('Response is a string, trying to parse as JSON');
              data = JSON.parse(response.response);
            } 
            // Case 2: Response is already an object
            else if (typeof response.response === 'object' && response.response !== null) {
              console.log('Response is already an object');
              data = response.response;
            }
            // Case 3: Response itself might be the data (direct response)
            else if (typeof response === 'object' && response !== null && !response.response) {
              console.log('Response appears to be the data directly');
              data = response;
            }
            // Case 4: Fall back to the full response as a last resort
            else {
              console.log('Using full response as data');
              data = response;
            }
            
            console.log('Extracted data:', JSON.stringify(data, null, 2));
            
            // Step 2: Find the actual agents data, which could be in different properties
            let agentsData = [];
            
            // Check for standard format with agents property
            if (data && data.agents && Array.isArray(data.agents)) {
              console.log(`Found agents in standard format, count: ${data.agents.length}`);
              agentsData = data.agents;
            }
            // Check if the data itself is an array
            else if (data && Array.isArray(data)) {
              console.log('Data is an array directly, using as agents');
              agentsData = data;
            }
            // Check if we need to go one level deeper (some APIs wrap in 'data' property)
            else if (data && data.data) {
              if (Array.isArray(data.data)) {
                console.log('Found agents in data property, using as agents');
                agentsData = data.data;
              }
              else if (data.data.agents && Array.isArray(data.data.agents)) {
                console.log('Found agents in data.agents property');
                agentsData = data.data.agents;
              }
            }
            
            // If we found any agents, render them
            if (agentsData.length > 0) {
              console.log(`Found ${agentsData.length} agents to render`);
              renderResults('users', agentsData);
              resolve(agentsData);
            } else {
              console.log('No agents found in any expected location');
              // Check one more time through all properties to find arrays that might be agents
              let foundArray = false;
              
              if (typeof data === 'object' && data !== null) {
                // Look through all properties for arrays
                for (const key in data) {
                  if (Array.isArray(data[key]) && data[key].length > 0 && 
                      // Check if array items look like agents (have typical agent properties)
                      (data[key][0].email || data[key][0].first_name || data[key][0].last_name)) {
                    console.log(`Found possible agents array in '${key}' property`);
                    agentsData = data[key];
                    foundArray = true;
                    break;
                  }
                }
              }
              
              if (foundArray) {
                renderResults('users', agentsData);
                resolve(agentsData);
              } else {
                console.warn('No agents found in response');
                renderResults('users', []);
                resolve([]);
              }
            }
          } catch (error) {
            console.error('Error processing API response:', error);
            console.error('Failed response:', response);
            
            // Even if we fail to parse, try to show the raw data
            let errorMessage = `Error processing response: ${error.message}`;
            let responseText = '';
            
            try {
              // Try to get some useful information from the response
              if (response && response.response) {
                if (typeof response.response === 'string') {
                  responseText = response.response.substring(0, 100) + '...';
                } else if (typeof response.response === 'object') {
                  responseText = JSON.stringify(response.response).substring(0, 100) + '...';
                }
              }
              
              if (responseText) {
                console.log('Response preview:', responseText);
                // Don't reject, try to work with the data we have
                let dataToRender = [];
                
                if (responseText.includes('email') || responseText.includes('first_name')) {
                  try {
                    // Last attempt to extract usable data
                    if (typeof response.response === 'string') {
                      dataToRender = JSON.parse(response.response);
                      if (!Array.isArray(dataToRender)) {
                        // Navigate through common object structures to find agents
                        if (dataToRender.agents) dataToRender = dataToRender.agents;
                        else if (dataToRender.data && Array.isArray(dataToRender.data)) {
                          dataToRender = dataToRender.data;
                        }
                        else if (dataToRender.data && dataToRender.data.agents) {
                          dataToRender = dataToRender.data.agents;
                        }
                        // If still not an array but looks like a single agent, wrap it
                        else if (dataToRender.email || dataToRender.first_name) {
                          dataToRender = [dataToRender];
                        }
                        else {
                          dataToRender = [];
                        }
                      }
                    }
                    
                    if (dataToRender && dataToRender.length > 0) {
                      console.log('Recovered data from error situation:', dataToRender);
                      renderResults('users', dataToRender);
                      return resolve(dataToRender);
                    }
                  } catch (e) {
                    console.error('Failed recovery attempt:', e);
                  }
                }
              }
            } catch (e) {
              console.error('Error in error handling:', e);
            }
            
            showError(errorMessage);
            renderResults('users', []);
            resolve([]);  // Resolve empty instead of rejecting
          }
        })
        .catch(function(error) {
          console.error('API request failed:', error);
          
          let errorMessage = 'API request failed';
          if (error.status) {
            errorMessage += ` (Status: ${error.status})`;
          }
          if (error.message) {
            errorMessage += `: ${error.message}`;
          } else if (error.statusText) {
            errorMessage += `: ${error.statusText}`;
          }
          
          showError(errorMessage);
          
          // Always fall back to sample data if the API call fails
          console.log('API call failed, falling back to sample data');
          const sampleData = renderSampleUsers(query);
          resolve(sampleData);
        })
        .finally(function() {
          toggleSpinner(false);
        });
    });
  }
  
  // Fallback to use direct fetch instead of client
  function directFetchUsers(query) {
    return new Promise((resolve) => {
      console.log('Using direct fetch for users search');
      toggleSpinner(true);
      
      if (!app.apiUrl || !app.apiKey) {
        console.log('API configuration missing, using sample data');
        const sampleData = renderSampleUsers(query);
        resolve(sampleData);
        return;
      }
      
      // Validate API URL
      if (app.apiUrl === '' || !app.apiUrl.includes('.freshservice.com')) {
        showError(`Invalid API URL: ${app.apiUrl || '(empty)'} - Must be a valid Freshservice domain`);
        const sampleData = renderSampleUsers(query);
        resolve(sampleData);
        toggleSpinner(false);
        return;
      }
      
      try {
        // Create auth token
        const authToken = btoa(app.apiKey + ':X');
        
        // Build the query (use the raw query parameter without quotes)
        const encodedQuery = encodeURIComponent(query);
        const apiUrl = `${app.apiUrl}/api/v2/agents?query=${encodedQuery}`;
        console.log('Direct fetch URL:', apiUrl);
        
                  // Try to use rate-limited client.request if available
          if (window.client && window.client.request) {
            const options = {
              headers: {
                'Authorization': 'Basic ' + authToken,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            };
            
            // Use apiUtils for rate limiting if available
            const requestMethod = window.apiUtils?.get || window.client.request.get.bind(window.client.request);
            requestMethod(window.client, apiUrl, options)
            .then(response => {
              console.log('Client request response:', response);
              
              // Parse the response which could be in different formats
              let data;
              if (typeof response.response === 'string') {
                data = JSON.parse(response.response);
              } else if (typeof response.response === 'object') {
                data = response.response;
              } else {
                data = response;
              }
              
              if (data && data.agents && Array.isArray(data.agents)) {
                console.log(`Found ${data.agents.length} agents matching the query`);
                renderResults('users', data.agents);
                resolve(data.agents);
              } else {
                console.warn('Response contained no agents array:', data);
                // Check if data is in a different format
                if (data && Array.isArray(data)) {
                  console.log('Data appears to be an array directly, using as agents');
                  renderResults('users', data);
                  resolve(data);
                } else {
                  renderResults('users', []);
                  resolve([]);
                }
              }
            })
            .catch(error => {
              console.error('Client request error:', error);
              
              // Show detailed error message
              const errorMessage = 'API request failed' + (error.message ? `: ${error.message}` : '');
              showError(errorMessage);
              
              console.log('Falling back to sample data');
              const sampleData = renderSampleUsers(query);
              resolve(sampleData);
            })
            .finally(() => {
              toggleSpinner(false);
            });
        } else {
          // Fallback to rate-limited fetch if client.request is not available
          const fetchMethod = window.apiUtils?.fetch || fetch;
          const options = {
            method: 'GET',
            headers: {
              'Authorization': 'Basic ' + authToken,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          };
          
          fetchMethod(apiUrl, options)
          .then(response => {
            if (!response.ok) {
              throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }
            return response.json();
          })
          .then(data => {
            console.log('Direct fetch response:', data);
            
            if (data && data.agents && Array.isArray(data.agents)) {
              console.log(`Found ${data.agents.length} agents matching the query`);
              renderResults('users', data.agents);
              resolve(data.agents);
            } else {
              console.warn('Response contained no agents array:', data);
              // Check if data is in a different format
              if (data && Array.isArray(data)) {
                console.log('Data appears to be an array directly, using as agents');
                renderResults('users', data);
                resolve(data);
              } else {
                renderResults('users', []);
                resolve([]);
              }
            }
          })
          .catch(error => {
            console.error('Direct fetch error:', error);
            
            // Show detailed error message
            const errorMessage = 'API request failed' + (error.message ? `: ${error.message}` : '');
            showError(errorMessage);
            
            console.log('Falling back to sample data');
            const sampleData = renderSampleUsers(query);
            resolve(sampleData);
          })
          .finally(() => {
            toggleSpinner(false);
          });
        }
      } catch (error) {
        console.error('Error in direct fetch:', error);
        showError(`Error making API request: ${error.message}`);
        const sampleData = renderSampleUsers(query);
        resolve(sampleData);
        toggleSpinner(false);
      }
    });
  }
  
  // Render sample users data for testing
  function renderSampleUsers(query) {
    console.log('Rendering sample users for: ' + query);
    
    // Generate fake users based on query
    const sampleUsers = [
      {
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@example.com',
        active: true,
        department: 'IT'
      },
      {
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane.doe@example.com',
        active: true,
        department: 'HR'
      },
      {
        first_name: 'Alex',
        last_name: 'Johnson',
        email: 'alex.johnson@example.com',
        active: true,
        department: 'Finance'
      }
    ];
    
    // Check if query matches any sample users
    const filteredUsers = sampleUsers.filter(user => {
      const fullName = (user.first_name + ' ' + user.last_name).toLowerCase();
      const email = user.email.toLowerCase();
      const searchTerm = query.toLowerCase();
      
      return fullName.includes(searchTerm) || email.includes(searchTerm);
    });
    
    renderResults('users', filteredUsers);
    toggleSpinner(false);
    
    return filteredUsers;
  }
  
  // Search for requesters via Freshservice API
  function searchRequesters(query) {
    return new Promise((resolve, reject) => {
      // Check if API URL and key are available
      if (!app.apiUrl || !app.apiKey) {
        showError('API configuration is missing. Please check app installation parameters.');
        const sampleData = renderSampleRequesters(query);
        resolve(sampleData);
        return;
      }
      
      console.log('Searching requesters with query:', query);
      console.log('Using API URL:', app.apiUrl);
      
      // Validate API URL
      if (app.apiUrl === '' || !app.apiUrl.includes('.freshservice.com')) {
        showError(`Invalid API URL: ${app.apiUrl || '(empty)'} - Must be a valid Freshservice domain`);
        const sampleData = renderSampleRequesters(query);
        resolve(sampleData);
        return;
      }
      
      // Make sure we have a client
      if (!window.client || !window.client.request) {
        // Try to use direct fetch instead of client
        console.log('Client request not available, using direct fetch');
        directFetchRequesters(query).then(resolve).catch(reject);
        return;
      }
      
      // Create Basic Auth token
      const authToken = btoa(app.apiKey + ':X');
      console.log('Auth token created (first 10 chars):', authToken.substring(0, 10) + '...');
      
      const options = {
        headers: {
          'Authorization': 'Basic ' + authToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      // Build URL with proper encoding
      // According to Freshservice API docs, query should be without quotes in the URL parameter
      const encodedQuery = encodeURIComponent(query);
      const apiUrl = `${app.apiUrl}/api/v2/requesters?query=${encodedQuery}`;
      console.log('Request URL:', apiUrl);
      
      // Make the API request with rate limiting
      console.log('Making rate-limited API request to get requesters...');
      
      // Use apiUtils for rate limiting if available, otherwise fall back to normal request
      const requestMethod = window.apiUtils?.get || window.client.request.get.bind(window.client.request);
      
      requestMethod(window.client, apiUrl, options)
        .then(function(response) {
          console.log('API response received, status:', response.status);
          console.log('Full response object:', JSON.stringify(response, null, 2));
          
          try {
            // Step 1: Get the actual data from the response (which might be in different formats)
            let data;
            
            // Case 1: String response that needs parsing
            if (typeof response.response === 'string') {
              console.log('Response is a string, trying to parse as JSON');
              data = JSON.parse(response.response);
            } 
            // Case 2: Response is already an object
            else if (typeof response.response === 'object' && response.response !== null) {
              console.log('Response is already an object');
              data = response.response;
            }
            // Case 3: Response itself might be the data (direct response)
            else if (typeof response === 'object' && response !== null && !response.response) {
              console.log('Response appears to be the data directly');
              data = response;
            }
            // Case 4: Fall back to the full response as a last resort
            else {
              console.log('Using full response as data');
              data = response;
            }
            
            console.log('Extracted data:', JSON.stringify(data, null, 2));
            
            // Step 2: Find the actual requesters data, which could be in different properties
            let requestersData = [];
            
            // Check for standard format with requesters property
            if (data && data.requesters && Array.isArray(data.requesters)) {
              console.log(`Found requesters in standard format, count: ${data.requesters.length}`);
              requestersData = data.requesters;
            }
            // Check if the data itself is an array
            else if (data && Array.isArray(data)) {
              console.log('Data is an array directly, using as requesters');
              requestersData = data;
            }
            // Check if we need to go one level deeper (some APIs wrap in 'data' property)
            else if (data && data.data) {
              if (Array.isArray(data.data)) {
                console.log('Found requesters in data property, using as requesters');
                requestersData = data.data;
              }
              else if (data.data.requesters && Array.isArray(data.data.requesters)) {
                console.log('Found requesters in data.requesters property');
                requestersData = data.data.requesters;
              }
            }
            
            // If we found any requesters, render them
            if (requestersData.length > 0) {
              console.log(`Found ${requestersData.length} requesters to render`);
              renderResults('requesters', requestersData);
              resolve(requestersData);
            } else {
              console.log('No requesters found in any expected location');
              // Check one more time through all properties to find arrays that might be requesters
              let foundArray = false;
              
              if (typeof data === 'object' && data !== null) {
                // Look through all properties for arrays
                for (const key in data) {
                  if (Array.isArray(data[key]) && data[key].length > 0 && 
                      // Check if array items look like requesters (have typical requester properties)
                      (data[key][0].email || data[key][0].first_name || data[key][0].last_name)) {
                    console.log(`Found possible requesters array in '${key}' property`);
                    requestersData = data[key];
                    foundArray = true;
                    break;
                  }
                }
              }
              
              if (foundArray) {
                renderResults('requesters', requestersData);
                resolve(requestersData);
              } else {
                console.warn('No requesters found in response');
                renderResults('requesters', []);
                resolve([]);
              }
            }
          } catch (error) {
            console.error('Error processing API response:', error);
            console.error('Failed response:', response);
            
            // Even if we fail to parse, try to show the raw data
            let errorMessage = `Error processing response: ${error.message}`;
            let responseText = '';
            
            try {
              // Try to get some useful information from the response
              if (response && response.response) {
                if (typeof response.response === 'string') {
                  responseText = response.response.substring(0, 100) + '...';
                } else if (typeof response.response === 'object') {
                  responseText = JSON.stringify(response.response).substring(0, 100) + '...';
                }
              }
              
              if (responseText) {
                console.log('Response preview:', responseText);
                // Don't reject, try to work with the data we have
                let dataToRender = [];
                
                if (responseText.includes('email') || responseText.includes('first_name')) {
                  try {
                    // Last attempt to extract usable data
                    if (typeof response.response === 'string') {
                      dataToRender = JSON.parse(response.response);
                      if (!Array.isArray(dataToRender)) {
                        // Navigate through common object structures to find requesters
                        if (dataToRender.requesters) dataToRender = dataToRender.requesters;
                        else if (dataToRender.data && Array.isArray(dataToRender.data)) {
                          dataToRender = dataToRender.data;
                        }
                        else if (dataToRender.data && dataToRender.data.requesters) {
                          dataToRender = dataToRender.data.requesters;
                        }
                        // If still not an array but looks like a single requester, wrap it
                        else if (dataToRender.email || dataToRender.first_name) {
                          dataToRender = [dataToRender];
                        }
                        else {
                          dataToRender = [];
                        }
                      }
                    }
                    
                    if (dataToRender && dataToRender.length > 0) {
                      console.log('Recovered data from error situation:', dataToRender);
                      renderResults('requesters', dataToRender);
                      return resolve(dataToRender);
                    }
                  } catch (e) {
                    console.error('Failed recovery attempt:', e);
                  }
                }
              }
            } catch (e) {
              console.error('Error in error handling:', e);
            }
            
            showError(errorMessage);
            renderResults('requesters', []);
            resolve([]);  // Resolve empty instead of rejecting
          }
        })
        .catch(function(error) {
          console.error('API request failed:', error);
          
          let errorMessage = 'API request failed';
          if (error.status) {
            errorMessage += ` (Status: ${error.status})`;
          }
          if (error.message) {
            errorMessage += `: ${error.message}`;
          } else if (error.statusText) {
            errorMessage += `: ${error.statusText}`;
          }
          
          showError(errorMessage);
          
          // Always fall back to sample data if the API call fails
          console.log('API call failed, falling back to sample data');
          const sampleData = renderSampleRequesters(query);
          resolve(sampleData);
        })
        .finally(function() {
          toggleSpinner(false);
        });
    });
  }
  
  // Fallback to use direct fetch instead of client
  function directFetchRequesters(query) {
    return new Promise((resolve) => {
      console.log('Using direct fetch for requesters search');
      toggleSpinner(true);
      
      if (!app.apiUrl || !app.apiKey) {
        console.log('API configuration missing, using sample data');
        const sampleData = renderSampleRequesters(query);
        resolve(sampleData);
        return;
      }
      
      // Validate API URL
      if (app.apiUrl === '' || !app.apiUrl.includes('.freshservice.com')) {
        showError(`Invalid API URL: ${app.apiUrl || '(empty)'} - Must be a valid Freshservice domain`);
        const sampleData = renderSampleRequesters(query);
        resolve(sampleData);
        toggleSpinner(false);
        return;
      }
      
      try {
        // Create auth token
        const authToken = btoa(app.apiKey + ':X');
        
        // Build the query (use the raw query parameter without quotes)
        const encodedQuery = encodeURIComponent(query);
        const apiUrl = `${app.apiUrl}/api/v2/requesters?query=${encodedQuery}`;
        console.log('Direct fetch URL:', apiUrl);
        
        // Try to use rate-limited client.request if available
        if (window.client && window.client.request) {
          const options = {
            headers: {
              'Authorization': 'Basic ' + authToken,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          };
          
          // Use apiUtils for rate limiting if available
          const requestMethod = window.apiUtils?.get || window.client.request.get.bind(window.client.request);
          requestMethod(window.client, apiUrl, options)
            .then(response => {
              console.log('Client request response:', response);
              
              // Parse the response which could be in different formats
              let data;
              if (typeof response.response === 'string') {
                data = JSON.parse(response.response);
              } else if (typeof response.response === 'object') {
                data = response.response;
              } else {
                data = response;
              }
              
              if (data && data.requesters && Array.isArray(data.requesters)) {
                console.log(`Found ${data.requesters.length} requesters matching the query`);
                renderResults('requesters', data.requesters);
                resolve(data.requesters);
              } else {
                console.warn('Response contained no requesters array:', data);
                // Check if data is in a different format
                if (data && Array.isArray(data)) {
                  console.log('Data appears to be an array directly, using as requesters');
                  renderResults('requesters', data);
                  resolve(data);
                } else {
                  renderResults('requesters', []);
                  resolve([]);
                }
              }
            })
            .catch(error => {
              console.error('Client request error:', error);
              
              // Show detailed error message
              const errorMessage = 'API request failed' + (error.message ? `: ${error.message}` : '');
              showError(errorMessage);
              
              console.log('Falling back to sample data');
              const sampleData = renderSampleRequesters(query);
              resolve(sampleData);
            })
            .finally(() => {
              toggleSpinner(false);
            });
          return;
        }
        
        // Fallback to rate-limited fetch API if client.request is not available
        const fetchMethod = window.apiUtils?.fetch || fetch;
        const options = {
          method: 'GET',
          headers: {
            'Authorization': 'Basic ' + authToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        };
        
        fetchMethod(apiUrl, options)
        .then(response => {
          if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('Direct fetch response:', data);
          
          if (data && data.requesters && Array.isArray(data.requesters)) {
            console.log(`Found ${data.requesters.length} requesters matching the query`);
            renderResults('requesters', data.requesters);
            resolve(data.requesters);
          } else {
            console.warn('Response contained no requesters array:', data);
            // Check if data is in a different format
            if (data && Array.isArray(data)) {
              console.log('Data appears to be an array directly, using as requesters');
              renderResults('requesters', data);
              resolve(data);
            } else {
              renderResults('requesters', []);
              resolve([]);
            }
          }
        })
        .catch(error => {
          console.error('Direct fetch error:', error);
          
          // Show detailed error message
          const errorMessage = 'API request failed';
          if (error.message) {
            errorMessage += `: ${error.message}`;
          }
          showError(errorMessage);
          
          console.log('Falling back to sample data');
          const sampleData = renderSampleRequesters(query);
          resolve(sampleData);
        })
        .finally(() => {
          toggleSpinner(false);
        });
      } catch (error) {
        console.error('Error in direct fetch:', error);
        showError(`Error making API request: ${error.message}`);
        const sampleData = renderSampleRequesters(query);
        resolve(sampleData);
        toggleSpinner(false);
      }
    });
  }
  
  // Render sample requesters data for testing
  function renderSampleRequesters(query) {
    console.log('Rendering sample requesters for: ' + query);
    
    // Generate fake requesters based on query
    const sampleRequesters = [
      {
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob.johnson@example.com',
        active: true,
        department: 'Marketing'
      },
      {
        first_name: 'Mary',
        last_name: 'Williams',
        email: 'mary.williams@example.com',
        active: true,
        department: 'Sales'
      },
      {
        first_name: 'Alice',
        last_name: 'Brown',
        email: 'alice.brown@example.com',
        active: true,
        department: 'Operations'
      }
    ];
    
    // Check if query matches any sample requesters
    const filteredRequesters = sampleRequesters.filter(requester => {
      const fullName = (requester.first_name + ' ' + requester.last_name).toLowerCase();
      const email = requester.email.toLowerCase();
      const searchTerm = query.toLowerCase();
      
      return fullName.includes(searchTerm) || email.includes(searchTerm);
    });
    
    renderResults('requesters', filteredRequesters);
    toggleSpinner(false);
    
    return filteredRequesters;
  }
  
  // Render search results
  function renderResults(type, results) {
    const resultsContainer = document.getElementById(`${type}Results`);
    
    // Remove search status message if it exists
    const statusMsg = document.getElementById('searchStatus');
    if (statusMsg) {
      statusMsg.remove();
    }
    
    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div class="alert alert-info mt-3">
          No ${type} found matching your search criteria.
        </div>
      `;
      return;
    }
    
    // Show the number of results found with export button
    const countMessage = document.createElement('div');
    countMessage.className = 'alert alert-success mt-2 mb-3 d-flex justify-content-between align-items-center';
    countMessage.innerHTML = `
      <span>Found ${results.length} ${type} matching your search criteria</span>
      <button class="btn btn-sm btn-outline-success" onclick="exportToCsv('${type}')">
        Export to CSV
      </button>
    `;
    resultsContainer.appendChild(countMessage);
    
    // Store results in a global variable for export function to access
    window.app = window.app || {};
    window.app.lastSearchResults = {
      type: type,
      data: results
    };
    
    // Define and initialize the HTML variable before using it
    let resultHtml = '<div class="search-results">';
    
    // Build each result card
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      
      // Handle potentially missing or null fields
      const firstName = result.first_name || '';
      const lastName = result.last_name || '';
      const email = result.email || 'No email provided';
      const initials = getInitials(firstName, lastName);
      
      // Build additional attributes section
      let additionalAttributes = '';
      
      // Function to safely add a badge if the attribute exists
      const addBadgeIfExists = (label, value, badgeClass = 'badge-secondary') => {
        if (value !== undefined && value !== null && value !== '') {
          return `<span class="badge ${badgeClass} mr-1">${label}: ${value}</span>`;
        }
        return '';
      };
      
      // Add department info from either department_ids or department
      if (result.department_ids && Array.isArray(result.department_ids) && result.department_ids.length > 0) {
        additionalAttributes += addBadgeIfExists('Dept IDs', result.department_ids.join(', '), 'badge-light');
      } else if (result.department) {
        additionalAttributes += addBadgeIfExists('Dept', result.department, 'badge-light');
      }
      
      // Add job title if available
      if (result.job_title) {
        additionalAttributes += addBadgeIfExists('Job', result.job_title, 'badge-light');
      }
      
      // Add location if available
      if (result.location_id) {
        additionalAttributes += addBadgeIfExists('Location', result.location_id, 'badge-light');
      }
      
      // Add phone if available
      if (result.work_phone_number) {
        additionalAttributes += addBadgeIfExists('Phone', result.work_phone_number, 'badge-light');
      }
      
      // Add role info if available
      if (result.roles && Array.isArray(result.roles) && result.roles.length > 0) {
        const roleIds = result.roles.map(r => r.role_id).join(', ');
        additionalAttributes += addBadgeIfExists('Roles', roleIds, 'badge-info');
      }
      
      // Add group memberships if available
      if (result.member_of && Array.isArray(result.member_of) && result.member_of.length > 0) {
        additionalAttributes += addBadgeIfExists('Member of', result.member_of.join(', '), 'badge-info');
      }
      
      // Add occasional status for agents
      if (type === 'users' && result.occasional !== undefined) {
        additionalAttributes += `
          <span class="badge ${result.occasional ? 'badge-warning' : 'badge-dark'} mr-1">
            ${result.occasional ? 'Occasional' : 'Full-time'}
          </span>
        `;
      }
      
      // Add created date if available
      if (result.created_at) {
        const createdDate = new Date(result.created_at);
        const formattedDate = createdDate.toLocaleDateString();
        additionalAttributes += addBadgeIfExists('Created', formattedDate, 'badge-light');
      }
      
      // Add custom fields if available
      if (result.custom_fields && Object.keys(result.custom_fields).length > 0) {
        for (const [key, value] of Object.entries(result.custom_fields)) {
          if (value) {
            additionalAttributes += addBadgeIfExists(key, value, 'badge-light');
          }
        }
      }
      
      // Prepare text for copy to clipboard
      const copyText = `Name: ${firstName} ${lastName}
Email: ${email}
Type: ${type === 'users' ? 'Agent' : 'Requester'}
${result.department ? 'Department: ' + result.department : ''}
${result.job_title ? 'Job Title: ' + result.job_title : ''}
${result.work_phone_number ? 'Phone: ' + result.work_phone_number : ''}`;
      
      // Build the user card with copy button
      resultHtml += `
        <div class="user-card mb-3 border rounded p-3">
          <div class="d-flex align-items-start">
            <div class="user-icon rounded-circle text-center text-white bg-primary mr-3" 
                 style="width: 40px; height: 40px; line-height: 40px; font-weight: bold;">
              ${initials}
            </div>
            <div class="user-details w-100">
              <div class="d-flex justify-content-between align-items-center">
                <div class="user-name font-weight-bold">${firstName} ${lastName}</div>
                <div>
                  <button class="btn btn-sm btn-outline-secondary copy-btn" 
                          onclick="copyToClipboard('${copyText.replace(/'/g, "\\'")}')">
                    Copy Info
                  </button>
                  <span class="badge badge-${result.active ? 'success' : 'secondary'} ml-2">
                    ${result.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div class="user-email text-muted">${email}</div>
              <div class="user-meta mt-2">
                ${type === 'users' ? 
                  `<span class="badge badge-info mr-2">Agent</span>` : 
                  `<span class="badge badge-primary mr-2">Requester</span>`
                }
                ${additionalAttributes}
              </div>
            </div>
          </div>
        </div>
      `;
    }
    
    resultHtml += '</div>';
    
    // Set the HTML content
    resultsContainer.innerHTML += resultHtml;
    
    // Add a note about available fields
    const fieldsNote = document.createElement('div');
    fieldsNote.className = 'small text-muted mt-3';
    fieldsNote.innerHTML = `
      <p>Tip: You can use advanced query syntax for more specific searches. Examples:</p>
      <ul class="small">
        <li><code>job_title:'Support Specialist'</code> - Exact title match</li>
        <li><code>department_id:123</code> - Specific department</li>
        <li><code>~[email]:'john'</code> - Email starts with 'john'</li>
        <li><code>active:true AND department_id:123</code> - Active users in department 123</li>
      </ul>
    `;
    resultsContainer.appendChild(fieldsNote);
  }
  
  // Helper function to get initials from name
  function getInitials(firstName, lastName) {
    let initials = '';
    
    if (firstName) {
      initials += firstName.charAt(0).toUpperCase();
    }
    
    if (lastName) {
      initials += lastName.charAt(0).toUpperCase();
    }
    
    return initials || '?';
  }
  
  // Toggle loading spinner
  function toggleSpinner(show) {
    const spinner = document.getElementById('spinnerOverlay');
    
    if (show) {
      spinner.classList.remove('d-none');
    } else {
      spinner.classList.add('d-none');
    }
  }
  
  // Show error message
  function showError(message, error) {
    // Log error details to console
    logErrorDetails(message, error);
    
    // Hide spinner if visible
    toggleSpinner(false);
    
    // Display error in UI
    displayErrorInUI(message);
  }
  
  // Log error details to console
  function logErrorDetails(message, error) {
    if (error) {
      console.error(message, error);
      
      // Add more debug info if available
      if (error.response) {
        try {
          const responseData = JSON.parse(error.response);
          console.error('Error response data:', responseData);
        } catch (e) {
          console.error('Error response (not JSON):', error.response);
        }
      }
    } else {
      console.error(message);
    }
  }
  
  // Function to test the API credentials
  function testApiCredentials() {
    return new Promise((resolve, reject) => {
      if (!app.apiUrl || !app.apiKey) {
        reject(new Error('API URL or API Key is not configured'));
        return;
      }
      
      // Quick validation of API URL format
      if (!app.apiUrl.includes('.freshservice.com')) {
        reject(new Error('API URL must be a valid Freshservice domain'));
        return;
      }
      
      console.log('Testing API credentials...');
      
      // Create auth token
      const authToken = btoa(app.apiKey + ':X');
      
      // Try to fetch a simple endpoint (just one agent)
      const testUrl = `${app.apiUrl}/api/v2/agents?per_page=1`;
      
      // Use rate-limited client.request when available, otherwise fall back to rate-limited fetch
      if (window.client && window.client.request) {
        const options = {
          headers: {
            'Authorization': 'Basic ' + authToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        };
        
        // Use apiUtils for rate limiting if available
        const requestMethod = window.apiUtils?.get || window.client.request.get.bind(window.client.request);
        
        requestMethod(window.client, testUrl, options)
          .then(response => {
            console.log('API test successful:', response);
            resolve(response);
          })
          .catch(error => {
            console.error('API test failed:', error);
            reject(error);
          });
      } else {
        // Fallback to rate-limited fetch API if client.request is not available
        const fetchMethod = window.apiUtils?.fetch || fetch;
        const options = {
          method: 'GET',
          headers: {
            'Authorization': 'Basic ' + authToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        };
        
        fetchMethod(testUrl, options)
        .then(response => {
          if (!response.ok) {
            throw new Error(`API test failed: ${response.status} ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('API test successful:', data);
          resolve(data);
        })
        .catch(error => {
          console.error('API test failed:', error);
          reject(error);
        });
      }
    });
  }
  
  // Display error in the UI
  function displayErrorInUI(message) {
    // Add API URL to error message if it's an API error
    let displayMessage = message;
    if (message.includes('API') || message.includes('searching')) {
      displayMessage += `<br><br>API URL: ${app.apiUrl || 'Not configured'}`;
    }
    
    // Show error message in active tab
    const activeTab = document.querySelector('.tab-pane.active');
    if (!activeTab) {
      console.error('No active tab found to display error');
      return;
    }
    
    const resultsContainer = activeTab.querySelector('.results-container');
    if (!resultsContainer) {
      console.error('No results container found in active tab');
      return;
    }
    
    resultsContainer.innerHTML = `
      <div class="alert alert-danger mt-3">
        ${displayMessage}
      </div>
    `;
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

  // Function to export search results to CSV
  function exportToCsv(type) {
    // Check if we have results to export
    if (!window.app || !window.app.lastSearchResults || 
        window.app.lastSearchResults.type !== type ||
        !window.app.lastSearchResults.data ||
        window.app.lastSearchResults.data.length === 0) {
      console.error('No search results available to export');
      return;
    }
    
    const results = window.app.lastSearchResults.data;
    
    try {
      // Determine the columns to include in the CSV
      const commonColumns = [
        { key: 'id', label: 'ID' },
        { key: 'first_name', label: 'First Name' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'email', label: 'Email' },
        { key: 'active', label: 'Active' },
        { key: 'department', label: 'Department' },
        { key: 'job_title', label: 'Job Title' },
        { key: 'work_phone_number', label: 'Phone' },
        { key: 'created_at', label: 'Created Date' }
      ];
      
      // Add type-specific columns
      const columns = type === 'users' ? 
        [...commonColumns, { key: 'occasional', label: 'Occasional' }] : 
        commonColumns;
      
      // Create CSV header row
      let csvContent = columns.map(col => `"${col.label}"`).join(',') + '\n';
      
      // Add data rows
      results.forEach(result => {
        const row = columns.map(col => {
          // Get the value for this column
          const value = result[col.key];
          
          // Format value based on type
          if (value === undefined || value === null) {
            return '';
          } else if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
          } else if (typeof value === 'object') {
            // Handle arrays or objects
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          } else if (col.key === 'created_at' && value) {
            // Format date
            try {
              return `"${new Date(value).toLocaleDateString()}"`;
            } catch (e) {
              return `"${value}"`;
            }
          } else {
            // Escape quotes in strings
            return `"${String(value).replace(/"/g, '""')}"`;
          }
        }).join(',');
        
        csvContent += row + '\n';
      });
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `freshservice_${type}_export_${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success notification
      const notification = document.createElement('div');
      notification.style.position = 'fixed';
      notification.style.bottom = '20px';
      notification.style.right = '20px';
      notification.style.backgroundColor = '#28a745';
      notification.style.color = 'white';
      notification.style.padding = '10px 15px';
      notification.style.borderRadius = '4px';
      notification.style.zIndex = '9999';
      notification.textContent = `${results.length} ${type} exported to CSV successfully`;
      
      document.body.appendChild(notification);
      
      // Auto-remove after 3 seconds
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      
      // Show error notification
      const notification = document.createElement('div');
      notification.style.position = 'fixed';
      notification.style.bottom = '20px';
      notification.style.right = '20px';
      notification.style.backgroundColor = '#dc3545';
      notification.style.color = 'white';
      notification.style.padding = '10px 15px';
      notification.style.borderRadius = '4px';
      notification.style.zIndex = '9999';
      notification.textContent = `Error exporting to CSV: ${error.message}`;
      
      document.body.appendChild(notification);
      
      // Auto-remove after 3 seconds
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    }
  }

  // Make function available globally
  window.exportToCsv = exportToCsv;
})();
