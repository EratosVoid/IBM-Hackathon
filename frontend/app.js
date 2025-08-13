// Frontend JavaScript for Agentic City Planner

// API Gateway URL - configurable for different environments
const API_GATEWAY_URL = window.location.origin || 'http://localhost:8080';

// Global variables
let authToken = null;
let currentProject = null;
let map = null;

// DOM Elements
const loginSection = document.getElementById('loginSection');
const projectsSection = document.getElementById('projectsSection');
const projectDetailSection = document.getElementById('projectDetailSection');
const documentsSection = document.getElementById('documentsSection');
const feedbackSection = document.getElementById('feedbackSection');

// Buttons
const loginBtn = document.getElementById('loginBtn');
const projectsBtn = document.getElementById('projectsBtn');
const docsBtn = document.getElementById('docsBtn');
const feedbackBtn = document.getElementById('feedbackBtn');
const newProjectBtn = document.getElementById('newProjectBtn');
const uploadDocBtn = document.getElementById('uploadDocBtn');
const queryBtn = document.getElementById('queryBtn');
const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');

// Forms
const loginForm = document.getElementById('loginForm');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    initApp();
    
    // Set up event listeners
    loginBtn.addEventListener('click', showLoginSection);
    projectsBtn.addEventListener('click', showProjectsSection);
    docsBtn.addEventListener('click', showDocumentsSection);
    feedbackBtn.addEventListener('click', showFeedbackSection);
    
    loginForm.addEventListener('submit', handleLogin);
    newProjectBtn.addEventListener('click', createNewProject);
    uploadDocBtn.addEventListener('click', uploadDocument);
    queryBtn.addEventListener('click', queryDocuments);
    submitFeedbackBtn.addEventListener('click', submitFeedback);
    
    // Initialize map if on project detail section
    if (projectDetailSection && !projectDetailSection.classList.contains('hidden')) {
        initMap();
    }
});

// Initialize the application
function initApp() {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
        authToken = token;
        showProjectsSection();
    } else {
        showLoginSection();
    }
}

// Show login section
function showLoginSection() {
    hideAllSections();
    loginSection.classList.remove('hidden');
}

// Show projects section
function showProjectsSection() {
    hideAllSections();
    projectsSection.classList.remove('hidden');
    loadProjects();
}

// Show project detail section
function showProjectDetailSection(project) {
    hideAllSections();
    projectDetailSection.classList.remove('hidden');
    currentProject = project;
    document.getElementById('projectTitle').textContent = project.name;
    
    // Initialize map
    initMap();
}

// Show documents section
function showDocumentsSection() {
    hideAllSections();
    documentsSection.classList.remove('hidden');
    loadDocuments();
}

// Show feedback section
function showFeedbackSection() {
    hideAllSections();
    feedbackSection.classList.remove('hidden');
}

// Hide all sections
function hideAllSections() {
    loginSection.classList.add('hidden');
    projectsSection.classList.add('hidden');
    projectDetailSection.classList.add('hidden');
    documentsSection.classList.add('hidden');
    feedbackSection.classList.add('hidden');
}

// Handle login
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Send login request to API Gateway
    fetch(`${API_GATEWAY_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            showProjectsSection();
        } else {
            alert('Login failed: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    });
}

// Load projects
function loadProjects() {
    if (!authToken) return;
    
    fetch(`${API_GATEWAY_URL}/api/projects`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayProjects(data.projects);
        } else {
            console.error('Failed to load projects:', data.error);
        }
    })
    .catch(error => {
        console.error('Error loading projects:', error);
    });
}

// Display projects
function displayProjects(projects) {
    const projectsList = document.getElementById('projectsList');
    projectsList.innerHTML = '';
    
    projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.innerHTML = `
            <h3>${project.name}</h3>
            <p>${project.description}</p>
            <p>Status: ${project.status}</p>
        `;
        projectCard.addEventListener('click', () => {
            showProjectDetailSection(project);
        });
        projectsList.appendChild(projectCard);
    });
}

// Create new project
function createNewProject() {
    const projectName = prompt('Enter project name:');
    if (!projectName) return;
    
    const projectDescription = prompt('Enter project description:');
    
    fetch(`${API_GATEWAY_URL}/api/init-city`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
            name: projectName,
            description: projectDescription,
            cityType: 'new',
            constraints: {}
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Project created successfully!');
            loadProjects();
        } else {
            alert('Failed to create project: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error creating project:', error);
        alert('Failed to create project. Please try again.');
    });
}

// Initialize map
function initMap() {
    if (!map) {
        map = L.map('projectMap').setView([51.505, -0.09], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Add a marker for demonstration
        L.marker([51.5, -0.09]).addTo(map)
            .bindPopup('City Center')
            .openPopup();
    }
}

// Send prompt to AI Planner
document.getElementById('sendPromptBtn').addEventListener('click', () => {
    const prompt = document.getElementById('plannerPrompt').value;
    if (!prompt) return;
    
    if (!currentProject || !authToken) {
        alert('Please select a project and log in first.');
        return;
    }
    
    fetch(`${API_GATEWAY_URL}/api/prompt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
            message: prompt,
            projectId: currentProject.id,
            context: {}
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('plannerResponse').innerHTML = `
                <h4>AI Planner Response:</h4>
                <p>${data.response.agent_response}</p>
                <p><strong>Rationale:</strong> ${data.response.reasoning}</p>
            `;
        } else {
            alert('Failed to get response from AI Planner: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error sending prompt:', error);
        alert('Failed to send prompt. Please try again.');
    });
});

