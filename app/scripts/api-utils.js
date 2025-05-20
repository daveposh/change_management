/**
 * API Utilities for Freshservice API
 * Handles rate limiting and API request management
 */

// Rate limiting configuration for Freshservice API
const rateLimiter = {
  // Configuration based on Freshservice API rate limits
  maxRequestsPerMinute: 50, // Default value, will be updated from headers if available
  requestsInCurrentWindow: 0,
  windowStartTime: Date.now(),
  queue: [],
  processing: false,
  
  // Store rate limit information from API responses
  rateInfo: {
    limit: 50,             // X-Ratelimit-Total
    remaining: 50,         // X-Ratelimit-Remaining
    resetTime: null,       // X-Ratelimit-Reset (Unix timestamp)
  },
  
  // Process the next request in the queue
  processQueue: function() {
    if (this.queue.length === 0 || this.processing) {
      return;
    }
    
    // Mark as processing to prevent concurrent processing
    this.processing = true;
    
    // Check if we need to wait for the rate limit to reset
    const now = Date.now();
    
    // If we have rate info from headers and no requests remaining
    if (this.rateInfo.remaining <= 0 && this.rateInfo.resetTime) {
      const waitTime = (this.rateInfo.resetTime * 1000) - now;
      
      if (waitTime > 0) {
        console.log(`Rate limit reached. Waiting ${waitTime}ms for reset.`);
        setTimeout(() => {
          // Reset counter and process next request
          this.requestsInCurrentWindow = 0;
          this.processing = false;
          this.processQueue();
        }, waitTime + 100); // Add 100ms buffer
        return;
      }
    }
    
    // If it's been more than a minute since the window started, reset the counter
    if (now - this.windowStartTime >= 60000) {
      this.requestsInCurrentWindow = 0;
      this.windowStartTime = now;
    }
    
    // Check if we've hit the rate limit
    if (this.requestsInCurrentWindow >= this.maxRequestsPerMinute) {
      const waitTime = 60000 - (now - this.windowStartTime);
      
      if (waitTime > 0) {
        console.log(`Rate limit reached. Waiting ${waitTime}ms before next request.`);
        setTimeout(() => {
          // Reset counter and process next request
          this.requestsInCurrentWindow = 0;
          this.windowStartTime = now;
          this.processing = false;
          this.processQueue();
        }, waitTime + 100); // Add 100ms buffer
        return;
      } else {
        // Reset for a new minute window
        this.requestsInCurrentWindow = 0;
        this.windowStartTime = now;
      }
    }
    
    // Get the next request
    const nextRequest = this.queue.shift();
    
    // Execute the request
    this.requestsInCurrentWindow++;
    
    // Execute the actual request
    nextRequest.execute()
      .then(response => {
        // Update rate limit info if available in headers
        this.updateRateLimitInfo(response);
        nextRequest.resolve(response);
      })
      .catch(error => {
        // Handle rate limit errors (429 Too Many Requests)
        if (error.status === 429) {
          console.warn('Rate limit exceeded according to API response');
          
          // Try to get reset time from response headers
          let retryAfter = 60; // Default to 60 seconds if header not available
          
          if (error.response && error.response.headers) {
            // Get Retry-After header if available
            const retryHeader = error.response.headers.get('Retry-After');
            if (retryHeader) {
              retryAfter = parseInt(retryHeader, 10);
            }
          }
          
          console.log(`API rate limit exceeded. Retrying after ${retryAfter} seconds.`);
          
          // Add the request back to the front of the queue
          this.queue.unshift(nextRequest);
          
          // Wait for the specified time
          setTimeout(() => {
            this.processing = false;
            this.processQueue();
          }, retryAfter * 1000);
        } else {
          // For other errors, reject the promise
          nextRequest.reject(error);
          
          // Continue processing the queue
          this.processing = false;
          this.processQueue();
        }
      })
      .finally(() => {
        if (this.queue.length > 0) {
          // If we have more requests, process the next one with a slight delay
          setTimeout(() => {
            this.processing = false;
            this.processQueue();
          }, 100); // Small delay between requests to avoid overwhelming the API
        } else {
          // No more requests in the queue
          this.processing = false;
        }
      });
  },
  
  // Update rate limit information from response headers
  updateRateLimitInfo: function(response) {
    if (response && response.headers) {
      const limit = response.headers.get('X-Ratelimit-Total');
      const remaining = response.headers.get('X-Ratelimit-Remaining');
      const resetTime = response.headers.get('X-Ratelimit-Reset');
      
      if (limit !== null) {
        this.rateInfo.limit = parseInt(limit, 10);
        this.maxRequestsPerMinute = this.rateInfo.limit;
      }
      
      if (remaining !== null) {
        this.rateInfo.remaining = parseInt(remaining, 10);
      }
      
      if (resetTime !== null) {
        this.rateInfo.resetTime = parseInt(resetTime, 10);
      }
      
      console.log(`API Rate Limit - Limit: ${this.rateInfo.limit}, Remaining: ${this.rateInfo.remaining}`);
    }
  },
  
  // Add a request to the queue
  enqueue: function(executeFunction) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        execute: executeFunction,
        resolve,
        reject
      });
      
      // Start processing the queue if not already processing
      if (!this.processing) {
        this.processQueue();
      }
    });
  }
};

