# Planner Agent - IBM Hackathon 2025

Dev A's component for the Agentic City Planner project.

## Overview
Central reasoning brain that processes user requests and orchestrates external tools for city planning decisions.

## Hackathon Compliance
- ✅ Uses allowed models: `ibm/granite-3-2-8b-instruct`, `meta-llama/llama-3-2-3b-instruct`
- ✅ Local development only (no watsonx.ai deployment)
- ✅ API-based access to IBM foundation models
- ✅ No restricted models used

## Architecture
```
User Prompt → Intent Classification → Tool Orchestration → Rationale Generation → Layout Changes
```

## Setup

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your IBM watsonx API key
   ```

3. **Run Tests**
   ```bash
   python -m pytest tests/
   ```

4. **Start API Server**
   ```bash
   python -m uvicorn src.api:app --reload --port 8000
   ```

## API Endpoints

### Main Processing
- `POST /plan` - Process city planning requests
- `GET /health` - Health check

### Tool Management  
- `POST /register-tool` - Register external tools
- `GET /tools` - List registered tools

### Session Management
- `GET /sessions/{session_id}/history` - Get conversation history

## Integration Points

### With Other Team Members:
- **Dev B (Simulation)**: Receives tool invocation requests
- **Dev C (Data)**: Gets parsed city data
- **Dev D (Retrieval)**: Sends policy queries  
- **Dev E (Frontend)**: Receives user prompts, sends responses

## Example Usage

```python
import requests

# Process planning request
response = requests.post('http://localhost:8000/plan', json={
    "user_prompt": "Add green space downtown",
    "session_id": "user123"
})

print(response.json())
```

## Development Status
- [x] Basic agent framework
- [x] Intent classification
- [x] Tool orchestration structure
- [x] Session memory management
- [x] REST API endpoints
- [ ] Tool integration testing
- [ ] Enhanced rationale generation
- [ ] Error handling improvements