# Document Processor API Documentation

## Overview

The Document Processor API is a FastAPI-based service that provides document retrieval and feedback processing capabilities using LlamaIndex RAG (Retrieval-Augmented Generation) and IBM WatsonX with the granite-3-2-8b-instruct model. This service is designed to interface directly with the Planner Agent via summary/action recommendations.

**Note:** This service uses the official LlamaIndex WatsonX integration as documented at: https://docs.llamaindex.ai/en/stable/examples/embeddings/ibm_watsonx/

## Base URL

```
http://localhost:8001
```

## Authentication

Currently, the API runs without authentication. In production, you should implement proper authentication mechanisms.

## WatsonX Configuration

The service requires proper WatsonX configuration to function optimally:

### Required Environment Variables
- `WATSONX_APIKEY`: Your IBM WatsonX API key
- `WATSONX_PROJECT_ID`: Your WatsonX project ID  
- `WATSONX_URL`: WatsonX service URL (default: https://us-south.ml.cloud.ibm.com)

### Optional Environment Variables (Cloud Pak for Data)
- `WATSONX_TOKEN`: Token for accessing CPD cluster
- `WATSONX_PASSWORD`: Password for accessing CPD cluster
- `WATSONX_USERNAME`: Username for accessing CPD cluster
- `WATSONX_INSTANCE_ID`: Instance ID for accessing CPD cluster

### Model Configuration
- `EMBEDDING_MODEL_ID`: WatsonX embedding model ID (default: ibm/slate-125m-english-rtrvr)
- `MODEL_NAME`: WatsonX LLM model name (default: granite-3-2-8b-instruct)

## API Endpoints

### 1. Health Check

#### GET /
Returns the health status of the API.

**Response:**
```json
{
  "status": "healthy",
  "message": "Document Processor API is running"
}
```

#### GET /health
Alternative health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "message": "Service is operational"
}
```

### 2. Document Management

#### POST /documents/upload
Upload a policy document for processing and indexing.

**Request:**
- **Content-Type:** `multipart/form-data`
- **Body:** File upload with key `file`

**Supported File Types:**
- PDF (.pdf)
- Word documents (.docx)
- Text files (.txt)
- Markdown files (.md)

**Response:**
```json
{
  "message": "Document uploaded successfully",
  "document_id": "uuid-string",
  "filename": "policy_document.pdf"
}
```

**Example (cURL):**
```bash
curl -X POST "http://localhost:8001/documents/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@policy_document.pdf"
```

#### GET /documents/list
List all uploaded documents with their metadata.

**Response:**
```json
[
  {
    "id": "uuid-string",
    "filename": "policy_document.pdf",
    "upload_date": "2024-01-15T10:30:00",
    "file_size": 1024000,
    "file_type": ".pdf",
    "status": "processed",
    "metadata": null
  }
]
```

#### DELETE /documents/{doc_id}
Delete a document by its ID.

**Response:**
```json
{
  "message": "Document uuid-string deleted successfully"
}
```

### 3. Query & Retrieval

#### POST /query
Query policy documents using RAG (Retrieval-Augmented Generation).

**Request Body:**
```json
{
  "query": "What are the zoning regulations for commercial areas?",
  "max_results": 5,
  "include_metadata": true
}
```

**Response:**
```json
{
  "query": "What are the zoning regulations for commercial areas?",
  "answer": "Based on the policy documents, commercial areas are subject to...",
  "sources": [
    {
      "content": "Commercial zoning regulations specify that...",
      "document_id": "doc-123",
      "score": 0.95
    }
  ],
  "confidence_score": 0.8,
  "processing_time": 1.25,
  "timestamp": "2024-01-15T10:30:00"
}
```

**Example (cURL):**
```bash
curl -X POST "http://localhost:8001/query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the zoning regulations for commercial areas?",
    "max_results": 5
  }'
```

#### GET /query/history
Get recent query history.

**Query Parameters:**
- `limit` (optional): Number of recent queries to return (default: 10)

**Response:**
```json
{
  "query_history": [
    {
      "query": "What are the zoning regulations for commercial areas?",
      "timestamp": "2024-01-15T10:30:00",
      "response_time": 1.25,
      "results_count": 3
    }
  ]
}
```

### 4. Feedback Processing

#### POST /feedback/analyze
Analyze feedback for sentiment and extract topics.

**Request Body:**
```json
{
  "feedback_text": "The new park design is excellent and well-planned!",
  "user_id": "user123",
  "category": "parks"
}
```

**Response:**
```json
{
  "feedback_text": "The new park design is excellent and well-planned!",
  "sentiment_score": 0.8,
  "sentiment_label": "positive",
  "topics": ["environment", "aesthetics"],
  "confidence": 0.85,
  "processing_time": 0.15,
  "timestamp": "2024-01-15T10:30:00"
}
```

**Example (cURL):**
```bash
curl -X POST "http://localhost:8001/feedback/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "feedback_text": "The new park design is excellent and well-planned!"
  }'
