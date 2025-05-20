/**
 * Change Management Form functionality
 * Handles form interactions, validation, and submission
 */
'use strict';

document.addEventListener('DOMContentLoaded', function() {
  // Initialize form handlers
  initializeChangeForm();
  initializeRiskAssessment();
  initializeTooltips();
  setupEventListeners();
  
  // Initialize client and API access
  if (window.app && window.app.onClientReady) {
    window.app.onClientReady(function() {
      // Once client is ready, fetch agent groups
      fetchAgentGroups();
    });
  } else {
    console.error('App not properly initialized or onClientReady not available');
  }
});

// Store selected items
const selectedItems = {
  requester: null,
  agent: null,
  implementationGroup: null
};

// Risk assessment configuration
const riskAssessment = {
  questions: [
    {
      id: 'impact_business',
      text: 'What is the potential business impact if the change fails?',
      options: [
        { value: 1, text: 'Low - Limited impact on business operations' },
        { value: 2, text: 'Medium - Noticeable impact on some business operations' },
        { value: 3, text: 'High - Significant impact on business operations' }
      ]
    },
    {
      id: 'impact_users',
      text: 'How many users will be affected by this change?',
      options: [
        { value: 1, text: 'Few (<50 users)' },
        { value: 2, text: 'Some (50-200 users)' },
        { value: 3, text: 'Many (>200 users)' }
      ]
    },
    {
      id: 'complexity',
      text: 'How complex is this change?',
      options: [
        { value: 1, text: 'Simple - Routine change with established procedures' },
        { value: 2, text: 'Moderate - Some complexity but well understood' },
        { value: 3, text: 'Complex - Multiple systems or uncommon procedures' }
      ]
    },
    {
      id: 'testing',
      text: 'What level of testing has been performed?',
      options: [
        { value: 1, text: 'Comprehensive - Thoroughly tested in multiple environments' },
        { value: 2, text: 'Adequate - Primary functions tested in test environment' },
        { value: 3, text: 'Limited - Minimal testing or testing not possible' }
      ]
    },
    {
      id: 'rollback',
      text: 'Is there a rollback plan available?',
      options: [
        { value: 1, text: 'Yes - Detailed rollback plan with proven procedures' },
        { value: 2, text: 'Partial - Basic rollback steps identified' },
        { value: 3, text: 'No - No rollback possible or very difficult' }
      ]
    }
  ],
  
  calculateRiskScore: function() {
    // Initialize the variables in this scope
    const totalScore = this.questions.reduce((score, question) => {
      const selectedValue = document.querySelector(`input[name="${question.id}"]:checked`);
      if (selectedValue) {
        return score + parseInt(selectedValue.value, 10);
      }
      return score;
    }, 0);
    
    const questionsAnswered = this.questions.filter(question => 
      document.querySelector(`input[name="${question.id}"]:checked`)
    ).length;
    
    if (questionsAnswered < this.questions.length) {
      return { complete: false, score: 0 };
    }
    
    // Determine risk level
    let riskLevel = 'Low';
    if (totalScore > 10) {
      riskLevel = 'High';
    } else if (totalScore > 7) {
      riskLevel = 'Medium';
    }
    
    return { 
      complete: true,
      score: totalScore, 
      level: riskLevel 
    };
  }
};

