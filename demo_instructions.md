# Agentic City Planner Demo Instructions

This document provides step-by-step instructions for running the Agentic City Planner system.

## Prerequisites

Before running the demo, ensure you have:

1. Python 3.8 or higher installed
2. Node.js 14 or higher installed
3. All required dependencies installed:
   ```bash
   # Install Python dependencies
   pip install -r planner-agent/requirements.txt
   pip install -r simulation-engine/requirements.txt
   pip install -r document-processor/requirements.txt
   pip install -r parser/requirements.txt
   pip install -r requirements.txt
   
   # Install Node.js dependencies
   cd auth
   npm install
   cd ..
   ```

## Running the Demo

### Option 1: Using the Batch File (Windows only)

Simply double-click on `start_demo.bat` to start all services automatically.

### Option 2: Manual Start

#### Step 1: Start the Auth Service

Open a new terminal and run:
```bash
cd auth
node server.js
```

Expected output:
```
 City Planner API server running on port 5000
 Demo credentials:
planner@city.dev / cityplanner123
 dev@hackathon.com / cityplanner123
Protected routes:
POST /api/init-city (create city project)
POST /api/prompt (AI agent communication)
GET  /api/simulation/:projectId (get simulation data)
```

#### Step 2: Start the Planner Agent

Open a new terminal and run:
```bash
cd planner-agent
uvicorn src.api:app --host 0.0.0.0 --port 8000
```

Expected output:
```
INFO:     Started server process [XXXXX]
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

#### Step 3: Start the Simulation Engine

Open a new terminal and run:
```bash
cd simulation-engine
uvicorn src.main:app --host 0.0.0.0 --port 8001
```

Expected output:
```
INFO:     Started server process [XXXXX]
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
```

#### Step 4: Start the Document Processor

Open a new terminal and run:
```bash
cd document-processor
uvicorn src.main:app --host 0.0.0.0 --port 8002
```

Expected output:
```
INFO:     Started server process [XXXXX]
INFO:     Uvicorn running on http://0.0.0.0:8002 (Press CTRL+C to quit)
```

#### Step 5: Start the API Gateway

Open a new terminal and run:
```bash
python api_gateway.py
```

Expected output:
```
 * Running on http://0.0.0.0:8080
```

### Step 6: Access the Frontend

Open your web browser and navigate to:
```
http://localhost:8080
```

### Step 7: Login

Use the following credentials to login:
- Email: dev@hackathon.com
- Password: cityplanner123

## Testing the Integration

Once all services are running, you can test the integration using the provided test script:

```bash
python test_integration.py
```

This will run a series of tests to verify that all services are working together correctly.

## Docker Alternative

If you prefer to use Docker, you can run the entire system with:

```bash
docker-compose up --build
```

This will start all services in containers with proper networking.

## Troubleshooting

If you encounter issues:

1. **Port Conflicts**: Ensure ports 5000, 8000, 8001, 8002, and 8080 are free
2. **Dependencies**: Make sure all Python and Node.js dependencies are installed
3. **Environment Variables**: Check that all required environment variables are set
4. **Service Health**: Use the health check endpoints to verify each service is running:
   - Auth Service: http://localhost:5000/api/health
   - Planner Agent: http://localhost:8000/health
   - Simulation Engine: http://localhost:8001/health
   - Document Processor: http://localhost:8002/health
   - API Gateway: http://localhost:8080/health

## Features to Demonstrate

1. **User Authentication**: Secure login system with JWT tokens
2. **AI City Planning**: Natural language interface for city planning requests
3. **Simulation Engine**: Quantitative analysis of traffic, cost, and pollution impacts
4. **Document Processing**: Upload and query policy documents using RAG
5. **Feedback Analysis**: Analyze community feedback with sentiment analysis
6. **Blueprint Parsing**: Process GIS and blueprint files
7. **Responsive Frontend**: Modern web interface for all features