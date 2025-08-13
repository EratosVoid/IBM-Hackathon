# Agentic City Planner

A comprehensive urban planning tool that combines AI-powered decision making with simulation capabilities and citizen feedback mechanisms.

## Project Overview

This project integrates multiple services to create a complete city planning solution:

- **Auth Service**: Handles user authentication and authorization
- **Planner Agent**: Central AI brain for processing planning requests
- **Simulation Engine**: Computes quantitative outcomes for city changes
- **Document Processor**: Handles policy documents and feedback analysis
- **Parser**: Processes blueprint files and city data
- **API Gateway**: Routes requests between services
- **Frontend**: User interface for interacting with the system

## Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- pip (Python package manager)
- npm (Node.js package manager)

## Installation

1. **Install Python dependencies**:
   ```bash
   # Install dependencies for each Python service
   pip install -r planner-agent/requirements.txt
   pip install -r simulation-engine/requirements.txt
   pip install -r document-processor/requirements.txt
   pip install -r parser/requirements.txt
   pip install -r requirements.txt
   ```

2. **Install Node.js dependencies**:
   ```bash
   # Install dependencies for the Auth service
   cd auth
   npm install
   cd ..
   ```

## Running the Project

### Option 1: Using the Startup Script (Recommended)

```bash
python start_project.py
```

This will start all services in the correct order and perform health checks.

### Option 2: Manual Start

1. **Start the Auth Service**:
   ```bash
   cd auth
   node server.js
   ```

2. **Start the Planner Agent**:
   ```bash
   cd planner-agent
   uvicorn src.api:app --host 0.0.0.0 --port 8000
   ```

3. **Start the Simulation Engine**:
   ```bash
   cd simulation-engine
   uvicorn src.main:app --host 0.0.0.0 --port 8001
   ```

4. **Start the Document Processor**:
   ```bash
   cd document-processor
   uvicorn src.main:app --host 0.0.0.0 --port 8002
   ```

5. **Start the API Gateway**:
   ```bash
   python api_gateway.py
   ```

## Accessing the Application

Once all services are running:

- **Frontend Interface**: http://localhost:8080
- **Auth Service**: http://localhost:5000
- **Planner Agent**: http://localhost:8000
- **Simulation Engine**: http://localhost:8001
- **Document Processor**: http://localhost:8002

## Login Credentials

- **Email**: dev@hackathon.com
- **Password**: cityplanner123

## Project Structure

```
IBM-Hackathon/
├── auth/                 # Authentication service (Node.js)
├── planner-agent/        # AI planning agent (Python)
├── simulation-engine/    # City simulation engine (Python)
├── document-processor/    # Document processing service (Python)
├── parser/               # Blueprint parser (Python)
├── frontend/             # Web frontend
├── api_gateway.py       # API gateway
├── start_project.py      # Project startup script
├── docker-compose.yml    # Docker configuration
└── INTEGRATION_GUIDE.md # Detailed integration documentation
```

## Features

1. **User Authentication**: Secure login system with JWT tokens
2. **AI City Planning**: Natural language interface for city planning requests
3. **Simulation Engine**: Quantitative analysis of traffic, cost, and pollution impacts
4. **Document Processing**: Upload and query policy documents using RAG
5. **Feedback Analysis**: Analyze community feedback with sentiment analysis
6. **Blueprint Parsing**: Process GIS and blueprint files
7. **Responsive Frontend**: Modern web interface for all features

## Testing

Run the integration tests to verify all services work together:

```bash
python test_integration.py
```

## Troubleshooting

If you encounter issues:

1. **Port Conflicts**: Ensure ports 5000, 8000, 8001, 8002, and 8080 are free
2. **Dependencies**: Make sure all Python and Node.js dependencies are installed
3. **Environment Variables**: Check that all required environment variables are set
4. **Service Health**: Use the health check endpoints to verify each service is running

## Docker Deployment

Alternatively, you can use Docker Compose to run the entire system:

```bash
docker-compose up --build
```

This will start all services in containers with proper networking.

## IBM Cloud Deployment

The application can be deployed to IBM Cloud using Code Engine. For detailed instructions, see the [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) file.

### Prerequisites for IBM Cloud Deployment

- IBM Cloud account with appropriate permissions
- IBM Cloud CLI installed
- Docker installed and running
- IBM Cloud Container Registry namespace
- Access to IBM Watson AI services

### Quick Deployment Steps

1. **Login to IBM Cloud**:
   ```bash
   ibmcloud login
   ```

2. **Install Code Engine Plugin**:
   ```bash
   ibmcloud plugin install code-engine
   ```

3. **Build and Push Docker Images**:
   ```bash
   # For Linux/Mac
   ./ibm-cloud-deploy/build-and-push.sh <your-namespace>
   
   # For Windows
   ibm-cloud-deploy\build-and-push.bat <your-namespace>
   ```

4. **Deploy to Code Engine**:
   Follow the detailed instructions in [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

### Watson AI Integration

The application uses IBM Watson AI services for:
- Natural language processing in the Planner Agent
- Document embedding and retrieval in the Document Processor

For Watson AI setup instructions, see [ibm-cloud-deploy/WATSON_AI_SETUP.md](ibm-cloud-deploy/WATSON_AI_SETUP.md)