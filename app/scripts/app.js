/**
 * User Search App for Freshservice
 * 
 * Allows searching users and requesters by name or email
 * using the Freshservice API v2
 * 
 * This file acts as an entry point that provides backwards compatibility.
 */

// Set module loading indicator for compatibility detection
window.__MODULES_LOADED__ = true;

// Import modules directly instead of through index.js
import { ApiClient } from './modules/api-client.js';
import { ConfigManager } from './modules/config-manager.js';
import { UIManager } from './modules/ui-manager.js';
import { UserSearchService } from './modules/user-search.js';

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

// For backward compatibility, keep basic spinner functionality
document.addEventListener('DOMContentLoaded', function() {
  const spinner = document.getElementById('spinnerOverlay');
  if (spinner) {
    console.log('Forcibly hiding spinner overlay from app.js');
    spinner.classList.add('d-none');
  }
  
  // Set a timeout to ensure spinner is hidden even if there are errors
  setTimeout(() => {
    const spinner = document.getElementById('spinnerOverlay');
    if (spinner) spinner.classList.add('d-none');
  }, 3000);

  // Initialize the app
  initializeApp();
});

// Initialize the app
function initializeApp() {
  console.log('Initializing app from app.js entry point...');
  
  // Show the loading indicator - but with timeout protection
  toggleSpinner(true);
  setTimeout(() => toggleSpinner(false), 5000); // Force hide after 5 seconds
  
  // Initialize configuration manager
  const configManager = new ConfigManager();
  
  // Initialize API client
  const apiClient = new ApiClient(configManager);
  
  // Initialize UI manager
  const uiManager = new UIManager(configManager);
  
  // Initialize user search service
  const userSearchService = new UserSearchService(apiClient, uiManager);
  
  // Attach services to global app object
  window.app = {
    config: configManager,
    api: apiClient,
    ui: uiManager,
    search: userSearchService,
    
    // Exposed methods for external components
    toggleSpinner,
    searchUsers: (...args) => userSearchService.searchUsers(...args),
    searchRequesters: (...args) => userSearchService.searchRequesters(...args),
    performSearch: () => userSearchService.performSearch(),
    updateAppTitle: (title) => uiManager.updateAppTitle(title),
    
    // Render search results globally for change-form.js
    renderResults: (type, results) => uiManager.renderSearchResults(type, results)
  };
  
  // Initialize the client
  initializeClient();
}

// Initialize Freshworks client
function initializeClient() {
  const clientInitTimeout = setTimeout(() => {
    console.warn('Client initialization taking too long, using fallback');
    initializeFallback();
  }, 3000);
  
  try {
    if (typeof client !== 'undefined') {
      client.initialized()
        .then(function() {
          clearTimeout(clientInitTimeout);
          console.log('Freshworks Client initialized');
          onClientReady(client);
        })
        .catch(function(error) {
          clearTimeout(clientInitTimeout);
          console.error('Failed to initialize Freshworks client:', error);
          initializeFallback();
        });
    } else {
      console.warn('Client object not defined, using fallback');
      initializeFallback();
    }
  } catch (error) {
    console.error('Error initializing client:', error);
    initializeFallback();
  }
}

// Fallback client initialization
function initializeFallback() {
  console.log('Using initialization fallback methods');
  
  if (window.client) {
    console.log('Client already available in window.client');
    onClientReady(window.client);
    return;
  }
  
  if (typeof apploader !== 'undefined' && apploader._client) {
    console.log('Using apploader._client');
    window.client = apploader._client;
    onClientReady(apploader._client);
    return;
  }
  
  console.log('Creating client with saved settings');
  const devClient = app.api.createDevClient();
  window.client = devClient;
  onClientReady(devClient);
}

// Handle client ready state
function onClientReady(client) {
  if (window.app && window.app.initialized) {
    console.log('App already initialized, skipping initialization');
    return;
  }
  
  console.log('Client ready, initializing app features');
  window.app.client = client;
  window.app.initialized = true;
  
  // Initialize configuration
  app.config.initializeConfig(client);
  
  // Setup UI components
  app.ui.setupUI();
  
  // Hide spinner
  toggleSpinner(false);
  
  // Run diagnostics after a delay
  setTimeout(() => app.ui.runDiagnostics(), 2000);
}

// Make necessary functions available globally
window.updateAppTitle = (title) => {
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
