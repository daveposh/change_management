/**
 * Server script for Change Management app
 */

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
      // Validate API URL if present
      if (settings.api_url) {
        try {
          new URL(settings.api_url);
        } catch (e) {
          console.error('Invalid API URL format:', settings.api_url);
          return renderData(null, { 
            status: 400, 
            message: 'Invalid API URL format. Please provide a valid URL (e.g., https://company.freshservice.com)'
          });
        }
      }
      
      // Validate that API key is provided and not empty when being set
      if (settings.api_key !== undefined && (settings.api_key === null || settings.api_key.trim() === '')) {
        console.error('API key is required');
        return renderData(null, { 
          status: 400, 
          message: 'API key is required and cannot be empty'
        });
      }
      
      // All validations passed
      console.log('App settings validation successful');
      return renderData({ success: true });
    } catch (error) {
      console.error('Error validating app settings:', error);
      return renderData(null, { 
        status: 500, 
        message: 'Error validating app settings: ' + error.message
      });
    }
  }
}; 