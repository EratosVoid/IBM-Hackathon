# IBM Cloud Deployment Guide for Agentic City Planner

This guide provides instructions for deploying the Agentic City Planner application to IBM Cloud using Code Engine.

## Prerequisites

1. IBM Cloud account
2. IBM Cloud CLI installed
3. Docker installed
4. IBM Cloud Container Registry namespace

## Deployment Steps

### 1. Set up IBM Cloud CLI

```bash
# Install IBM Cloud CLI if not already installed
# Follow instructions at: https://cloud.ibm.com/docs/cli?topic=cli-install-ibmcloud-cli

# Login to IBM Cloud
ibmcloud login

# Install Code Engine plugin
ibmcloud plugin install code-engine
```

### 2. Build and Push Docker Images

```bash
# Build images
docker build -t us.icr.io/<your-namespace>/cityplanner-auth ./auth
docker build -t us.icr.io/<your-namespace>/cityplanner-planner ./planner-agent
docker build -t us.icr.io/<your-namespace>/cityplanner-simulation ./simulation-engine
docker build -t us.icr.io/<your-namespace>/cityplanner-document ./document-processor
docker build -t us.icr.io/<your-namespace>/cityplanner-parser ./parser
docker build -t us.icr.io/<your-namespace>/cityplanner-api ./api_gateway.py

# Push images to IBM Container Registry
docker push us.icr.io/<your-namespace>/cityplanner-auth
docker push us.icr.io/<your-namespace>/cityplanner-planner
docker push us.icr.io/<your-namespace>/cityplanner-simulation
docker push us.icr.io/<your-namespace>/cityplanner-document
docker push us.icr.io/<your-namespace>/cityplanner-parser
docker push us.icr.io/<your-namespace>/cityplanner-api
```

### 3. Create Code Engine Application

```bash
# Target a Code Engine resource group and project
ibmcloud target -g <resource-group>
ibmcloud ce project select --name <project-name>  # or create a new project with: ibmcloud ce project create --name <project-name>

# Create applications for each service
ibmcloud ce app create --name cityplanner-auth --image us.icr.io/<your-namespace>/cityplanner-auth --port 5000 --env JWT_SECRET=<your-secret>
ibmcloud ce app create --name cityplanner-planner --image us.icr.io/<your-namespace>/cityplanner-planner --port 8000 --env IBM_WATSONX_API_KEY=<your-api-key> --env IBM_WATSONX_PROJECT_ID=<your-project-id>
ibmcloud ce app create --name cityplanner-simulation --image us.icr.io/<your-namespace>/cityplanner-simulation --port 8001
ibmcloud ce app create --name cityplanner-document --image us.icr.io/<your-namespace>/cityplanner-document --port 8002 --env WATSONX_APIKEY=<your-api-key> --env WATSONX_PROJECT_ID=<your-project-id>
ibmcloud ce app create --name cityplanner-parser --image us.icr.io/<your-namespace>/cityplanner-parser --port 8003
ibmcloud ce app create --name cityplanner-api --image us.icr.io/<your-namespace>/cityplanner-api --port 8080
```

### 4. Configure Environment Variables

Set the appropriate environment variables for each service:

```bash
# For auth service
ibmcloud ce app update --name cityplanner-auth --env AUTH_PORT=5000 --env JWT_SECRET=<your-secret>

# For planner agent
ibmcloud ce app update --name cityplanner-planner --env PLANNER_PORT=8000 --env IBM_WATSONX_API_KEY=<your-api-key> --env IBM_WATSONX_URL=https://us-south.ml.cloud.ibm.com --env IBM_WATSONX_PROJECT_ID=<your-project-id> --env MODEL_NAME=ibm/granite-3-2-8b-instruct

# For simulation engine
ibmcloud ce app update --name cityplanner-simulation --env SIMULATION_PORT=8001

# For document processor
ibmcloud ce app update --name cityplanner-document --env DOCUMENT_PORT=8002 --env WATSONX_APIKEY=<your-api-key> --env WATSONX_URL=https://us-south.ml.cloud.ibm.com --env WATSONX_PROJECT_ID=<your-project-id> --env EMBEDDING_MODEL_ID=ibm/slate-125m-english-rtrvr

# For parser
ibmcloud ce app update --name cityplanner-parser --env PARSER_PORT=8003

# For API gateway, update service URLs to point to Code Engine applications
ibmcloud ce app update --name cityplanner-api --env AUTH_URL=http://cityplanner-auth.<region>.codeengine.appdomain.cloud --env PLANNER_URL=http://cityplanner-planner.<region>.codeengine.appdomain.cloud --env SIMULATION_URL=http://cityplanner-simulation.<region>.codeengine.appdomain.cloud --env DOCUMENT_URL=http://cityplanner-document.<region>.codeengine.appdomain.cloud --env PARSER_URL=http://cityplanner-parser.<region>.codeengine.appdomain.cloud
```

### 5. Create IBM Cloud Database

For production use, create a PostgreSQL database instance:

```bash
# Create a PostgreSQL database instance
ibmcloud resource service-instance-create cityplanner-db databases-for-postgresql standard us-south -p '{"members_disk_allocation_mb": "10240", "members_memory_allocation_mb": "1024"}'

# Get connection details
ibmcloud resource service-key-create cityplanner-db-key Administrator --instance-name cityplanner-db

# Update services with database connection details
ibmcloud ce app update --name cityplanner-auth --env DATABASE_URL=postgresql://<username>:<password>@<hostname>:<port>/<database>
```

## Watson AI Integration

To use IBM Watson AI services:

1. Create an IBM Watson AI project at https://dataplatform.cloud.ibm.com/
2. Obtain your Watson AI API key and project ID
3. Set the environment variables as shown above

## Accessing the Application

After deployment, access your application at:
`http://cityplanner-api.<region>.codeengine.appdomain.cloud`

## Troubleshooting

- Check application logs: `ibmcloud ce app logs --application <app-name>`
- Scale applications: `ibmcloud ce app update --name <app-name> --min-scale 1 --max-scale 5`
- Update environment variables: `ibmcloud ce app update --name <app-name> --env <key>=<value>`