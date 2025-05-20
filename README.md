# Freshservice User Search App

A full-page custom app for Freshservice that allows searching for users and requesters by name or email address, using the Freshservice API v2.

## Features

- Search for users (agents) by name or email
- Search for requesters by name or email
- Toggle between users and requesters tab
- Modern and responsive UI
- Displays user details including status

## Setup

1. Make sure you have the Freshworks Developer Kit (FDK) installed
2. Clone this repository
3. Run `fdk run` to test the app locally
4. Use `fdk pack` to package the app for deployment

## Installation Parameters

During installation, the app requires the following parameters:

- **Freshservice API URL** - Your Freshservice instance URL (e.g., https://yourcompany.freshservice.com)
- **API Key** - Your Freshservice API key

## API Resources

This app uses the following Freshservice API endpoints:

- GET `/api/v2/agents` - To search for users
- GET `/api/v2/requesters` - To search for requesters

For more information on the Freshservice API, refer to the [official documentation](https://api.freshservice.com/v2).

## Development

To make changes to the app:

1. Modify the HTML, CSS, and JavaScript files as needed
2. Run `fdk run` to test your changes
3. Use `fdk validate` to ensure your app meets Freshworks requirements
4. Use `fdk pack` to package the updated app

## License

This project is licensed under the MIT License
