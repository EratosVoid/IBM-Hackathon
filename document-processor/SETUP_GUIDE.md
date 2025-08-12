# WatsonX Setup Guide

## The Problem
Your application is currently failing because it's trying to use "agentic-city-planner" as a project ID, but this is not a valid IBM WatsonX project GUID.

## What You Need
A valid IBM WatsonX project GUID in this format: `12ac4cf1-252f-424b-b52d-5cdd9814987f`

## How to Get Your Project ID

### Option 1: IBM WatsonX Console
1. Go to [IBM WatsonX Console](https://us-south.ml.cloud.ibm.com/)
2. Sign in with your IBM account
3. Look for "Projects" in the left sidebar
4. Find your project (it might be named "agentic-city-planner")
5. Click on the project
6. Copy the Project ID (it will be a long string like `12ac4cf1-252f-424b-b52d-5cdd9814987f`)

### Option 2: Check Your IBM Cloud Account
1. Go to [IBM Cloud Console](https://cloud.ibm.com/)
2. Navigate to WatsonX AI
3. Look for your project
4. Copy the Project ID

## How to Set the Environment Variable

### Option 1: Create a .env file
Create a file called `.env` in the `document-processor` directory with:

```bash
WATSONX_APIKEY=
WATSONX_URL=https://us-south.ml.cloud.ibm.com
WATSONX_PROJECT_ID=YOUR_ACTUAL_PROJECT_GUID_HERE
EMBEDDING_MODEL_ID=ibm/slate-125m-english-rtrvr
```

### Option 2: Set environment variables in your terminal
```bash
export WATSONX_PROJECT_ID="your-actual-project-guid-here"
export WATSONX_APIKEY=""
export WATSONX_URL="https://us-south.ml.cloud.ibm.com"
```

### Option 3: Set in your shell profile
Add the export commands to your `~/.zshrc` file (since you're using zsh).

## Test Your Setup
After setting the environment variable, restart your application:

```bash
cd document-processor
python run.py
```

## Common Issues
- **Invalid project GUID**: Make sure you're using the actual GUID, not the project name
- **Project not found**: Ensure you have access to the project in your IBM account
- **API key expired**: Check if your API key is still valid

## Need Help?
If you still can't find your project ID, you may need to:
1. Create a new project in WatsonX
2. Contact IBM support
3. Check your IBM Cloud billing and access permissions