```

#### POST /feedback/classify
Classify feedback into predefined categories with priority levels.

**Request Body:**
```json
{
  "feedback_text": "The new park design is excellent and well-planned!"
}
```

**Response:**
```json
{
  "classification": {
    "category": "environment",
    "confidence": 0.85,
    "subcategories": ["green", "park", "trees", "pollution", "sustainability", "climate"],
    "priority": "low"
  }
}
```

#### GET /feedback/summary
Get feedback summary statistics.

**Response:**
```json
{
  "total_feedback_count": 25,
  "sentiment_distribution": {
    "positive": 15,
    "neutral": 7,
    "negative": 3
  },
  "category_distribution": {
    "environment": 8,
    "infrastructure": 6,
    "safety": 4,
    "aesthetics": 7
  },
  "average_sentiment_score": 0.45,
  "recent_feedback_count": 5,
  "last_updated": "2024-01-15T10:30:00"
}
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- **400 Bad Request:** Invalid input data
- **404 Not Found:** Resource not found
- **500 Internal Server Error:** Server-side error

**Error Response Format:**
```json
{
  "detail": "Error description"
}
```

## Data Models

### QueryRequest
```python
{
  "query": str,                    # Required: The query text
  "max_results": Optional[int],    # Optional: Max results (default: 5)
  "include_metadata": Optional[bool] # Optional: Include metadata (default: true)
}
```

### FeedbackRequest
```python
{
  "feedback_text": str,            # Required: The feedback text
  "user_id": Optional[str],        # Optional: User identifier
  "category": Optional[str]        # Optional: Feedback category
}
```

### DocumentInfo
```python
{
  "id": str,                       # Document unique identifier
  "filename": str,                 # Original filename
  "upload_date": datetime,         # Upload timestamp
  "file_size": int,                # File size in bytes
  "file_type": str,                # File extension
  "status": str,                   # Processing status
  "metadata": Optional[Dict]       # Additional metadata
}
```

## Usage Examples

### Complete Workflow Example

1. **Upload a Policy Document:**
```bash
curl -X POST "http://localhost:8001/documents/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@zoning_policies.pdf"
```

2. **Query the Document:**
```bash
curl -X POST "http://localhost:8001/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the height restrictions for buildings?"}'
```

3. **Analyze Feedback:**
```bash
curl -X POST "http://localhost:8001/feedback/analyze" \
  -H "Content-Type: application/json" \
  -d '{"feedback_text": "The building height restrictions are too strict and limit development."}'
```

4. **Get Feedback Summary:**
```bash
curl -X GET "http://localhost:8001/feedback/summary"
```

## Integration with Planner Agent

This service is designed to interface directly with the Planner Agent by providing:

1. **Document Retrieval:** RAG-based answers to policy questions using WatsonX embeddings and granite-3-2-8b-instruct LLM
2. **Feedback Analysis:** Sentiment and topic classification
3. **Action Recommendations:** Priority-based feedback categorization
4. **Summary Statistics:** Overview of public sentiment and concerns

The Planner Agent can use these endpoints to:
- Retrieve relevant policy information for decision-making
- Understand public sentiment on proposed changes
- Prioritize actions based on feedback analysis
- Generate comprehensive reports for stakeholders

## WatsonX Integration Details

This service implements the official LlamaIndex WatsonX integration with dual model support:

### Embedding Model
- **Model**: `ibm/slate-125m-english-rtrvr`
- **Purpose**: Document vectorization and similarity search
- **Features**: Optimized for retrieval tasks, 125M parameters

### LLM Model
- **Model**: `granite-3-2-8b-instruct`
- **Purpose**: Natural language understanding and response generation
- **Features**: 8B parameter model optimized for instruction following
- **Capabilities**: Advanced reasoning, context understanding, and response generation

### Integration Features
- **Dual Model Architecture**: Separate models for embeddings and LLM tasks
- **Authentication:** Supports both API key and Cloud Pak for Data authentication
- **Model Selection:** Configurable model IDs via environment variables
- **Fallback:** Gracefully falls back to local models when WatsonX is unavailable
- **Performance:** Optimized for production use with proper error handling

## Performance Considerations

- **Document Processing:** Large documents may take time to process and index
- **Query Response:** RAG queries typically take 1-3 seconds depending on complexity
- **Feedback Analysis:** Sentiment analysis is typically completed in under 200ms
- **Concurrent Requests:** The API supports multiple concurrent requests
- **WatsonX Latency:** Embedding and LLM generation depends on WatsonX service response times
- **Model Performance:** granite-3-2-8b-instruct provides high-quality responses with reasonable latency

## Monitoring and Logging

The API provides comprehensive logging for:
- Document uploads and processing
- Query execution and response times
- Feedback analysis results
- WatsonX integration status and errors
- Model performance metrics
- Error conditions and stack traces

Log levels can be configured via the `LOG_LEVEL` environment variable.
