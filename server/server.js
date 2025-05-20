/**
 * Server script for Change Management app
 */

/**
 * Validates API URL format
 * @param {string} url - The URL to validate
 * @returns {Object|null} Error object or null if valid
 */
function validateApiUrl(url) {
  if (!url) return null;
  
  try {
    new URL(url);
    return null;
  } catch (e) {
    console.error('Invalid API URL format:', url);
    return { 
      status: 400, 
      message: 'Invalid API URL format. Please provide a valid URL (e.g., https://company.freshservice.com)'
    };
  }
}

/**
 * Validates API key
 * @param {string} apiKey - The API key to validate
 * @returns {Object|null} Error object or null if valid
 */
function validateApiKey(apiKey) {
  if (apiKey === undefined) return null;
  
  if (apiKey === null || apiKey.trim() === '') {
    console.error('API key is required');
    return { 
      status: 400, 
      message: 'API key is required and cannot be empty'
    };
  }
  return null;
}

exports = {
  /**
   * This method gets triggered when the app settings are updated
   * @param {Object} args - Arguments object with the updated app settings
   */
  onSettingsUpdate: function(args) {
    console.log('onSettingsUpdate invoked with following data:', args);
    
    // Initialize settings to empty object if undefined to prevent errors
    const settings = args.settings || {};
    
    try {
      // Validate components
      const urlError = validateApiUrl(settings.api_url);
      if (urlError) {
        return { 
          status: urlError.status, 
          message: urlError.message 
        };
      }
      
      const apiKeyError = validateApiKey(settings.api_key);
      if (apiKeyError) {
        return { 
          status: apiKeyError.status, 
          message: apiKeyError.message 
        };
      }
      
      // All validations passed
      console.log('App settings validation successful');
      return { success: true };
    } catch (error) {
      console.error('Error validating app settings:', error);
      return { 
        status: 500, 
        message: 'Error validating app settings: ' + error.message
      };
    }
  }
}; 