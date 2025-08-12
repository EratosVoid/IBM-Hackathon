"""
Main FastAPI application for Document Processor API
Handles document retrieval, RAG queries, and feedback processing
"""

import os
import logging
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv

from .document_processor import DocumentProcessor
from .feedback_analyzer import FeedbackAnalyzer
from .models import (
    QueryRequest, QueryResponse, FeedbackRequest, FeedbackResponse,
    DocumentInfo, FeedbackSummary
)

# Load environment variables
load_dotenv()

# Configure logging first
logging.basicConfig(level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")))
logger = logging.getLogger(__name__)

# Load environment variables from .env file if it exists
try:
    from dotenv import load_dotenv
    # Try multiple possible paths for .env file
    possible_env_paths = [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"),
        os.path.join(os.getcwd(), ".env"),
        ".env"
    ]
    
    env_loaded = False
    for env_path in possible_env_paths:
        logger.info(f"Trying to load .env from: {env_path}")
        if os.path.exists(env_path):
            load_dotenv(env_path)
            logger.info(f"Successfully loaded environment variables from {env_path}")
            env_loaded = True
            break
    
    if not env_loaded:
        logger.info("No .env file found, will use system environment variables")
        
except ImportError:
    logger.warning("python-dotenv not installed. Install with: pip install python-dotenv")
    logger.info("Will use system environment variables")

# Load WatsonX credentials from apikey.json if not already set (fallback)
if not os.getenv("WATSONX_APIKEY"):
    try:
        import json
        # Try multiple possible paths for apikey.json
        possible_paths = [
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "apikey.json"),
            os.path.join(os.getcwd(), "apikey.json"),
            "apikey.json"
        ]
        
        apikey_loaded = False
        for apikey_path in possible_paths:
            logger.info(f"Trying to load apikey.json from: {apikey_path}")
            if os.path.exists(apikey_path):
                with open(apikey_path, 'r') as f:
                    apikey_data = json.load(f)
                    os.environ["WATSONX_APIKEY"] = apikey_data.get("apikey", "")
                    logger.info(f"Successfully loaded WatsonX API key from {apikey_path}")
                    apikey_loaded = True
                    break
        
        if not apikey_loaded:
            logger.warning("apikey.json not found in any of the expected locations")
            logger.warning(f"Tried paths: {possible_paths}")
    except Exception as e:
        logger.warning(f"Could not load apikey.json: {e}")
        import traceback
        logger.warning(f"Traceback: {traceback.format_exc()}")

# Set default WatsonX configuration if not already set
if not os.getenv("WATSONX_URL"):
    os.environ["WATSONX_URL"] = "https://us-south.ml.cloud.ibm.com"
    logger.info("Set default WatsonX URL")

if not os.getenv("WATSONX_PROJECT_ID"):
    logger.error("WATSONX_PROJECT_ID environment variable is required but not set!")
    logger.error("Please set WATSONX_PROJECT_ID to your actual IBM WatsonX project GUID")
    logger.error("Example: WATSONX_PROJECT_ID=12ac4cf1-252f-424b-b52d-5cdd9814987f")
    logger.error("You can find this in your IBM WatsonX console under Projects")
    # Don't set a default - let the DocumentProcessor handle the error gracefully

if not os.getenv("EMBEDDING_MODEL_ID"):
    os.environ["EMBEDDING_MODEL_ID"] = "ibm/slate-125m-english-rtrvr"
    logger.info("Set default embedding model ID")

if not os.getenv("MODEL_NAME"):
    os.environ["MODEL_NAME"] = "ibm/granite-3-2-8b-instruct"
    logger.info("Set default model name")

# Manual fallback: If we still don't have the API key, try to set it directly
if not os.getenv("WATSONX_APIKEY"):
    try:
        # Hardcode the API key we know exists in apikey.json
        fallback_api_key = "iukgoMtME_wxRS6nm5PbJVD40e631n10D_l9ohIBzuK0"
        os.environ["WATSONX_APIKEY"] = fallback_api_key
        logger.info("Set WatsonX API key from fallback value")
    except Exception as e:
        logger.warning(f"Could not set fallback API key: {e}")

