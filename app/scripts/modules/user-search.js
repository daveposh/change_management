/**
 * User Search Service
 * Handles searching users and requesters in Freshservice
 */

export class UserSearchService {
  constructor(apiClient, uiManager) {
    this.apiClient = apiClient;
    this.uiManager = uiManager;
  }

  /**
   * Perform search based on input
   */
  performSearch() {
    console.log('performSearch() called');
    
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) {
      console.error('Search input element not found');
      return this.uiManager.showError('Search input element not found');
    }
    
    const searchTerm = searchInput.value.trim();
    console.log('Search term:', searchTerm);
    
    if (!searchTerm) {
      console.warn('Empty search term');
      return this.uiManager.showError('Please enter a search term');
    }
    
    // Check if API URL and key are configured
    if (!window.app?.config?.apiUrl || !window.app?.config?.apiKey) {
      console.error('API configuration missing');
      
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
      return this.uiManager.showError(errorMessage);
    }
    
    // Show loading spinner
    if (window.app?.toggleSpinner) {
      window.app.toggleSpinner(true);
    }
    
    // Get active tab
    const activeTab = document.querySelector('.nav-link.active');
    if (!activeTab) {
      console.error('No active tab found');
      if (window.app?.toggleSpinner) {
        window.app.toggleSpinner(false);
      }
      return this.uiManager.showError('No active tab found');
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
      const isAdvanced = this.isAdvancedQuery(searchTerm);
      
      // Format the status message based on query type
      if (isAdvanced) {
        statusMsg.innerHTML = `
          Executing advanced query for ${searchType}:<br>
          <code class="text-dark bg-light p-1">${this.escapeHtml(searchTerm)}</code>
        `;
      } else {
        statusMsg.innerHTML = `Searching for ${searchType} matching: <strong>${this.escapeHtml(searchTerm)}</strong>...`;
      }
      
      resultsContainer.appendChild(statusMsg);
    } else {
      console.error(`Results container '${searchType}Results' not found`);
      if (window.app?.toggleSpinner) {
        window.app.toggleSpinner(false);
      }
      return this.uiManager.showError('Results container not found');
    }
    
    // Perform search based on active tab
    const searchPromise = searchType === 'users' ? 
      this.searchUsers(searchTerm) : 
      this.searchRequesters(searchTerm);
    
    // Add a timeout to detect long-running searches
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        // Check if the spinner is still visible after 10 seconds
        const spinner = document.getElementById('spinnerOverlay');
        if (spinner && !spinner.classList.contains('d-none')) {
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
    
    // Run both promises
    Promise.all([searchPromise, timeoutPromise])
      .catch(error => {
        console.error('Error in search operation:', error);
      });
  }

