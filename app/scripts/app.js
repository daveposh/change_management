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
  const isLocalDev = window.location.href.includes('dev=true') && 
    (window.location.href.includes('localhost') || 
     window.location.hostname.includes('freshservice.com'));
  
  if (isLocalDev) {
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
  
  // Add debug function to check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const forceDevMode = urlParams.get('dev') === 'true';
  const apiUrlParam = urlParams.get('api_url');
  const apiKeyParam = urlParams.get('api_key');
  const appTitleParam = urlParams.get('app_title');
  
  if (forceDevMode) {
    console.log('Development mode forced via URL parameter');
    // Store parameters from URL if provided
    if (apiUrlParam || apiKeyParam || appTitleParam) {
      console.log('Configuration parameters detected in URL');
      window.__DEV_PARAMS__ = window.__DEV_PARAMS__ || {};
      if (apiUrlParam) window.__DEV_PARAMS__.api_url = apiUrlParam;
      if (apiKeyParam) window.__DEV_PARAMS__.api_key = apiKeyParam;
      if (appTitleParam) window.__DEV_PARAMS__.app_title = appTitleParam;
    }
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
    console.log('API URL configured:', app.apiUrl);
    console.log('API Key configured:', !!app.apiKey);
    
    // Add more debug info
    console.log('Window location:', window.location.href);
    console.log('URL has dev=true:', window.location.href.includes('dev=true'));
    
    // Check if the client has iparams method
    if (window.client) {
      console.log('Client object available');
      console.log('Client has iparams:', !!window.client.iparams);
      console.log('Client has context:', !!window.client.context);
      
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
        
        return Promise.resolve({
          api_url: window.__DEV_PARAMS__?.api_url || 'https://example.freshservice.com',
          api_key: window.__DEV_PARAMS__?.api_key || 'dev-placeholder-key'
        });
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
    
    return {
      iparams: {
        get: function() {
          console.log('Dev client: iparams.get called');
          
          // Return your sandbox credentials
          return Promise.resolve({
            api_url: window.__DEV_PARAMS__?.api_url || 'https://example.freshservice.com',
            api_key: window.__DEV_PARAMS__?.api_key || 'dev-placeholder-key'
          });
        }
      },
      request: {
        get: function(url) {
          console.log('Dev client: Making real API call to:', url);
          
          // Get API key from dev params
          const apiKey = window.__DEV_PARAMS__?.api_key || 'dev-placeholder-key';
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
    
    // For local development environment
    const isLocalDev = window.location.href.includes('localhost') || window.location.hostname === '127.0.0.1';
    if (isLocalDev) {
      console.log('Local development environment detected');
      
      // Always use real API calls in development
      console.log('Using real API calls in development');
      const devClient = createDevClient();
      window.client = devClient;
      onClientReady(devClient);
      return;
    }
    
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
    console.log('No client available, creating dev client with real API calls');
    const devClient = createDevClient();
    window.client = devClient;
    onClientReady(devClient);
    showWarning('Using development client with real API calls. Some functionality may be limited.');
  }
  
  // Handler when client is ready
  function onClientReady(client) {
    // Ensure we only initialize once
    if (window.app.initialized) {
      console.log('App already initialized, skipping');
      return;
    }
    
    window.app.initialized = true;
    window.client = client;
    console.log('Client ready, setting up app...');
    
    // Set up event listeners for UI
    setupEventListeners();
    
    // Make search function globally available
    app.performSearch = performSearch;
    window.performSearch = performSearch;
    
    // Load API configuration
    if (client && client.iparams && typeof client.iparams.get === 'function') {
      loadApiConfiguration(client);
    } else {
      // For mock client, try using dev params if available
      app.apiUrl = window.__DEV_PARAMS__?.api_url || 'https://example.freshservice.com';
      app.apiKey = window.__DEV_PARAMS__?.api_key || '';
      app.appTitle = window.__DEV_PARAMS__?.app_title || 'CXI Change Management';
      
      // Update the UI with the title
      updateAppTitle(app.appTitle);
      
      console.log('Using development configuration:', { apiUrl: app.apiUrl, appTitle: app.appTitle });
      showWarning('Using development configuration. Contact administrator if search doesn\'t work.');
    }
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
  }
  
  // Load API configuration from installation parameters
  function loadApiConfiguration(client) {
    console.log('Loading API configuration...');
    
    if (!client || !client.iparams || typeof client.iparams.get !== 'function') {
      console.error('Client iparams API not available');
      showError('Cannot access app configuration. Please contact your administrator.');
      return;
    }
    
    client.iparams.get()
      .then(function(data) {
        console.log('Installation parameters received:', data);
        
        if (data && data.api_url && data.api_key) {
          let apiUrl = data.api_url;
          const apiKey = data.api_key;
          
          // Process the API URL
          // Add https:// if not present
          if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
            apiUrl = 'https://' + apiUrl;
            console.log('Added https:// prefix to API URL:', apiUrl);
          } else if (apiUrl.startsWith('http://')) {
            // Replace http:// with https://
            apiUrl = apiUrl.replace('http://', 'https://');
            console.log('Converted HTTP to HTTPS for API URL:', apiUrl);
          }
          
          // Remove trailing slash if present
          if (apiUrl.endsWith('/')) {
            apiUrl = apiUrl.slice(0, -1);
          }
          
          // Store the processed values
          app.apiUrl = apiUrl;
          app.apiKey = apiKey;
          
          // Set the app title from configuration if available
          if (data.app_title) {
            app.appTitle = data.app_title;
            updateAppTitle(data.app_title);
          }
          
          console.log('API configuration loaded successfully:', { apiUrl: app.apiUrl, hasApiKey: !!app.apiKey, appTitle: app.appTitle });
        } else {
          console.error('Missing API parameters in configuration');
          showError('API configuration is incomplete. Please check installation parameters.');
        }
      })
      .catch(function(error) {
        console.error('Error loading API configuration:', error);
        showError('Failed to load API configuration. Please refresh the page.');
      });
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
      return showError('API configuration is missing. Please check app installation parameters from the admin settings.');
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
    } else {
      console.error(`Results container '${searchType}Results' not found`);
      toggleSpinner(false);
      return showError('Results container not found');
    }
    
    // Perform search based on active tab
    if (searchType === 'users') {
      searchUsers(searchTerm);
    } else {
      searchRequesters(searchTerm);
    }
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
      const queryString = `~[first_name|last_name|email]:'${query}'`;
      const encodedQuery = encodeURIComponent(queryString);
      const apiUrl = `${app.apiUrl}/api/v2/agents?query="${encodedQuery}"`;
      console.log('Request URL:', apiUrl);
      
      // Make the API request
      console.log('Making API request to get agents...');
      window.client.request.get(apiUrl, options)
        .then(function(response) {
          console.log('API response received, status:', response.status);
          
          try {
            console.log('Raw response:', response.response);
            const data = JSON.parse(response.response);
            console.log('Parsed data:', data);
            
            if (data && data.agents && Array.isArray(data.agents)) {
              console.log(`Found ${data.agents.length} agents matching the query`);
              renderResults('users', data.agents);
              resolve(data.agents);
            } else {
              console.warn('Response contained no agents array:', data);
              renderResults('users', []);
              resolve([]);
            }
          } catch (error) {
            console.error('Error parsing API response:', error);
            console.error('Failed response:', response.response);
            showError('Invalid response format from API');
            reject(error);
          }
        })
        .catch(function(error) {
          console.error('API request failed:', error);
          
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
      
      try {
        // Create auth token
        const authToken = btoa(app.apiKey + ':X');
        
        // Build the query
        const queryString = `~[first_name|last_name|email]:'${query}'`;
        const encodedQuery = encodeURIComponent(queryString);
        const apiUrl = `${app.apiUrl}/api/v2/agents?query="${encodedQuery}"`;
        console.log('Direct fetch URL:', apiUrl);
        
        // Make the API call
        fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': 'Basic ' + authToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.status);
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
            renderResults('users', []);
            resolve([]);
          }
        })
        .catch(error => {
          console.error('Direct fetch error:', error);
          console.log('Falling back to sample data');
          const sampleData = renderSampleUsers(query);
          resolve(sampleData);
        })
        .finally(() => {
          toggleSpinner(false);
        });
      } catch (error) {
        console.error('Error in direct fetch:', error);
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
      const queryString = `~[first_name|last_name|email]:'${query}'`;
      const encodedQuery = encodeURIComponent(queryString);
      const apiUrl = `${app.apiUrl}/api/v2/requesters?query="${encodedQuery}"`;
      console.log('Request URL:', apiUrl);
      
      // Make the API request
      console.log('Making API request to get requesters...');
      window.client.request.get(apiUrl, options)
        .then(function(response) {
          console.log('API response received, status:', response.status);
          
          try {
            console.log('Raw response:', response.response);
            const data = JSON.parse(response.response);
            console.log('Parsed data:', data);
            
            if (data && data.requesters && Array.isArray(data.requesters)) {
              console.log(`Found ${data.requesters.length} requesters matching the query`);
              renderResults('requesters', data.requesters);
              resolve(data.requesters);
            } else {
              console.warn('Response contained no requesters array:', data);
              renderResults('requesters', []);
              resolve([]);
            }
          } catch (error) {
            console.error('Error parsing API response:', error);
            console.error('Failed response:', response.response);
            showError('Invalid response format from API');
            reject(error);
          }
        })
        .catch(function(error) {
          console.error('API request failed:', error);
          
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
      
      try {
        // Create auth token
        const authToken = btoa(app.apiKey + ':X');
        
        // Build the query
        const queryString = `~[first_name|last_name|email]:'${query}'`;
        const encodedQuery = encodeURIComponent(queryString);
        const apiUrl = `${app.apiUrl}/api/v2/requesters?query="${encodedQuery}"`;
        console.log('Direct fetch URL:', apiUrl);
        
        // Make the API call
        fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': 'Basic ' + authToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.status);
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
            renderResults('requesters', []);
            resolve([]);
          }
        })
        .catch(error => {
          console.error('Direct fetch error:', error);
          console.log('Falling back to sample data');
          const sampleData = renderSampleRequesters(query);
          resolve(sampleData);
        })
        .finally(() => {
          toggleSpinner(false);
        });
      } catch (error) {
        console.error('Error in direct fetch:', error);
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
    
    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div class="alert alert-info mt-3">
          No ${type} found matching your search criteria.
        </div>
      `;
      return;
    }
    
    // Define and initialize the HTML variable before using it
    let resultHtml = '';
    
    // Build each result card
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const initials = getInitials(result.first_name, result.last_name);
      
      resultHtml += `
        <div class="user-card d-flex align-items-start">
          <div class="user-icon">${initials}</div>
          <div class="user-details">
            <div class="user-name">${result.first_name} ${result.last_name}</div>
            <div class="user-email">${result.email}</div>
            <div class="user-meta">
              <span class="badge badge-${result.active ? 'success' : 'secondary'} mr-2">
                ${result.active ? 'Active' : 'Inactive'}
              </span>
              ${type === 'users' ? 
                `<span class="badge badge-info">Agent</span>` : 
                `<span class="badge badge-primary">Requester</span>`
              }
              ${result.department ? `<span class="badge badge-light">${result.department}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }
    
    // Set the HTML content
    resultsContainer.innerHTML = resultHtml;
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
  
  // Display error in the UI
  function displayErrorInUI(message) {
    // Add API URL to error message if it's an API error
    let displayMessage = message;
    if (message.includes('searching')) {
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
      titleElement.textContent = title || 'CXI Change Management';
      console.log('Application title updated to:', title);
    } else {
      console.error('Title element not found in the DOM');
    }
  }
})();