/**
 * Rate-limited version of client.request.get
 * @param {Object} client - The Freshworks client
 * @param {string} url - The URL to request
 * @param {Object} options - Request options
 * @returns {Promise} - Promise resolving to the API response
 */
function rateLimit(client, method, url, options = {}) {
  if (!client || !client.request || typeof client.request[method] !== 'function') {
    return Promise.reject(new Error(`Invalid client or method: ${method}`));
  }
  
  return rateLimiter.enqueue(() => {
    return client.request[method](url, options);
  });
}

/**
 * Rate-limited fetch API (fallback when client.request is unavailable)
 * @param {string} url - The URL to request
 * @param {Object} options - Fetch options
 * @returns {Promise} - Promise resolving to the API response
 */
function rateLimitedFetch(url, options = {}) {
  return rateLimiter.enqueue(() => {
    // First try to use client.request if available
    if (window.client && window.client.request && window.client.request.get) {
      const method = options.method ? options.method.toLowerCase() : 'get';
      // Extract the path from the full URL
      let path = url;
      
      // If this is a full URL, extract just the path portion
      if (url.startsWith('http')) {
        try {
          const urlObj = new URL(url);
          path = urlObj.pathname + urlObj.search;
        } catch (e) {
          console.warn('Could not parse URL:', url);
        }
      }
      
      // Convert options to client.request format
      const clientOptions = {
        headers: options.headers || {}
      };
      
      if (options.body) {
        try {
          // Assume JSON body if content-type is application/json
          if (options.headers && options.headers['Content-Type'] === 'application/json') {
            clientOptions.body = typeof options.body === 'string' ? 
              JSON.parse(options.body) : options.body;
          } else {
            clientOptions.body = options.body;
          }
        } catch (e) {
          console.warn('Could not parse request body:', e);
          clientOptions.body = options.body;
        }
      }
      
      // Use the appropriate method from client.request
      return window.client.request[method](path, clientOptions)
        .then(response => {
          // Return a response object in a consistent format
          return {
            status: response.status,
            headers: response.headers || new Headers(),
            response: response.response,
            options: options
          };
        });
    }
    
    // Fallback to fetch if client.request is not available
    return fetch(url, options).then(response => {
      // Extract headers for rate limit info and update rate limiter
      if (response.headers) {
        rateLimiter.updateRateLimitInfo({
          headers: response.headers
        });
      }
      
      // Create a response object that mimics the client.request format
      const enhancedResponse = {
        status: response.status,
        headers: response.headers,
        response: null,
        options: options
      };
      
      // Parse JSON response if applicable
      if (response.status !== 204) { // No content
        return response.json()
          .then(data => {
            enhancedResponse.response = data;
            return enhancedResponse;
          })
          .catch(() => {
            // If JSON parsing fails, return the response as is
            return enhancedResponse;
          });
      }
      
      return enhancedResponse;
    });
  });
}

// Export the utilities
window.apiUtils = {
  get: function(client, url, options) {
    return rateLimit(client, 'get', url, options);
  },
  post: function(client, url, options) {
    return rateLimit(client, 'post', url, options);
  },
  put: function(client, url, options) {
    return rateLimit(client, 'put', url, options);
  },
  delete: function(client, url, options) {
    return rateLimit(client, 'delete', url, options);
  },
  fetch: rateLimitedFetch,
  getRateLimitInfo: function() {
    return { ...rateLimiter.rateInfo };
  }
}; 