/**
 * @jest-environment jsdom
 */

describe('User Search App', () => {
  // Mock the client object
  const mockClient = {
    iparams: {
      get: jest.fn().mockResolvedValue({
        api_url: 'https://test.freshservice.com',
        api_key: 'test-api-key'
      })
    },
    request: {
      get: jest.fn()
    }
  };

  // Mock DOM elements
  beforeEach(() => {
    // Setup document body
    document.body.innerHTML = `
      <div class="container">
        <input type="text" id="searchInput" />
        <button id="searchButton">Search</button>
        <div class="tab-pane active" id="users"></div>
        <div class="tab-pane" id="requesters"></div>
        <div id="usersResults" class="results-container"></div>
        <div id="requestersResults" class="results-container"></div>
        <a class="nav-link active" id="users-tab" href="#users"></a>
        <a class="nav-link" id="requesters-tab" href="#requesters"></a>
        <div id="spinnerOverlay" class="d-none"></div>
      </div>
    `;

    // Mock window.client
    window.client = mockClient;
    
    // Reset mock functions
    jest.clearAllMocks();
  });

  test('initializes the app successfully', () => {
    // Import the app script
    require('../app/scripts/app');
    
    // Wait for DOM content loaded event to be triggered
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);
    
    // Check if iparams.get was called
    expect(mockClient.iparams.get).toHaveBeenCalled();
  });

  test('performs search when button is clicked', () => {
    // Import the app script
    require('../app/scripts/app');
    
    // Trigger DOMContentLoaded
    const domEvent = new Event('DOMContentLoaded');
    document.dispatchEvent(domEvent);
    
    // Set a value in the search input
    const searchInput = document.getElementById('searchInput');
    searchInput.value = 'test';
    
    // Click the search button
    const searchButton = document.getElementById('searchButton');
    searchButton.click();
    
    // Check if request.get was called with the correct parameters
    expect(mockClient.request.get).toHaveBeenCalledWith(
      'https://test.freshservice.com/api/v2/agents?query="name:\'test\' OR email:\'test\'"',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': expect.any(String),
          'Content-Type': 'application/json'
        })
      })
    );
  });

  test('handles empty search input', () => {
    // Import the app script
    require('../app/scripts/app');
    
    // Trigger DOMContentLoaded
    const domEvent = new Event('DOMContentLoaded');
    document.dispatchEvent(domEvent);
    
    // Set an empty value in the search input
    const searchInput = document.getElementById('searchInput');
    searchInput.value = '';
    
    // Spy on console.error
    jest.spyOn(console, 'error');
    
    // Click the search button
    const searchButton = document.getElementById('searchButton');
    searchButton.click();
    
    // Check if console.error was called
    expect(console.error).toHaveBeenCalled();
    
    // Check if request.get was not called
    expect(mockClient.request.get).not.toHaveBeenCalled();
  });

  test('renders user search results', () => {
    // Import the app script
    require('../app/scripts/app');
    
    // Trigger DOMContentLoaded
    const domEvent = new Event('DOMContentLoaded');
    document.dispatchEvent(domEvent);
    
    // Mock successful response
    const mockResponse = {
      response: JSON.stringify({
        agents: [{
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          active: true
        }]
      })
    };
    
    mockClient.request.get.mockResolvedValue(mockResponse);
    
    // Set a value in the search input
    const searchInput = document.getElementById('searchInput');
    searchInput.value = 'John';
    
    // Click the search button
    const searchButton = document.getElementById('searchButton');
    searchButton.click();
    
    // Wait for the promise to resolve
    return new Promise(resolve => {
      setTimeout(() => {
        // Check if the results container was updated
        const resultsContainer = document.getElementById('usersResults');
        expect(resultsContainer.innerHTML).toContain('John Doe');
        expect(resultsContainer.innerHTML).toContain('john.doe@example.com');
        resolve();
      }, 100);
    });
  });
}); 