# IBM Hackathon - Document Processor with WatsonX

A comprehensive document processing and RAG (Retrieval-Augmented Generation) system built for IBM's hackathon, featuring WatsonX integration for AI-powered document analysis and querying.

## 🚀 Features

- **Document Processing**: Upload and process PDF, DOCX, TXT, and Markdown files
- **WatsonX Integration**: Uses IBM WatsonX for embeddings and LLM-powered queries
- **RAG System**: Advanced retrieval and generation capabilities
- **FastAPI Backend**: Modern, fast REST API with automatic documentation
- **ChromaDB Vector Store**: Efficient vector storage and similarity search
- **Feedback Analysis**: Sentiment analysis and feedback classification
- **Planner Agent**: AI-powered task planning and execution

## 🏗️ Architecture

```
IBM-Hackathon/
├── document-processor/          # Main document processing service
│   ├── src/                    # Core application code
│   ├── requirements.txt        # Python dependencies
│   ├── run.py                 # Service entry point
│   ├── README.md              # Service documentation
│   ├── SETUP_GUIDE.md         # Setup instructions
│   ├── API_DOCUMENTATION.md   # API reference
│   └── env.example            # Environment variables template
├── planner-agent/              # AI planning and task management
│   ├── src/                   # Planner agent implementation
│   ├── requirements.txt       # Dependencies
│   └── README.md             # Agent documentation
└── .gitignore                 # Git ignore rules
```

## 🛠️ Technology Stack

- **Backend**: FastAPI, Python 3.11+
- **AI/ML**: IBM WatsonX, LlamaIndex
- **Vector Database**: ChromaDB
- **Document Processing**: PDF, DOCX, TXT, Markdown support
- **API**: RESTful API with OpenAPI documentation

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- IBM WatsonX account and API credentials
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd IBM-Hackathon
   ```

2. **Set up the document processor**
   ```bash
   cd document-processor
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your WatsonX credentials
   ```

4. **Start the service**
   ```bash
   python run.py
   ```

### Environment Variables

Create a `.env` file in the `document-processor/` directory:

```env
# WatsonX Configuration
WATSONX_APIKEY=your_api_key_here
WATSONX_URL=https://us-south.ml.cloud.ibm.com
WATSONX_PROJECT_ID=your_project_guid_here

# Model Configuration
MODEL_NAME=ibm/granite-3-2-8b-instruct
EMBEDDING_MODEL_ID=ibm/slate-125m-english-rtrvr

# API Configuration
API_HOST=0.0.0.0
API_PORT=8001

# ChromaDB Configuration
CHROMA_PERSIST_DIR=./chroma_db

# Logging
LOG_LEVEL=INFO
```

## 📚 API Usage

### Document Upload
```bash
curl -X POST "http://localhost:8001/documents/upload" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@your_document.pdf"
```

### Query Documents
```bash
curl -X POST "http://localhost:8001/query" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the main topics?",
    "max_results": 5,
    "include_metadata": true
  }'
```

### Feedback Analysis
```bash
curl -X POST "http://localhost:8001/feedback/analyze" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "feedback_text": "Great system! Very helpful.",
    "user_id": "user123"
  }'
```

## 🔧 Development

### Running Tests
```bash
cd document-processor
python -m pytest tests/
```

### Code Quality
- Follow PEP 8 style guidelines
- Use type hints
- Add docstrings to functions and classes

## 📖 Documentation

- [API Documentation](document-processor/API_DOCUMENTATION.md)
- [Setup Guide](document-processor/SETUP_GUIDE.md)
- [Planner Agent README](planner-agent/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is part of IBM's hackathon and follows IBM's development guidelines.

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information

## 🎯 Project Goals

- Demonstrate WatsonX integration capabilities
- Build a production-ready document processing system
- Showcase modern AI/ML architecture patterns
- Provide a foundation for enterprise document AI solutions
