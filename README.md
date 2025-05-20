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
│   │   └── change-form.js # Change form specific logic
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

## Known Issues and Future Improvements

The following code improvements should be addressed before production deployment:

1. Reduce function complexity to meet Freshworks standards (several functions exceed the max complexity of 7)
2. Replace direct API calls with client.request pattern
3. Fix potential race conditions in asynchronous code
4. Address deprecated API usage

For detailed information about these issues, run `fdk validate` to see the full list of warnings.