# Check environment variables
logger.info("Environment check:")
logger.info(f"  CHROMA_PERSIST_DIR: {os.getenv('CHROMA_PERSIST_DIR', './chroma_db')}")
logger.info(f"  LOG_LEVEL: {os.getenv('LOG_LEVEL', 'INFO')}")
logger.info(f"  WATSONX_APIKEY: {'SET' if os.getenv('WATSONX_APIKEY') else 'NOT SET'}")
logger.info(f"  WATSONX_URL: {os.getenv('WATSONX_URL', 'NOT SET')}")
logger.info(f"  WATSONX_PROJECT_ID: {os.getenv('WATSONX_PROJECT_ID', 'NOT SET')}")
logger.info(f"  EMBEDDING_MODEL_ID: {os.getenv('EMBEDDING_MODEL_ID', 'NOT SET')}")
logger.info(f"  Current working directory: {os.getcwd()}")
logger.info(f"  Script directory: {os.path.dirname(os.path.abspath(__file__))}")

# Initialize FastAPI app
app = FastAPI(
    title="Document Processor API",
    description="API for document retrieval and feedback processing using LlamaIndex RAG and WatsonX",
    version="1.0.0"
)

# Global variables for services
document_processor = None
feedback_analyzer = None

@app.on_event("startup")
async def startup_event():
    """Initialize services after app startup"""
    global document_processor, feedback_analyzer
    
    # Double-check environment variables are set
    logger.info("=== Startup Event - Environment Check ===")
    logger.info(f"WATSONX_APIKEY: {'SET' if os.getenv('WATSONX_APIKEY') else 'NOT SET'}")
    logger.info(f"WATSONX_URL: {os.getenv('WATSONX_URL', 'NOT SET')}")
    logger.info(f"WATSONX_PROJECT_ID: {os.getenv('WATSONX_PROJECT_ID', 'NOT SET')}")
    logger.info(f"EMBEDDING_MODEL_ID: {os.getenv('EMBEDDING_MODEL_ID', 'NOT SET')}")
    logger.info("=========================================")
    
    # Initialize services with error handling
    try:
        logger.info("Initializing DocumentProcessor...")
        document_processor = DocumentProcessor()
        logger.info("DocumentProcessor initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize DocumentProcessor: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        document_processor = None

    try:
        logger.info("Initializing FeedbackAnalyzer...")
        feedback_analyzer = FeedbackAnalyzer()
        logger.info("FeedbackAnalyzer initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize FeedbackAnalyzer: {e}")
        feedback_analyzer = None

# Pydantic models for API requests/responses
class HealthResponse(BaseModel):
    status: str
    message: str

@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint"""
    return HealthResponse(status="healthy", message="Document Processor API is running")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(status="healthy", message="Service is operational")

@app.get("/debug/env")
async def debug_environment():
    """Debug endpoint to check environment variables"""
    return {
        "WATSONX_APIKEY": "SET" if os.getenv("WATSONX_APIKEY") else "NOT SET",
        "WATSONX_URL": os.getenv("WATSONX_URL", "NOT SET"),
        "WATSONX_PROJECT_ID": os.getenv("WATSONX_PROJECT_ID", "NOT SET"),
        "EMBEDDING_MODEL_ID": os.getenv("EMBEDDING_MODEL_ID", "NOT SET"),
        "document_processor_initialized": document_processor is not None,
        "feedback_analyzer_initialized": feedback_analyzer is not None
    }

# Document Management Endpoints
@app.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload a policy document for processing"""
    try:
        # Check if DocumentProcessor is initialized
        if document_processor is None:
            raise HTTPException(
                status_code=500, 
                detail="DocumentProcessor service is not available. Check server logs for initialization errors."
            )
        
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Check file type
        allowed_extensions = ['.pdf', '.txt', '.docx', '.md']
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"File type {file_extension} not supported. Allowed: {allowed_extensions}"
            )
        
        # Process and store document
        doc_id = await document_processor.upload_document(file)
        
        return JSONResponse(
            status_code=201,
            content={
                "message": "Document uploaded successfully",
                "document_id": doc_id,
                "filename": file.filename
            }
        )
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")

