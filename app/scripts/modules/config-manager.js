/**
 * Configuration Manager
 * Handles loading, saving, and managing app configuration
 */

export class ConfigManager {
  constructor() {
    this.apiUrl = '';
    this.apiKey = '';
    this.appTitle = 'Change Management';
    this.changeTypes = [
      "Standard Change",
      "Emergency Change",
      "Non-Standard Change"
    ];
    
    // Load any URL parameters
    this.loadUrlParameters();
  }

  /**
   * Load parameters from URL
   */
  loadUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Store developer mode
    window.__DEV_MODE__ = window.location.href.includes('localhost') || 
                          window.location.hostname.includes('127.0.0.1') ||
                          urlParams.get('dev') === 'true';
    
    // Store parameters from URL
    window.__DEV_PARAMS__ = window.__DEV_PARAMS__ || {};
    
    if (urlParams.get('api_url')) {
      window.__DEV_PARAMS__.api_url = urlParams.get('api_url');
    }
    
    if (urlParams.get('api_key')) {
      window.__DEV_PARAMS__.api_key = urlParams.get('api_key');
    }
    
    if (urlParams.get('app_title')) {
      window.__DEV_PARAMS__.app_title = urlParams.get('app_title');
    }
    
    if (window.__DEV_MODE__) {
      console.log('Development mode active');
    }
  }

  /**
   * Initialize configuration from various sources
   */
  initializeConfig(client) {
    console.log('Initializing configuration');
    
    // First try URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const apiUrlParam = urlParams.get('api_url');
    const apiKeyParam = urlParams.get('api_key');
    
    if (apiUrlParam && apiKeyParam) {
      console.log('Using configuration from URL parameters');
      this.setConfig({
        apiUrl: this.formatApiUrl(apiUrlParam),
        apiKey: apiKeyParam,
        appTitle: urlParams.get('app_title') || 'Change Management'
      });
      return;
    }
    
    // Try iparams
    this.loadConfigFromIparams(client)
      .then(found => {
        if (!found) {
          // Try data storage
          return this.loadConfigFromStorage(client);
        }
        return found;
      })
      .then(found => {
        if (!found) {
          // Try localStorage
          return this.loadConfigFromLocalStorage();
        }
        return found;
      })
      .then(found => {
        if (!found) {
          console.warn('No valid configuration found, using defaults');
          // Empty default config
          this.setConfig({
            apiUrl: '',
            apiKey: '',
            appTitle: 'Change Management'
          });
        }
      });
  }

  /**
   * Format API URL to ensure it has http/https prefix
   */
  formatApiUrl(url) {
    if (!url) return '';
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url;
    }
    
    return url;
  }

  /**
   * Set configuration and update app state
   */
  setConfig(config) {
    this.apiUrl = config.apiUrl || '';
    this.apiKey = config.apiKey || '';
    this.appTitle = config.appTitle || 'Change Management';
    this.changeTypes = config.changeTypes || this.changeTypes;
    
    // Update app state
    if (window.app) {
      // Initialize API endpoints
      if (window.app.api) {
        window.app.api.initializeEndpoints(this.apiUrl);
      }
      
      // Update app title
      if (window.app.ui) {
        window.app.ui.updateAppTitle(this.appTitle);
      } else if (window.updateAppTitle) {
        window.updateAppTitle(this.appTitle);
      }
      
      // Save working config to storage
      this.saveConfigToStorage(window.client);
    }
  }

  /**
   * Load configuration from iparams
   */
  loadConfigFromIparams(client) {
    return new Promise(resolve => {
      if (!client || !client.iparams || typeof client.iparams.get !== 'function') {
        console.warn('client.iparams.get not available, skipping');
        return resolve(false);
      }
      
      client.iparams.get()
        .then(params => {
          if (params && params.api_url) {
            // Verify it's not the example domain
            if (params.api_url.includes('example.freshservice.com')) {
              console.warn('Found example domain in iparams, skipping');
              return resolve(false);
            }
            
            this.setConfig({
              apiUrl: this.formatApiUrl(params.api_url),
              apiKey: params.api_key,
              appTitle: params.app_title || 'Change Management',
              changeTypes: params.change_types || this.changeTypes
            });
            
            return resolve(true);
          }
          return resolve(false);
        })
        .catch(err => {
          console.error('Error loading from iparams:', err);
          return resolve(false);
        });
    });
  }

  /**
   * Load configuration from client.db storage
   */
  loadConfigFromStorage(client) {
    return new Promise(resolve => {
      if (!client || !client.db) {
        console.warn('client.db not available, skipping');
        return resolve(false);
      }
      
      client.db.get('app_config')
        .then(config => {
          if (config && config.apiUrl) {
            // Verify it's not the example domain
            if (config.apiUrl.includes('example.freshservice.com')) {
              console.warn('Found example domain in storage, skipping');
              return resolve(false);
            }
            
            this.setConfig({
              apiUrl: this.formatApiUrl(config.apiUrl),
              apiKey: config.apiKey,
              appTitle: config.appTitle || 'Change Management',
              changeTypes: config.changeTypes || this.changeTypes
            });
            
            return resolve(true);
          }
          return resolve(false);
        })
        .catch(err => {
          console.error('Error loading from storage:', err);
          return resolve(false);
        });
    });
  }

  /**
   * Load configuration from localStorage
   */
  loadConfigFromLocalStorage() {
    return new Promise(resolve => {
      try {
        const savedData = localStorage.getItem('freshservice_change_management_iparams');
        if (savedData) {
          const config = JSON.parse(savedData);
          
          if (config && config.api_url && !config.api_url.includes('example.freshservice.com')) {
            this.setConfig({
              apiUrl: this.formatApiUrl(config.api_url),
              apiKey: config.api_key,
              appTitle: config.app_title || 'Change Management',
              changeTypes: config.change_types || this.changeTypes
            });
            
            return resolve(true);
          }
        }
      } catch (e) {
        console.error('Error reading from localStorage:', e);
      }
      
      return resolve(false);
    });
  }

  /**
   * Save configuration to storage
   */
  saveConfigToStorage(client) {
    if (!client || !client.db) {
      console.warn('client.db not available, saving to localStorage');
      try {
        localStorage.setItem('freshservice_change_management_iparams', JSON.stringify({
          api_url: this.apiUrl,
          api_key: this.apiKey,
          app_title: this.appTitle,
          change_types: this.changeTypes
        }));
      } catch (e) {
        console.error('Error saving to localStorage:', e);
      }
      return;
    }
    
    client.db.set('app_config', {
      apiUrl: this.apiUrl,
      apiKey: this.apiKey,
      appTitle: this.appTitle,
      changeTypes: this.changeTypes
    })
    .then(() => console.log('Config saved to data storage'))
    .catch(err => console.error('Error saving config to data storage:', err));
  }
} 