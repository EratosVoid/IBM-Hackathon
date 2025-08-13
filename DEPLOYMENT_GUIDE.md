# Agentic City Planner Deployment Guide

This guide provides comprehensive instructions for deploying the Agentic City Planner application to IBM Cloud using Code Engine.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [IBM Cloud Setup](#ibm-cloud-setup)
3. [Watson AI Configuration](#watson-ai-configuration)
4. [Building and Pushing Docker Images](#building-and-pushing-docker-images)
5. [Deploying to Code Engine](#deploying-to-code-engine)
6. [Configuring Environment Variables](#configuring-environment-variables)
7. [Setting up the Database](#setting-up-the-database)
8. [Verifying the Deployment](#verifying-the-deployment)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying the application, ensure you have the following:

1. IBM Cloud account with appropriate permissions
2. IBM Cloud CLI installed
3. Docker installed and running
4. IBM Cloud Container Registry namespace
5. Access to IBM Watson AI services

## IBM Cloud Setup

### 1. Install IBM Cloud CLI

Follow the instructions at [IBM Cloud CLI Installation Guide](https://cloud.ibm.com/docs/cli?topic=cli-install-ibmcloud-cli) to install the IBM Cloud CLI.

### 2. Login to IBM Cloud

```bash
ibmcloud login
```

### 3. Install Code Engine Plugin

```bash
ibmcloud plugin install code-engine
```

### 4. Target a Resource Group and Region

```bash
ibmcloud target -g <resource-group> -r <region>
```

## Watson AI Configuration

### 1. Create Watson AI Project

1. Go to [IBM Watson AI](https://dataplatform.cloud.ibm.com/)
2. Create a new project or use an existing one
3. Note down your Project ID (a UUID format string)

### 2. Obtain Watson AI API Key

1. In the IBM Watson AI console, go to "Manage" > "Access (IAM)"
2. Create a new API key or use an existing one
3. Copy the API key for later use

### 3. Configure Watson AI Environment Variables

For IBM Cloud deployment, you need to set the following environment variables:

#### For Planner Agent:
- `IBM_WATSONX_API_KEY`: Your Watson AI API key
- `IBM_WATSONX_URL`: Watson AI endpoint URL (usually `https://us-south.ml.cloud.ibm.com`)
- `IBM_WATSONX_PROJECT_ID`: Your Watson AI project ID
- `MODEL_NAME`: The model to use (default: `ibm/granite-3-2-8b-instruct`)

#### For Document Processor:
- `WATSONX_APIKEY`: Your Watson AI API key
- `WATSONX_URL`: Watson AI endpoint URL (usually `https://us-south.ml.cloud.ibm.com`)
- `WATSONX_PROJECT_ID`: Your Watson AI project ID
- `EMBEDDING_MODEL_ID`: The embedding model to use (default: `ibm/slate-125m-english-rtrvr`)

## Building and Pushing Docker Images

### 1. Create Container Registry Namespace

```bash
ibmcloud cr namespace-add <your-namespace>
```

### 2. Build and Push Images

Use the provided build script:

```bash
# For Linux/Mac
./ibm-cloud-deploy/build-and-push.sh <your-namespace>

# For Windows
ibm-cloud-deploy\build-and-push.bat <your-namespace>
```

Alternatively, build and push manually:

```bash
# Build images
docker build -t us.icr.io/<your-namespace>/cityplanner-auth ./auth
docker build -t us.icr.io/<your-namespace>/cityplanner-planner ./planner-agent
docker build -t us.icr.io/<your-namespace>/cityplanner-simulation ./simulation-engine
docker build -t us.icr.io/<your-namespace>/cityplanner-document ./document-processor
docker build -t us.icr.io/<your-namespace>/cityplanner-parser ./parser
docker build -t us.icr.io/<your-namespace>/cityplanner-api .

# Push images
docker push us.icr.io/<your-namespace>/cityplanner-auth
docker push us.icr.io/<your-namespace>/cityplanner-planner
docker push us.icr.io/<your-namespace>/cityplanner-simulation
docker push us.icr.io/<your-namespace>/cityplanner-document
docker push us.icr.io/<your-namespace>/cityplanner-parser
docker push us.icr.io/<your-namespace>/cityplanner-api
```

## Deploying to Code Engine

### 1. Create Code Engine Project

```bash
ibmcloud ce project create --name cityplanner
ibmcloud ce project select --name cityplanner
```

### 2. Create Applications

```bash
# Create auth service
ibmcloud ce app create --name cityplanner-auth \
  --image us.icr.io/<your-namespace>/cityplanner-auth \
  --port 5000 \
  --env JWT_SECRET=<your-secret>

# Create planner agent
ibmcloud ce app create --name cityplanner-planner \
  --image us.icr.io/<your-namespace>/cityplanner-planner \
  --port 8000

# Create simulation engine
ibmcloud ce app create --name cityplanner-simulation \
  --image us.icr.io/<your-namespace>/cityplanner-simulation \
  --port 8001

# Create document processor
ibmcloud ce app create --name cityplanner-document \
  --image us.icr.io/<your-namespace>/cityplanner-document \
  --port 8002

# Create parser
ibmcloud ce app create --name cityplanner-parser \
  --image us.icr.io/<your-namespace>/cityplanner-parser \
  --port 8003

# Create API gateway
ibmcloud ce app create --name cityplanner-api \
  --image us.icr.io/<your-namespace>/cityplanner-api \
  --port 8080
```

## Configuring Environment Variables

### 1. Configure Service URLs

Update the API gateway with the correct service URLs:

```bash
ibmcloud ce app update --name cityplanner-api \
  --env AUTH_URL=http://cityplanner-auth.<region>.codeengine.appdomain.cloud \
  --env PLANNER_URL=http://cityplanner-planner.<region>.codeengine.appdomain.cloud \
  --env SIMULATION_URL=http://cityplanner-simulation.<region>.codeengine.appdomain.cloud \
  --env DOCUMENT_URL=http://cityplanner-document.<region>.codeengine.appdomain.cloud \
  --env PARSER_URL=http://cityplanner-parser.<region>.codeengine.appdomain.cloud
```

### 2. Configure Watson AI Credentials

```bash
# For planner agent
ibmcloud ce app update --name cityplanner-planner \
  --env IBM_WATSONX_API_KEY=<your-api-key> \
  --env IBM_WATSONX_PROJECT_ID=<your-project-id> \
  --env MODEL_NAME=ibm/granite-3-2-8b-instruct

# For document processor
ibmcloud ce app update --name cityplanner-document \
  --env WATSONX_APIKEY=<your-api-key> \
  --env WATSONX_PROJECT_ID=<your-project-id> \
  --env EMBEDDING_MODEL_ID=ibm/slate-125m-english-rtrvr
```

## Setting up the Database

For production use, create a PostgreSQL database instance:

```bash
# Create a PostgreSQL database instance
ibmcloud resource service-instance-create cityplanner-db databases-for-postgresql standard us-south -p '{"members_disk_allocation_mb": "10240", "members_memory_allocation_mb": "1024"}'

# Get connection details
ibmcloud resource service-key-create cityplanner-db-key Administrator --instance-name cityplanner-db

# Update services with database connection details
ibmcloud ce app update --name cityplanner-auth --env DATABASE_URL=postgresql://<username>:<password>@<hostname>:<port>/<database>
```

## Verifying the Deployment

### 1. Check Application Status

```bash
ibmcloud ce app list
```

### 2. Check Application Logs

```bash
ibmcloud ce app logs --application cityplanner-auth
ibmcloud ce app logs --application cityplanner-planner
ibmcloud ce app logs --application cityplanner-simulation
ibmcloud ce app logs --application cityplanner-document
ibmcloud ce app logs --application cityplanner-parser
ibmcloud ce app logs --application cityplanner-api
```

### 3. Test Health Endpoints

```bash
# Test auth service
curl http://cityplanner-auth.<region>.codeengine.appdomain.cloud/api/health

# Test planner agent
curl http://cityplanner-planner.<region>.codeengine.appdomain.cloud/health

# Test simulation engine
curl http://cityplanner-simulation.<region>.codeengine.appdomain.cloud/health

# Test document processor
curl http://cityplanner-document.<region>.codeengine.appdomain.cloud/health

# Test parser
curl http://cityplanner-parser.<region>.codeengine.appdomain.cloud/health

# Test API gateway
curl http://cityplanner-api.<region>.codeengine.appdomain.cloud/health
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Verify API key is correct and has proper permissions
   - Ensure project ID is in correct UUID format
   - Check that the API key has access to the specified project

2. **Model Not Found Errors**:
   - Verify model names are correct
   - Check that the models are available in your Watson AI region
   - Ensure your account has access to the specified models

3. **Database Connection Issues**:
   - Verify database connection string format
   - Check database credentials
   - Ensure database is accessible from Code Engine

4. **Service Communication Issues**:
   - Verify service URLs are correctly configured
   - Check that all services are running
   - Ensure proper network configuration

### Checking Logs

```bash
# Check specific application logs
ibmcloud ce app logs --application <app-name> --follow

# Check recent logs
ibmcloud ce app logs --application <app-name> --tail 100
```

### Scaling Applications

```bash
# Scale application instances
ibmcloud ce app update --name <app-name> --min-scale 1 --max-scale 5
```

## Security Considerations

1. Store API keys securely using IBM Cloud Secrets Manager
2. Use IAM roles to limit access to Watson AI services
3. Rotate API keys regularly
4. Monitor API usage for unusual activity

## Cost Management

Watson AI services incur costs based on usage:
- Monitor token usage for language models
- Set up billing alerts in IBM Cloud
- Consider using smaller models for development/testing

For more information, refer to the [IBM Watson AI documentation](https://cloud.ibm.com/docs/watsonx).