"""
Document Processor API Package
A FastAPI-based service for document retrieval and feedback processing
"""

__version__ = "1.0.0"
__author__ = "Dev D - IBM Hackathon Team"

from .main import app
from .document_processor import DocumentProcessor
from .feedback_analyzer import FeedbackAnalyzer
from .models import *

__all__ = [
    "app",
    "DocumentProcessor", 
    "FeedbackAnalyzer",
    "QueryRequest",
    "QueryResponse", 
    "FeedbackRequest",
    "FeedbackResponse",
    "DocumentInfo",
    "FeedbackSummary"
]
