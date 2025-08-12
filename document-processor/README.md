# Document Processor API

A FastAPI-based service for document retrieval and feedback processing using LlamaIndex RAG (Retrieval-Augmented Generation) and IBM WatsonX with the granite-3-2-8b-instruct model.

## Features

- **Document Retrieval**: Uses LlamaIndex + RAG to answer queries from policy documents
- **Feedback Classification**: Classifies feedback using sentiment and topic classifiers
- **RESTful API**: Clean API endpoints for integration with other services
- **Vector Storage**: ChromaDB-based vector storage for efficient document retrieval
- **Sentiment Analysis**: TextBlob-based sentiment classification
- **WatsonX Integration**: Powered by IBM WatsonX for embeddings and LLM using the granite-3-2-8b-instruct model

## API Endpoints

### Document Management
- `POST /documents/upload` - Upload policy documents
- `GET /documents/list` - List all uploaded documents
- `DELETE /documents/{doc_id}` - Delete a document

### Query & Retrieval
- `POST /query` - Query policy documents using RAG
- `GET /query/history` - Get query history

### Feedback Processing
- `POST /feedback/analyze` - Analyze feedback sentiment and topics
- `POST /feedback/classify` - Classify feedback into categories
- `GET /feedback/summary` - Get feedback summary statistics

## Setup

### Quick Setup (Recommended)
1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the setup script:
```bash
chmod +x setup_env.sh
./setup_env.sh
```
This will prompt you for your IBM WatsonX Project ID and create a `.env` file automatically.

### Manual Setup
1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your WatsonX API key, project ID, and other configurations
```

3. Run the API:
```bash
uvicorn src.main:app --reload --host 0.0.0.0 --port 8001
# Or use the run script:
python run.py
```

## Environment Variables

### Required WatsonX Configuration
- `WATSONX_APIKEY`: Your IBM WatsonX API key
- `WATSONX_PROJECT_ID`: Your WatsonX project ID
- `WATSONX_URL`: WatsonX service URL (default: https://us-south.ml.cloud.ibm.com)

### Optional WatsonX Configuration (Cloud Pak for Data)
- `WATSONX_TOKEN`: Token for accessing CPD cluster
- `WATSONX_PASSWORD`: Password for accessing CPD cluster
- `WATSONX_USERNAME`: Username for accessing CPD cluster
- `WATSONX_INSTANCE_ID`: Instance ID for accessing CPD cluster

### Model Configuration
- `EMBEDDING_MODEL_ID`: WatsonX embedding model ID (default: ibm/slate-125m-english-rtrvr)
- `MODEL_NAME`: WatsonX LLM model name (default: granite-3-2-8b-instruct)

### Other Configuration
- `CHROMA_PERSIST_DIR`: Directory for ChromaDB persistence
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR)

## Usage Examples

### Upload a Document
```bash
curl -X POST "http://localhost:8001/documents/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@policy_document.pdf"
```

### Query Documents
```bash
curl -X POST "http://localhost:8001/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the zoning regulations for commercial areas?"}'
```

### Analyze Feedback
```bash
curl -X POST "http://localhost:8001/feedback/analyze" \
  -H "Content-Type: application/json" \
  -d '{"feedback_text": "The new park design is excellent and well-planned!"}'
```

## Architecture

- **FastAPI**: Modern, fast web framework for building APIs
- **LlamaIndex**: RAG framework for document retrieval and querying
- **WatsonX**: IBM's AI platform for embeddings and LLM using granite-3-2-8b-instruct
- **ChromaDB**: Vector database for storing document embeddings
- **TextBlob**: Simple sentiment analysis for feedback classification
- **Pydantic**: Data validation and serialization

## WatsonX Integration

This service uses the official LlamaIndex WatsonX integration as documented at:
https://docs.llamaindex.ai/en/stable/examples/embeddings/ibm_watsonx/

The integration provides:
- **Embeddings**: High-quality embeddings for document indexing using ibm/slate-125m-english-rtrvr
- **LLM**: Advanced language model capabilities using granite-3-2-8b-instruct
- **Support for various WatsonX models** and configurations
- **Proper authentication and configuration handling**
- **Fallback to local models when WatsonX is not available**

## Model Details

### Embedding Model
- **Model**: `ibm/slate-125m-english-rtrvr`
- **Purpose**: Document vectorization and similarity search
- **Features**: Optimized for retrieval tasks

### LLM Model
- **Model**: `granite-3-2-8b-instruct`
- **Purpose**: Natural language understanding and response generation
- **Features**: 8B parameter model optimized for instruction following

## Integration

This service is designed to interface directly with the Planner Agent via summary/action recommendations as specified in the task requirements.
