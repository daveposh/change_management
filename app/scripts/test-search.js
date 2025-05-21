/**
 * Test file for the user search functionality
 */

import { ConfigManager } from './modules/config-manager.js';
import { ApiClient } from './modules/api-client.js';
import { UIManager } from './modules/ui-manager.js';
import { UserSearchService } from './modules/user-search.js';

// Function to test user search
function testUserSearch() {
  console.log('Testing user search...');
  
  // Initialize configuration
  const configManager = new ConfigManager();
  
  // Initialize API client
  const apiClient = new ApiClient(configManager);
  
  // Initialize UI manager
  const uiManager = new UIManager(configManager);
  
  // Initialize user search service
  const userSearchService = new UserSearchService(apiClient, uiManager);
  
  // Set search parameters from URL if provided
  const urlParams = new URLSearchParams(window.location.search);
  const apiUrl = urlParams.get('api_url');
  const apiKey = urlParams.get('api_key');
  
  if (apiUrl && apiKey) {
    // Set configuration manually for testing
    configManager.setConfig({
      apiUrl: configManager.formatApiUrl(apiUrl),
      apiKey: apiKey,
      appTitle: 'User Search Test'
    });
    
    // Update API endpoints
    apiClient.initializeEndpoints(configManager.apiUrl);
    
    // Log configuration
    console.log('Test configuration:', {
      apiUrl: configManager.apiUrl,
      hasApiKey: !!configManager.apiKey
    });
    
    // Attach to global app object for testing
    window.app = {
      config: configManager,
      api: apiClient,
      ui: uiManager,
      search: userSearchService,
      toggleSpinner: function() {}
    };
    
    // Show test UI
    showTestUI();
  } else {
    // Show configuration instructions
    showConfigInstructions();
  }
}

// Add test UI to the page
function showTestUI() {
  const container = document.querySelector('.container');
  if (!container) return;
  
  // Create test UI
  const testUI = document.createElement('div');
  testUI.className = 'card mt-4';
  testUI.innerHTML = `
    <div class="card-header">
      <h3>User Search Test</h3>
    </div>
    <div class="card-body">
      <div class="form-group">
        <label for="searchInput">Search Query</label>
        <input type="text" class="form-control" id="searchInput" placeholder="Enter search term...">
      </div>
      <button id="searchButton" class="btn btn-primary">Search Users</button>
      <button id="searchRequestersButton" class="btn btn-secondary ml-2">Search Requesters</button>
      
      <div class="mt-4">
        <ul class="nav nav-tabs" id="searchTabs">
          <li class="nav-item">
            <a class="nav-link active" id="users-tab" data-toggle="tab" href="#users">Users</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" id="requesters-tab" data-toggle="tab" href="#requesters">Requesters</a>
          </li>
        </ul>
        <div class="tab-content mt-2">
          <div class="tab-pane fade show active" id="users">
            <div id="usersResults"></div>
          </div>
          <div class="tab-pane fade" id="requesters">
            <div id="requestersResults"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add to page
  container.appendChild(testUI);
  
  // Add event listeners
  document.getElementById('searchButton').addEventListener('click', function() {
    // Switch to Users tab
    document.getElementById('users-tab').click();
    // Search users
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value.trim()) {
      window.app.search.searchUsers(searchInput.value.trim());
    }
  });
  
  document.getElementById('searchRequestersButton').addEventListener('click', function() {
    // Switch to Requesters tab
    document.getElementById('requesters-tab').click();
    // Search requesters
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value.trim()) {
      window.app.search.searchRequesters(searchInput.value.trim());
    }
  });
}

// Show configuration instructions
function showConfigInstructions() {
  const container = document.querySelector('.container');
  if (!container) return;
  
  // Create instructions UI
  const instructionsUI = document.createElement('div');
  instructionsUI.className = 'card mt-4';
  instructionsUI.innerHTML = `
    <div class="card-header">
      <h3>User Search Test - Configuration Required</h3>
    </div>
    <div class="card-body">
      <div class="alert alert-info">
        <p>Please add the following parameters to the URL to test the search functionality:</p>
        <code>?api_url=yourdomain.freshservice.com&api_key=your_api_key</code>
      </div>
      
      <div class="form-group">
        <label for="configApiUrl">Freshservice Domain</label>
        <input type="text" class="form-control" id="configApiUrl" placeholder="yourdomain.freshservice.com">
      </div>
      
      <div class="form-group">
        <label for="configApiKey">API Key</label>
        <input type="text" class="form-control" id="configApiKey" placeholder="Your API key">
      </div>
      
      <button id="applyConfigButton" class="btn btn-primary">Apply Configuration</button>
    </div>
  `;
  
  // Add to page
  container.appendChild(instructionsUI);
  
  // Add event listener for apply button
  document.getElementById('applyConfigButton').addEventListener('click', function() {
    const apiUrl = document.getElementById('configApiUrl').value.trim();
    const apiKey = document.getElementById('configApiKey').value.trim();
    
    if (apiUrl && apiKey) {
      // Redirect with parameters
      window.location.href = `?api_url=${encodeURIComponent(apiUrl)}&api_key=${encodeURIComponent(apiKey)}`;
    }
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', testUserSearch); 