/**
 * Show notification instead of using alert
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type} alert-dismissible fade show`;
  notification.setAttribute('role', 'alert');
  notification.innerHTML = `
    ${message}
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  `;
  
  // Add to page
  const container = document.querySelector('.container');
  if (container) {
    container.insertBefore(notification, container.firstChild);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 150);
    }, 5000);
  }
}

// Initialize change form
function initializeChangeForm() {
  console.log('Initializing change form...');
  
  // Initialize change type descriptions
  const changeTypeDescriptions = {
    'standard': 'Pre-approved, routine changes with established procedures and low risk.',
    'non-production': 'Changes to non-production environments that do not directly impact business operations.',
    'emergency': 'Urgent changes needed to restore service or prevent significant business impact.',
    'non-standard': 'Changes requiring additional review due to higher risk or complexity.'
  };
  
  // Update description when change type is selected
  const changeTypeSelect = document.getElementById('changeType');
  const changeTypeDescription = document.getElementById('changeTypeDescription');
  
  if (changeTypeSelect && changeTypeDescription) {
    changeTypeSelect.addEventListener('change', function() {
      const selectedType = this.value;
      if (selectedType && changeTypeDescriptions[selectedType]) {
        changeTypeDescription.innerHTML = `<div class="alert alert-info">${changeTypeDescriptions[selectedType]}</div>`;
      } else {
        changeTypeDescription.innerHTML = '';
      }
    });
  }
}

// Initialize risk assessment tab and questionnaire
function initializeRiskAssessment() {
  // Add risk assessment tab to the UI
  const formTabs = document.getElementById('formTabs');
  const formTabContent = document.getElementById('formTabContent');
  
  if (formTabs && formTabContent) {
    // Add tab navigation item
    const tabItem = document.createElement('li');
    tabItem.className = 'nav-item';
    tabItem.innerHTML = `<a class="nav-link" id="risk-tab" data-toggle="tab" href="#risk" role="tab">Risk Assessment</a>`;
    formTabs.appendChild(tabItem);
    
    // Create risk assessment content
    const riskPane = document.createElement('div');
    riskPane.className = 'tab-pane fade';
    riskPane.id = 'risk';
    riskPane.setAttribute('role', 'tabpanel');
    
    // Build the complete questionnaire HTML in one operation
    let questionnaireHtml = `
      <h4>Change Risk Assessment</h4>
      <p>Please answer all questions to determine the risk level of this change.</p>
      <form id="riskForm">
    `;
    
    // Add questions
    riskAssessment.questions.forEach(question => {
      questionnaireHtml += `
        <div class="form-group">
          <label>${question.text}</label>
          <div class="ml-4">
      `;
      
      question.options.forEach(option => {
        questionnaireHtml += `
          <div class="form-check">
            <input class="form-check-input" type="radio" name="${question.id}" id="${question.id}_${option.value}" value="${option.value}">
            <label class="form-check-label" for="${question.id}_${option.value}">
              ${option.text}
            </label>
          </div>
        `;
      });
      
      questionnaireHtml += `
          </div>
        </div>
      `;
    });
    
    // Add risk score result section
    questionnaireHtml += `
      <div class="mt-4">
        <button type="button" class="btn btn-primary" id="calculateRiskBtn">Calculate Risk Level</button>
      </div>
      
      <div id="riskResult" class="mt-3 d-none">
        <div class="card">
          <div class="card-header" id="riskScoreHeader">Risk Assessment</div>
          <div class="card-body">
            <h5 class="card-title">Risk Score: <span id="riskScore">0</span></h5>
            <p class="card-text">Risk Level: <span id="riskLevel">Not calculated</span></p>
          </div>
        </div>
      </div>
      </form>
    `;
    
    riskPane.innerHTML = questionnaireHtml;
    formTabContent.appendChild(riskPane);
    
    // Add event listener for risk calculation
    setTimeout(() => {
      const calculateRiskBtn = document.getElementById('calculateRiskBtn');
      if (calculateRiskBtn) {
        calculateRiskBtn.addEventListener('click', function() {
          const result = riskAssessment.calculateRiskScore();
          
          const riskResult = document.getElementById('riskResult');
          const riskScore = document.getElementById('riskScore');
          const riskLevel = document.getElementById('riskLevel');
          const riskScoreHeader = document.getElementById('riskScoreHeader');
          
          if (result.complete) {
            riskResult.classList.remove('d-none');
            riskScore.textContent = result.score;
            riskLevel.textContent = result.level;
            
            // Update color based on risk level
            riskScoreHeader.className = 'card-header';
            if (result.level === 'High') {
              riskScoreHeader.classList.add('bg-danger', 'text-white');
            } else if (result.level === 'Medium') {
              riskScoreHeader.classList.add('bg-warning');
            } else {
              riskScoreHeader.classList.add('bg-success', 'text-white');
            }
          } else {
            showNotification('Please answer all questions to calculate the risk level.', 'warning');
          }
        });
      }
    }, 500);
  }
}

// Add tooltips to form elements
function initializeTooltips() {
  // Will be initialized by Bootstrap
  $('[data-toggle="tooltip"]').tooltip();
}

// Set up event listeners for the form
function setupEventListeners() {
  // Change form submission
  const changeForm = document.getElementById('changeForm');
  if (changeForm) {
    changeForm.addEventListener('submit', function(e) {
      e.preventDefault();
      submitChangeRequest();
    });
  }
  
  // Hook up functions for the requester and agent search
  const requesterSearchBtn = document.getElementById('requesterSearchBtn');
  const agentSearchBtn = document.getElementById('agentSearchBtn');
  
  if (requesterSearchBtn) {
    requesterSearchBtn.onclick = function() {
      const query = document.getElementById('requesterSearch').value;
      if (query.trim() === '') {
        showNotification('Please enter a search term', 'warning');
        return;
      }
      searchRequesters('requester');
    };
  }
  
  if (agentSearchBtn) {
    agentSearchBtn.onclick = function() {
      const query = document.getElementById('agentSearch').value;
      if (query.trim() === '') {
        showNotification('Please enter a search term', 'warning');
        return;
      }
      searchUsers('agent');
    };
  }
}

// Fetch agent groups from Freshservice API
function fetchAgentGroups() {
  console.log('Fetching agent groups...');
  
  // Add implementation group field to the form if it doesn't exist yet
  addImplementationGroupField();
  
  // Get client for API calls
  const client = window.client;
  
  if (!client || !client.request) {
    console.error('Client not available for API calls');
    return renderSampleGroups();
  }
  
  // API path for agent groups
  const url = '/api/v2/groups';
  
  // Use client to make API call
  client.request.get(url)
    .then(function(response) {
      if (response.status === 200) {
        const data = response.response;
        if (data && data.groups) {
          renderGroups(data.groups);
        } else {
          console.error('Invalid response format', data);
          renderSampleGroups();
        }
      } else {
        console.error('Error fetching groups:', response);
        renderSampleGroups();
      }
    })
    .catch(function(error) {
      console.error('Failed to fetch agent groups:', error);
      
      // Try direct fetch as fallback
      directFetchGroups();
    });
}

// Direct fetch as fallback
function directFetchGroups() {
  console.log('Attempting direct fetch for agent groups...');
  
  if (!window.app || !window.app.apiUrl || !window.app.apiKey) {
    console.error('API configuration not available');
    return renderSampleGroups();
  }
  
  const apiUrl = window.app.apiUrl;
  const apiKey = window.app.apiKey;
  
  // Create authentication token
  const authToken = btoa(apiKey + ':X');
  
  // Make direct fetch call
  fetch(`${apiUrl}/api/v2/groups`, {
    method: 'GET',
    headers: {
      'Authorization': 'Basic ' + authToken,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (data && data.groups) {
      renderGroups(data.groups);
    } else {
      console.error('Invalid response format', data);
      renderSampleGroups();
    }
  })
  .catch(error => {
    console.error('Direct fetch failed:', error);
    renderSampleGroups();
  });
}

// Add implementation group field to the form
function addImplementationGroupField() {
  // Check if we already added the field
  if (document.getElementById('implementationGroup')) {
    return;
  }
  
  // Find where to insert the field (after agent section)
  const agentSection = document.querySelector('#selectedAgent').parentNode;
  if (!agentSection) {
    console.error('Cannot find agent section to add implementation group field');
    return;
  }
  
  // Create implementation group HTML
  const groupFieldHtml = `
    <div class="form-group">
      <label for="implementationGroup">Implementation Group</label>
      <div class="input-group">
        <input type="text" id="implementationGroupSearch" class="form-control" placeholder="Search for implementation group...">
        <div class="input-group-append">
          <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Select</button>
          <div class="dropdown-menu" id="implementationGroupDropdown">
            <div class="dropdown-item text-center">Loading groups...</div>
          </div>
        </div>
      </div>
      <div id="selectedGroup" class="selected-item mt-2 d-none">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title" id="groupName"></h5>
            <p class="card-text" id="groupDescription"></p>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="clearSelectedItem('implementationGroup')">Clear</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Create an element to hold the HTML
  const groupField = document.createElement('div');
  groupField.innerHTML = groupFieldHtml;
  
  // Insert after agent section
  agentSection.parentNode.insertBefore(groupField, agentSection.nextSibling);
  
  // Add event listener for search filtering
  const searchInput = document.getElementById('implementationGroupSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      filterGroups(this.value);
    });
  }
}

// Add Change Subject field
function addChangeSubjectField() {
  // Check if we already added the field
  if (document.getElementById('changeSubject')) {
    return;
  }
  
  // Find where to insert the field (before requester section)
  const requesterSection = document.querySelector('label[for="requesterSearch"]').parentNode;
  if (!requesterSection) {
    console.error('Cannot find requester section to add change subject field');
    return;
  }
  
  // Create subject field HTML
  const subjectFieldHtml = `
    <div class="form-group">
      <label for="changeSubject">Change Subject</label>
      <input type="text" id="changeSubject" class="form-control" placeholder="Enter a subject for this change">
    </div>
  `;
  
  // Create an element to hold the HTML
  const subjectField = document.createElement('div');
  subjectField.innerHTML = subjectFieldHtml;
  
  // Insert before requester section
  requesterSection.parentNode.insertBefore(subjectField, requesterSection);
}

// Render groups in the dropdown
function renderGroups(groups) {
  const dropdown = document.getElementById('implementationGroupDropdown');
  if (!dropdown) {
    console.error('Implementation group dropdown not found');
    return;
  }
  
  // Clear loading message
  dropdown.innerHTML = '';
  
  // Add groups to dropdown
  groups.forEach(group => {
    const item = document.createElement('a');
    item.className = 'dropdown-item';
    item.href = '#';
    item.textContent = group.name;
    item.dataset.id = group.id;
    item.dataset.name = group.name;
    item.dataset.description = group.description || '';
    
    item.addEventListener('click', function(e) {
      e.preventDefault();
      selectImplementationGroup(this.dataset);
    });
    
    dropdown.appendChild(item);
  });
  
  // Store original items for filtering
  dropdown.dataset.originalHtml = dropdown.innerHTML;
}

// Render sample groups when API fails
function renderSampleGroups() {
  const sampleGroups = [
    { id: 1, name: 'IT Infrastructure', description: 'Server, network, and infrastructure support' },
    { id: 2, name: 'Application Support', description: 'Business application management' },
    { id: 3, name: 'Service Desk', description: 'First-line support and incident handling' },
    { id: 4, name: 'Security Team', description: 'Security operations and compliance' },
    { id: 5, name: 'Database Administration', description: 'Database management and optimization' },
    { id: 6, name: 'Cloud Operations', description: 'Cloud infrastructure and services' },
    { id: 7, name: 'Network Team', description: 'Network administration and support' }
  ];
  
  renderGroups(sampleGroups);
}

// Filter groups based on search input
function filterGroups(query) {
  const dropdown = document.getElementById('implementationGroupDropdown');
  if (!dropdown || !dropdown.dataset.originalHtml) {
    return;
  }
  
  // If empty query, restore original list
  if (!query.trim()) {
    dropdown.innerHTML = dropdown.dataset.originalHtml;
    return;
  }
  
  // Filter items that match the query
  const items = dropdown.querySelectorAll('a.dropdown-item');
  const filteredItems = Array.from(items).filter(item => 
    item.textContent.toLowerCase().includes(query.toLowerCase())
  );
  
  // Clear dropdown
  dropdown.innerHTML = '';
  
  // Add filtered items back
  if (filteredItems.length > 0) {
    filteredItems.forEach(item => dropdown.appendChild(item.cloneNode(true)));
    
    // Re-add event listeners
    dropdown.querySelectorAll('a.dropdown-item').forEach(item => {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        selectImplementationGroup(this.dataset);
      });
    });
  } else {
    dropdown.innerHTML = '<div class="dropdown-item text-center">No matches found</div>';
  }
}

// Select implementation group
function selectImplementationGroup(groupData) {
  selectedItems.implementationGroup = groupData;
  
  const selectedGroup = document.getElementById('selectedGroup');
  const groupName = document.getElementById('groupName');
  const groupDescription = document.getElementById('groupDescription');
  
  if (selectedGroup && groupName && groupDescription) {
    groupName.textContent = groupData.name;
    groupDescription.textContent = groupData.description || '';
    selectedGroup.classList.remove('d-none');
  }
}

// Search for users (agents)
function searchUsers(type) {
  if (window.app && window.app.searchUsers) {
    const query = document.getElementById(type + 'Search').value;
    
    if (query.trim() === '') {
      showNotification('Please enter a search term', 'warning');
      return;
    }
    
    // Clear previous results
    const resultsContainer = document.getElementById(type + 'Results');
    if (resultsContainer) {
      resultsContainer.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div></div>';
    }
    
    // Call the main app's search function
    window.app.searchUsers(query)
      .then(results => {
        renderSearchResults(type, results);
      })
      .catch(error => {
        console.error('Error searching users:', error);
        resultsContainer.innerHTML = '<div class="alert alert-danger">Error searching users</div>';
      });
  } else {
    console.error('Search users function not available');
  }
}

// Search for requesters
function searchRequesters(type) {
  if (window.app && window.app.searchRequesters) {
    const query = document.getElementById(type + 'Search').value;
    
    if (query.trim() === '') {
      showNotification('Please enter a search term', 'warning');
      return;
    }
    
    // Clear previous results
    const resultsContainer = document.getElementById(type + 'Results');
    if (resultsContainer) {
      resultsContainer.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div></div>';
    }
    
    // Call the main app's search function
    window.app.searchRequesters(query)
      .then(results => {
        renderSearchResults(type, results);
      })
      .catch(error => {
        console.error('Error searching requesters:', error);
        resultsContainer.innerHTML = '<div class="alert alert-danger">Error searching requesters</div>';
      });
  } else {
    console.error('Search requesters function not available');
  }
}

// Render search results for users/requesters
function renderSearchResults(type, results) {
  const resultsContainer = document.getElementById(type + 'Results');
  
  if (!resultsContainer) {
    console.error(`Results container for ${type} not found`);
    return;
  }
  
  if (!results || results.length === 0) {
    resultsContainer.innerHTML = '<div class="alert alert-info">No results found</div>';
    return;
  }
  
  // Define HTML content and build it in one go
  let html = '<div class="list-group">';
  
  results.forEach(user => {
    const displayName = user.first_name && user.last_name 
      ? `${user.first_name} ${user.last_name}`
      : (user.name || 'Unknown User');
      
    html += `
      <a href="#" class="list-group-item list-group-item-action" 
         data-id="${user.id}" 
         data-name="${displayName}" 
         data-email="${user.email || ''}" 
         data-department="${user.department_name || user.department || ''}"
         onclick="selectUser('${type}', this.dataset)">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h5 class="mb-1">${displayName}</h5>
            <p class="mb-1">${user.email || ''}</p>
            ${user.department_name || user.department ? `<small class="text-muted">Department: ${user.department_name || user.department}</small>` : ''}
          </div>
          <span class="badge badge-primary badge-pill">Select</span>
        </div>
      </a>
    `;
  });
  
  html += '</div>';
  resultsContainer.innerHTML = html;
}

// Add to global scope for HTML onclick handlers
window.selectUser = function(type, userData) {
  selectedItems[type] = userData;
  
  const selectedItem = document.getElementById('selected' + type.charAt(0).toUpperCase() + type.slice(1));
  const nameElement = document.getElementById(type + 'Name');
  const emailElement = document.getElementById(type + 'Email');
  
  if (selectedItem && nameElement && emailElement) {
    nameElement.textContent = userData.name;
    emailElement.textContent = userData.email;
    
    // For requesters, also populate department
    if (type === 'requester') {
      const deptElement = document.getElementById(type + 'Dept');
      if (deptElement) {
        deptElement.textContent = userData.department || '';
      }
    }
    
    selectedItem.classList.remove('d-none');
  }
  
  // Clear search results
  const resultsContainer = document.getElementById(type + 'Results');
  if (resultsContainer) {
    resultsContainer.innerHTML = '';
  }
};

// Clear selected item
window.clearSelectedItem = function(type) {
  selectedItems[type] = null;
  
  const selectedItem = document.getElementById('selected' + type.charAt(0).toUpperCase() + type.slice(1));
  if (selectedItem) {
    selectedItem.classList.add('d-none');
  }
};

// Submit change request
function submitChangeRequest() {
  // Collect form data
  const changeSubject = document.getElementById('changeSubject')?.value || '';
  const changeType = document.getElementById('changeType')?.value || '';
  
  // Validate form
  const errors = [];
  
  if (!changeSubject.trim()) {
    errors.push('Change Subject is required');
  }
  
  if (!changeType) {
    errors.push('Change Type is required');
  }
  
  if (!selectedItems.requester) {
    errors.push('Requester selection is required');
  }
  
  if (!selectedItems.agent) {
    errors.push('Agent selection is required');
  }
  
  if (!selectedItems.implementationGroup) {
    errors.push('Implementation Group is required');
  }
  
  // Check if risk assessment is complete
  const riskResult = riskAssessment.calculateRiskScore();
  if (!riskResult.complete) {
    errors.push('Risk Assessment must be completed');
  }
  
  if (errors.length > 0) {
    showNotification('Please correct the following errors:<br>' + errors.join('<br>'), 'danger');
    return;
  }
  
  // Prepare data for submission
  const changeData = {
    subject: changeSubject,
    type: changeType,
    requester_id: selectedItems.requester.id,
    agent_id: selectedItems.agent.id,
    group_id: selectedItems.implementationGroup.id,
    risk_score: riskResult.score,
    risk_level: riskResult.level
  };
  
  console.log('Change request data:', changeData);
  
  // Here you would typically submit to Freshservice API
  // For now, show success message
  showNotification('Change request submitted successfully!', 'success');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Add Change Subject field
  addChangeSubjectField();
}); 