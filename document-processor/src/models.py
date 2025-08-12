"""
Pydantic models for Document Processor API
Defines the data structures for requests and responses
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Document Management Models
class DocumentInfo(BaseModel):
    """Document information model"""
    id: str
    filename: str
    upload_date: datetime
    file_size: int
    file_type: str
    status: str = "processed"
    metadata: Optional[Dict[str, Any]] = None

# Query Models
class QueryRequest(BaseModel):
    """Query request model"""
    query: str = Field(..., description="The query to search for in documents")
    max_results: Optional[int] = Field(5, description="Maximum number of results to return")
    include_metadata: Optional[bool] = Field(True, description="Include document metadata in results")

class QueryResponse(BaseModel):
    """Query response model"""
    query: str
    answer: str
    sources: List[Dict[str, Any]]
    confidence_score: float
    processing_time: float
    timestamp: datetime = Field(default_factory=datetime.now)

class QueryHistory(BaseModel):
    """Query history item"""
    query: str
    timestamp: datetime
    response_time: float
    results_count: int

# Feedback Models
class FeedbackRequest(BaseModel):
    """Feedback request model"""
    feedback_text: str = Field(..., description="The feedback text to analyze")
    user_id: Optional[str] = Field(None, description="Optional user identifier")
    category: Optional[str] = Field(None, description="Optional feedback category")

class FeedbackResponse(BaseModel):
    """Feedback analysis response model"""
    feedback_text: str
    sentiment_score: float
    sentiment_label: str
    topics: List[str]
    confidence: float
    processing_time: float
    timestamp: datetime = Field(default_factory=datetime.now)

class FeedbackClassification(BaseModel):
    """Feedback classification result"""
    category: str
    confidence: float
    subcategories: List[str]
    priority: str

class FeedbackSummary(BaseModel):
    """Feedback summary statistics"""
    total_feedback_count: int
    sentiment_distribution: Dict[str, int]
    category_distribution: Dict[str, int]
    average_sentiment_score: float
    recent_feedback_count: int
    last_updated: datetime = Field(default_factory=datetime.now)

# Error Models
class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    detail: str
    timestamp: datetime = Field(default_factory=datetime.now)
    request_id: Optional[str] = None

# Success Models
class SuccessResponse(BaseModel):
    """Success response model"""
    message: str
    data: Optional[Any] = None
    timestamp: datetime = Field(default_factory=datetime.now)