// Run simulation
document.getElementById('runSimulationBtn').addEventListener('click', () => {
    if (!currentProject || !authToken) {
        alert('Please select a project and log in first.');
        return;
    }
    
    fetch(`${API_GATEWAY_URL}/api/simulation/${currentProject.id}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displaySimulationMetrics(data.simulation.metrics);
        } else {
            alert('Failed to run simulation: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error running simulation:', error);
        alert('Failed to run simulation. Please try again.');
    });
});

// Display simulation metrics
function displaySimulationMetrics(metrics) {
    const metricsDiv = document.getElementById('simulationMetrics');
    metricsDiv.innerHTML = `
        <h4>Simulation Results:</h4>
        <ul>
            <li>Traffic Flow Efficiency: ${metrics.traffic_flow_efficiency}%</li>
            <li>Estimated Cost: $${metrics.cost_estimate.toLocaleString()}</li>
            <li>Pollution Index: ${metrics.pollution_index}</li>
            <li>Green Space Ratio: ${metrics.green_space_ratio}%</li>
            <li>Population Density: ${metrics.population_density} per km²</li>
            <li>Walkability Score: ${metrics.walkability_score}</li>
        </ul>
    `;
}

// Load documents
function loadDocuments() {
    // This would load documents from the backend
    // For now, we'll just show a placeholder
    const documentsList = document.getElementById('documentsList');
    documentsList.innerHTML = '<p>No documents uploaded yet.</p>';
}

// Upload document
function uploadDocument() {
    const fileInput = document.getElementById('documentUpload');
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file to upload.');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    fetch(`${API_GATEWAY_URL}/documents/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert('Document uploaded successfully!');
            loadDocuments();
        } else {
            alert('Failed to upload document: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error uploading document:', error);
        alert('Failed to upload document. Please try again.');
    });
}

// Query documents
function queryDocuments() {
    const query = document.getElementById('queryInput').value;
    if (!query) return;
    
    fetch(`${API_GATEWAY_URL}/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ query: query })
    })
    .then(response => response.json())
    .then(data => {
        if (data.answer) {
            document.getElementById('queryResults').innerHTML = `
                <h4>Query Results:</h4>
                <p>${data.answer}</p>
                <p><strong>Confidence:</strong> ${(data.confidence_score * 100).toFixed(2)}%</p>
            `;
        } else {
            document.getElementById('queryResults').innerHTML = '<p>No relevant information found.</p>';
        }
    })
    .catch(error => {
        console.error('Error querying documents:', error);
        alert('Failed to query documents. Please try again.');
    });
}

// Submit feedback
function submitFeedback() {
    const feedback = document.getElementById('feedbackInput').value;
    if (!feedback) {
        alert('Please enter your feedback.');
        return;
    }
    
    fetch(`${API_GATEWAY_URL}/feedback/analyze`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ feedback_text: feedback })
    })
    .then(response => response.json())
    .then(data => {
        if (data.feedback_text) {
            document.getElementById('feedbackAnalysis').innerHTML = `
                <h4>Feedback Analysis:</h4>
                <p><strong>Sentiment:</strong> ${data.sentiment_label} (${data.sentiment_score.toFixed(2)})</p>
                <p><strong>Topics:</strong> ${data.topics.join(', ')}</p>
                <p><strong>Confidence:</strong> ${(data.confidence * 100).toFixed(2)}%</p>
            `;
            document.getElementById('feedbackInput').value = '';
        } else {
            alert('Failed to analyze feedback: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error submitting feedback:', error);
        alert('Failed to submit feedback. Please try again.');
    });
}

// Logout
function logout() {
    authToken = null;
    localStorage.removeItem('authToken');
    showLoginSection();
}

// Add logout button to header
const logoutBtn = document.createElement('button');
logoutBtn.textContent = 'Logout';
logoutBtn.addEventListener('click', logout);
document.querySelector('header nav').appendChild(logoutBtn);