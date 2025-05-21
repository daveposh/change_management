# Change Management App for Freshservice

A full-page custom app for Freshservice that allows organizations to submit and manage change requests using Freshservice API v2. This app provides a user-friendly interface for submitting change requests with detailed information, implementing change management best practices.

## Features

- User-friendly change request form with the following details:
  - Requester and Agent selection
  - Change title and description fields
  - Change type selection
  - Implementation, backout, and validation plan documentation
  - Planned start and end date/time selection
- Configurable app title through installation parameters
- User search functionality for both agents and requesters
- Modern, responsive Bootstrap-based UI

## Screenshots

*[Screenshots would typically be added here]*

## Setup

### Prerequisites

- Freshservice account with admin access
- Freshworks Developer Kit (FDK) installed

### Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/change-management-app.git
cd change-management-app
```

2. Install dependencies:
```bash
npm install
```

3. Run the app locally:
```bash
fdk run
```

4. Pack the app for deployment:
```bash
fdk pack
```

5. Upload the generated package to your Freshservice account

### Configuration

This app uses a dual configuration approach:

1. **Installation Parameters (iparams.json)**:
   - Configured during app installation through an interactive UI
   - Provides real-time validation of inputs
   - Allows configuration of:
     - **Freshservice API URL** - Your instance URL with domain validation
     - **API Key** - Your Freshservice API key from the admin portal (securely stored)
     - **Application Title** - The title that appears at the top of the app
     - **Available Change Types** - Select which change types will be available in the app

2. **App Settings (app_settings.json)**:
   - Can be updated without republishing the app
   - Configured by administrators through the Freshworks Developer Portal
   - Provides a way to update credentials after installation
   - Perfect for API keys that need to be rotated periodically

For local development, you can test:
- Installation parameters at http://localhost:10001/custom_configs
- App settings at http://localhost:10001/app_settings

Both configurations are automatically validated through client-side scripts (iparams.js) and server-side validation (server.js).

## API Resources

This app uses the following Freshservice API endpoints:

- GET `/api/v2/agents` - To search for users/agents
- GET `/api/v2/requesters` - To search for requesters
- GET `/api/v2/groups` - To fetch implementation groups

For more information on the Freshservice API, refer to the [official documentation](https://api.freshservice.com/v2).

## Development

### Project Structure

```
.
├── app/                # Application code
│   ├── index.html      # Main HTML template
│   ├── scripts/        # JavaScript files
│   │   ├── app.js      # Core app functionality
│   │   ├── change-form.js # Change form specific logic
│   │   └── api-utils.js   # API rate limiting implementation
│   └── styles/         # CSS styles
├── config/             # App configuration
│   └── iparams.json    # Installation parameters definition
├── manifest.json       # App manifest
├── README.md           # This file
└── package.json        # NPM package configuration
```

### Local Development

1. Make changes to the app code as needed
2. Use `fdk run` to test your changes locally
3. Use `fdk validate` to ensure your app meets Freshworks requirements
4. Use `fdk pack` to package the updated app for deployment

### Testing

Run the tests with:

```bash
npm test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2023 [Your Name or Company]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Acknowledgments

- [Bootstrap](https://getbootstrap.com/) - Used for UI components
- [Freshworks App Development](https://developers.freshworks.com/) - Framework and guidelines

## API Rate Limiting

This app implements proper rate limiting for Freshservice API calls to adhere to the [Freshservice API rate limits](https://api.freshservice.com/#rate_limit). The rate limiting mechanism:

1. Queues API requests and processes them according to Freshservice's rate limits
2. Automatically adapts to rate limit information from API response headers
3. Retries requests that exceed rate limits after appropriate wait times
4. Provides transparent fallback mechanisms for different client configurations

The implementation is in `app/scripts/api-utils.js` and is used throughout the application for all API calls.

## Known Issues and Future Improvements

The following code improvements have been addressed for production deployment:

1. Reduce function complexity to meet Freshworks standards (several functions exceed the max complexity of 7)
2. Replace direct API calls with client.request pattern ✓
3. Fix potential race conditions in asynchronous code ✓
4. Address deprecated API usage ✓
5. Implement proper API rate limiting ✓

For detailed information about any remaining issues, run `fdk validate` to see the full list of warnings.

# Freshservice Change Management App

A modular application for Freshservice that improves change management workflow and user searching capabilities.

## Development Architecture

This project uses a modern ES modules architecture with the following components:

- `app/scripts/modules/` - Contains modular JavaScript classes
- `app/scripts/app.js` - Main entry point (ES modules version)
- `app/scripts/app-legacy.js` - Non-module version for FDK validation

## FDK Validation and Packaging

### Handling ES Modules in FDK

The Freshworks Developer Kit (FDK) has limitations with ES modules. To work around this:

1. We maintain modern ES module code in the main codebase
2. A separate validation-friendly build is created for FDK validation and packaging
3. The `validate.bat` script automates this process

### Validation Process

To validate and package the app:

```
npm run validate   # Run validation only
npm run pack       # Run validation and create distributable package
```

The `validate.bat` script:
1. Creates a build directory with non-module versions of files
2. Fixes HTML to use traditional script loading
3. Creates required FDK files (config/iparams.json, icon.svg)
4. Runs FDK validation
5. Packages the app, skipping code coverage requirements

### Warnings and Test Coverage

The FDK validation shows warnings related to code complexity and potential race conditions. For production deployment to the Freshworks Marketplace, you should:

1. Address all warnings in the main codebase
2. Create proper tests to achieve 80%+ code coverage
3. Use `fdk pack` without the `-s` flag to validate test coverage

## Deployment

For production deployment:

1. Run `npm run pack` to create the package
2. The app package will be available as `build.zip` in the root directory
3. Upload this file to the Freshworks Marketplace

## Known Issues

- Test coverage is currently below the 80% requirement for Marketplace submission
- There are complexity warnings that should be addressed for production code
