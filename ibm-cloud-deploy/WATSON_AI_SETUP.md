# Watson AI Setup for IBM Cloud Deployment

This guide provides instructions for setting up IBM Watson AI services for the Agentic City Planner application when deploying to IBM Cloud.

## Prerequisites

1. IBM Cloud account
2. IBM Cloud CLI installed
3. Access to IBM Watson AI services

## Setting up Watson AI Services

### 1. Create Watson AI Project

1. Go to [IBM Watson AI](https://dataplatform.cloud.ibm.com/)
2. Create a new project or use an existing one
3. Note down your Project ID (a UUID format string)

### 2. Obtain Watson AI API Key

1. In the IBM Watson AI console, go to "Manage" > "Access (IAM)"
2. Create a new API key or use an existing one
3. Copy the API key for later use

### 3. Configure Environment Variables

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

### 4. Setting Environment Variables in Code Engine

When deploying to IBM Cloud Code Engine, set the environment variables using the CLI:

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

### 5. Watson AI Models

The application uses the following Watson AI models:

#### For Planning Decisions:
- Model: `ibm/granite-3-2-8b-instruct`
- Purpose: Natural language processing for city planning decisions

#### For Document Processing:
- Embedding Model: `ibm/slate-125m-english-rtrvr`
- Purpose: Converting documents to vector embeddings for similarity search

### 6. Troubleshooting Watson AI Integration

#### Common Issues:

1. **Authentication Errors**:
   - Verify API key is correct and has proper permissions
   - Ensure project ID is in correct UUID format
   - Check that the API key has access to the specified project

2. **Model Not Found Errors**:
   - Verify model names are correct
   - Check that the models are available in your Watson AI region
   - Ensure your account has access to the specified models

3. **Rate Limiting**:
   - Watson AI services have rate limits
   - Implement proper error handling and retry logic in production

#### Testing Watson AI Connection:

You can test your Watson AI configuration by checking the health endpoints:

```bash
# Test planner agent
curl http://cityplanner-planner.<region>.codeengine.appdomain.cloud/health

# Test document processor
curl http://cityplanner-document.<region>.codeengine.appdomain.cloud/health
```

### 7. Security Considerations

1. Store API keys securely using IBM Cloud Secrets Manager
2. Use IAM roles to limit access to Watson AI services
3. Rotate API keys regularly
4. Monitor API usage for unusual activity

### 8. Cost Management

Watson AI services incur costs based on usage:
- Monitor token usage for language models
- Set up billing alerts in IBM Cloud
- Consider using smaller models for development/testing

For more information, refer to the [IBM Watson AI documentation](https://cloud.ibm.com/docs/watsonx).