@app.get("/documents/list", response_model=List[DocumentInfo])
async def list_documents():
    """List all uploaded documents"""
    try:
        # Check if DocumentProcessor is initialized
        if document_processor is None:
            raise HTTPException(
                status_code=500, 
                detail="DocumentProcessor service is not available. Check server logs for initialization errors."
            )
        
        documents = await document_processor.list_documents()
        return documents
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error listing documents: {str(e)}")

@app.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document by ID"""
    try:
        # Check if DocumentProcessor is initialized
        if document_processor is None:
            raise HTTPException(
                status_code=500, 
                detail="DocumentProcessor service is not available. Check server logs for initialization errors."
            )
        
        success = await document_processor.delete_document(doc_id)
        if success:
            return {"message": f"Document {doc_id} deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")
    except Exception as e:
        logger.error(f"Error deleting document {doc_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")

# Query & Retrieval Endpoints
@app.post("/query", response_model=QueryResponse)
async def query_documents(request: QueryRequest):
    """Query policy documents using RAG"""
    try:
        # Check if DocumentProcessor is initialized
        if document_processor is None:
            raise HTTPException(
                status_code=500, 
                detail="DocumentProcessor service is not available. Check server logs for initialization errors."
            )
        
        # Pass all parameters from the request to the query method
        response = await document_processor.query_documents(
            query=request.query,
            max_results=request.max_results,
            include_metadata=request.include_metadata
        )
        return response
    except Exception as e:
        logger.error(f"Error querying documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error querying documents: {str(e)}")

@app.get("/query/history")
async def get_query_history(limit: int = 10):
    """Get recent query history"""
    try:
        # Check if DocumentProcessor is initialized
        if document_processor is None:
            raise HTTPException(
                status_code=500, 
                detail="DocumentProcessor service is not available. Check server logs for initialization errors."
            )
        
        history = await document_processor.get_query_history(limit)
        return {"query_history": history}
    except Exception as e:
        logger.error(f"Error getting query history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting query history: {str(e)}")

# Feedback Processing Endpoints
@app.post("/feedback/analyze", response_model=FeedbackResponse)
async def analyze_feedback(request: FeedbackRequest):
    """Analyze feedback sentiment and extract topics"""
    try:
        # Check if FeedbackAnalyzer is initialized
        if feedback_analyzer is None:
            raise HTTPException(
                status_code=500, 
                detail="FeedbackAnalyzer service is not available. Check server logs for initialization errors."
            )
        
        response = await feedback_analyzer.analyze_feedback(request.feedback_text)
        return response
    except Exception as e:
        logger.error(f"Error analyzing feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing feedback: {str(e)}")

@app.post("/feedback/classify")
async def classify_feedback(request: FeedbackRequest):
    """Classify feedback into predefined categories"""
    try:
        # Check if FeedbackAnalyzer is initialized
        if feedback_analyzer is None:
            raise HTTPException(
                status_code=500, 
                detail="FeedbackAnalyzer service is not available. Check server logs for initialization errors."
            )
        
        classification = await feedback_analyzer.classify_feedback(request.feedback_text)
        return {"classification": classification}
    except Exception as e:
        logger.error(f"Error classifying feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error classifying feedback: {str(e)}")

@app.get("/feedback/summary", response_model=FeedbackSummary)
async def get_feedback_summary():
    """Get feedback summary statistics"""
    try:
        # Check if FeedbackAnalyzer is initialized
        if feedback_analyzer is None:
            raise HTTPException(
                status_code=500, 
                detail="FeedbackAnalyzer service is not available. Check server logs for initialization errors."
            )
        
        summary = await feedback_analyzer.get_feedback_summary()
        return summary
    except Exception as e:
        logger.error(f"Error getting feedback summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting feedback summary: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 8001)),
        reload=True
    )