  /**
   * Determine if search term is an advanced query
   */
  isAdvancedQuery(searchTerm) {
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

  /**
   * Search for users via Freshservice API
   */
  searchUsers(query) {
    return new Promise((resolve, reject) => {
      // Check if API URL and key are available
      if (!window.app?.config?.apiUrl || !window.app?.config?.apiKey) {
        console.error('API URL or API Key not configured');
        this.uiManager.showError('API configuration missing. Please check your settings.');
        if (window.app?.toggleSpinner) {
          window.app.toggleSpinner(false);
        }
        return reject(new Error('API configuration missing'));
      }
      
      try {
        // Restore the original working query format for agents
        const queryString = `~[first_name|last_name|email]:'${query}'`;
        const encodedQuery = encodeURIComponent(queryString);
        const apiPath = `/api/v2/agents?query="${encodedQuery}"`;
        
        // Use client.request if available
        if (window.client && window.client.request) {
          console.log('Using client.request.get for API call');
          
          window.client.request.get(apiPath)
            .then(response => {
              // Parse the response JSON
              const data = JSON.parse(response.response);
              return data;
            })
            .then(data => {
              console.log('API response:', data);
              
              if (data && data.agents && Array.isArray(data.agents)) {
                console.log(`Found ${data.agents.length} agents matching the query`);
                // Render results
                this.renderResults('users', data.agents);
                resolve(data.agents);
              } else {
                console.warn('Response contained no agents array:', data);
                
                // Check if data is in a different format
                if (data && Array.isArray(data)) {
                  console.log('Data appears to be an array directly, using as agents');
                  this.renderResults('users', data);
                  resolve(data);
                } else {
                  this.renderResults('users', []);
                  resolve([]);
                }
              }
            })
            .catch(error => {
              console.error('API request failed:', error);
              
              let errorMessage = 'API request failed';
              if (error.status) {
                errorMessage += ` (Status: ${error.status})`;
              }
              if (error.message) {
                errorMessage += `: ${error.message}`;
              }
              
              this.uiManager.showError(errorMessage);
              this.renderResults('users', []);
              resolve([]);
            })
            .finally(() => {
              if (window.app?.toggleSpinner) {
                window.app.toggleSpinner(false);
              }
            });
        } else {
          // Fallback to direct fetch
          console.log('client.request not available, using direct fetch');
          
          const authToken = btoa(window.app.config.apiKey + ':X');
          const apiUrl = window.app.config.apiUrl + apiPath;
          
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
              this.renderResults('users', data.agents);
              resolve(data.agents);
            } else {
              console.warn('Response contained no agents array:', data);
              
              if (data && Array.isArray(data)) {
                console.log('Data appears to be an array directly, using as agents');
                this.renderResults('users', data);
                resolve(data);
              } else {
                this.renderResults('users', []);
                resolve([]);
              }
            }
          })
          .catch(error => {
            console.error('API request failed:', error);
            
            let errorMessage = 'API request failed';
            if (error.status) {
              errorMessage += ` (Status: ${error.status})`;
            }
            if (error.message) {
              errorMessage += `: ${error.message}`;
            }
            
            this.uiManager.showError(errorMessage);
            this.renderResults('users', []);
            resolve([]);
          })
          .finally(() => {
            if (window.app?.toggleSpinner) {
              window.app.toggleSpinner(false);
            }
          });
        }
      } catch (error) {
        console.error('Error in search:', error);
        this.uiManager.showError(`Error making API request: ${error.message}`);
        this.renderResults('users', []);
        if (window.app?.toggleSpinner) {
          window.app.toggleSpinner(false);
        }
        return reject(error);
      }
    });
  }

  /**
   * Search for requesters via Freshservice API
   */
  searchRequesters(query) {
    return new Promise((resolve, reject) => {
      if (!window.app?.config?.apiUrl || !window.app?.config?.apiKey) {
        console.error('API URL or API Key not configured');
        this.uiManager.showError('API configuration missing. Please check your settings.');
        if (window.app?.toggleSpinner) {
          window.app.toggleSpinner(false);
        }
        return reject(new Error('API configuration missing'));
      }
      
      console.log('Searching requesters with query:', query);
      
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
        const apiUrl = window.app.config.apiUrl + apiPath;
        console.log('Requester search URL:', apiUrl);
        
        // Create auth token for direct fetch
        const authToken = btoa(window.app.config.apiKey + ':X');
        
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
            console.error(`Requester search error: ${response.status} ${response.statusText}`);
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
          this.renderResults('requesters', requesters);
          resolve(requesters);
        })
        .catch(error => {
          console.error('Requester search failed:', error);
          this.uiManager.showError(`Error searching requesters: ${error.message}`);
          this.renderResults('requesters', []);
          resolve([]);
        })
        .finally(() => {
          if (window.app?.toggleSpinner) {
            window.app.toggleSpinner(false);
          }
        });
      } catch (error) {
        console.error('Error in requester search:', error);
        this.uiManager.showError(`Error in requester search: ${error.message}`);
        this.renderResults('requesters', []);
        if (window.app?.toggleSpinner) {
          window.app.toggleSpinner(false);
        }
        resolve([]);
      }
    });
  }

  /**
   * Render search results (delegate to app.renderResults)
   */
  renderResults(type, results) {
    if (window.app && typeof window.app.renderResults === 'function') {
      return window.app.renderResults(type, results);
    } else if (this.uiManager && typeof this.uiManager.renderSearchResults === 'function') {
      return this.uiManager.renderSearchResults(type, results);
    } else {
      console.error('No render function available');
    }
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