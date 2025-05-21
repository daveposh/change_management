/**
 * API Client module for Freshservice integration
 * Handles all API requests and authentication
 */

export class ApiClient {
  constructor(configManager) {
    this.configManager = configManager;
    this.endpoints = {};
  }

  /**
   * Initialize API endpoints based on configuration
   */
  initializeEndpoints(apiUrl) {
    if (!apiUrl) return;
    
    this.endpoints = {
      users: `${apiUrl}/api/v2/agents`,
      requesters: `${apiUrl}/api/v2/requesters`,
      groups: `${apiUrl}/api/v2/groups`
    };
    
    console.log('API endpoints initialized:', this.endpoints);
  }

  /**
   * Create a development client for testing
   */
  createDevClient() {
    console.log('Creating real dev client for sandbox testing');
    
    return {
      iparams: {
        get: () => {
          console.log('Dev client: iparams.get called');
          
          // Use URL parameters first if provided
          if (window.__DEV_PARAMS__?.api_url || window.__DEV_PARAMS__?.api_key) {
            console.log('Using configuration from URL parameters');
            const params = {
              api_url: window.__DEV_PARAMS__?.api_url || '',
              api_key: window.__DEV_PARAMS__?.api_key || '',
              app_title: window.__DEV_PARAMS__?.app_title || 'Change Management',
              change_types: window.__DEV_PARAMS__?.change_types || [
                "Standard Change",
                "Emergency Change",
                "Non-Standard Change"
              ]
            };
            
            return Promise.resolve(params);
          }
          
          // Try to load from localStorage
          try {
            const savedData = localStorage.getItem('freshservice_change_management_iparams');
            if (savedData) {
              return Promise.resolve(JSON.parse(savedData));
            }
          } catch (e) {
            console.error('Error reading from localStorage:', e);
          }
          
          // Default config
          return Promise.resolve({
            api_url: '',
            api_key: '',
            app_title: 'Change Management',
            change_types: [
              "Standard Change",
              "Emergency Change",
              "Non-Standard Change"
            ]
          });
        }
      },
      db: {
        set: (key, value) => {
          console.log('Dev client: db.set called with key:', key);
          try {
            localStorage.setItem(key, JSON.stringify(value));
            return Promise.resolve({ Created: true });
          } catch (e) {
            return Promise.reject(e);
          }
        },
        get: (key) => {
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
        get: (url) => {
          // Handle API requests
          return this.makeApiRequest(url);
        }
      }
    };
  }

  /**
   * Make API request to Freshservice
   */
  makeApiRequest(url) {
    // If the URL is a relative path, prepend the configured API URL
    let apiUrl = url;
    
    if (url.startsWith('/')) {
      if (window.app?.config?.apiUrl) {
        apiUrl = window.app.config.apiUrl + url;
      } else {
        return Promise.reject({
          status: 400,
          statusText: 'API URL not configured'
        });
      }
    }
    
    // Check if URL is using example.freshservice.com
    if (apiUrl.includes('example.freshservice.com')) {
      const warningMsg = 'API call using example.freshservice.com detected. This will not work with real data.';
      console.error(warningMsg);
      
      return Promise.reject({
        status: 400,
        statusText: 'Invalid API URL: Using example.freshservice.com placeholder'
      });
    }
    
    // Get API key
    let apiKey = window.app?.config?.apiKey || window.__DEV_PARAMS__?.api_key;
    
    if (!apiKey) {
      try {
        const savedData = localStorage.getItem('freshservice_change_management_iparams');
        if (savedData) {
          const savedIparams = JSON.parse(savedData);
          apiKey = savedIparams.api_key;
        }
      } catch (e) {
        console.error('Error reading API key from storage:', e);
      }
    }
    
    if (!apiKey) {
      return Promise.reject({
        status: 401,
        statusText: 'API key not configured'
      });
    }
    
    // Make the request
    const authToken = btoa(apiKey + ':X');
    
    return fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + authToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
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

  /**
   * Test API credentials with a simple request
   */
  testApiCredentials() {
    if (!window.app?.config?.apiUrl || !window.app?.config?.apiKey) {
      return Promise.reject(new Error('API URL or API Key not configured'));
    }
    
    const apiPath = '/api/v2/agents?per_page=1';
    const fullApiUrl = window.app.config.apiUrl + apiPath;
    const authToken = btoa(window.app.config.apiKey + ':X');
    
    return fetch(fullApiUrl, {
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
    });
  }
} 