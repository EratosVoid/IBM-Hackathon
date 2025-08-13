"""
Shared Data Models for Agentic City Planner
This file contains common data models used across all services for consistent communication.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class ZoneType(str, Enum):
    """Types of zones in the city"""
    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"
    INDUSTRIAL = "industrial"
    GREEN_SPACE = "green_space"
    MIXED_USE = "mixed_use"
    TRANSPORTATION = "transportation"
    PUBLIC_SERVICE = "public_service"

class Location(BaseModel):
    """Location coordinates"""
    x: float = Field(..., description="X coordinate")
    y: float = Field(..., description="Y coordinate")

class Zone(BaseModel):
    """Represents a zone in the city"""
    id: str = Field(..., description="Unique identifier for the zone")
    type: ZoneType = Field(..., description="Type of zone")
    area: float = Field(..., description="Area of the zone in square units")
    location: Location = Field(..., description="Location of the zone")
    properties: Dict[str, Any] = Field(default={}, description="Additional properties")

class InfrastructureType(str, Enum):
    """Types of infrastructure"""
    ROAD = "road"
    UTILITY = "utility"
    BUILDING = "building"

class InfrastructureEdit(BaseModel):
    """Represents an infrastructure edit"""
    type: InfrastructureType = Field(..., description="Type of infrastructure")
    action: str = Field(..., description="Action to perform (add|modify|remove)")
    specifications: Dict[str, Any] = Field(default={}, description="Infrastructure specifications")

class CityProject(BaseModel):
    """Represents a city planning project"""
    id: str = Field(..., description="Unique identifier for the project")
    name: str = Field(..., description="Name of the project")
    description: str = Field(..., description="Description of the project")
    city_type: str = Field(..., description="Type of city (new|existing)")
    constraints: Dict[str, Any] = Field(default={}, description="Project constraints")
    status: str = Field(..., description="Current status of the project")
    created_by: str = Field(..., description="User who created the project")
    created_at: datetime = Field(..., description="When the project was created")
    last_modified: datetime = Field(..., description="When the project was last modified")
    city_data: Dict[str, Any] = Field(default={}, description="City data structure")

class ZoningPlan(BaseModel):
    """Represents a zoning plan"""
    zones: List[Zone] = Field(..., description="List of zones in the plan")
    infrastructure_edits: List[InfrastructureEdit] = Field(default=[], description="Infrastructure edits")
    project_id: str = Field(..., description="Project ID this plan belongs to")

class SimulationInput(BaseModel):
    """Input data for simulations"""
    zoning_plan: ZoningPlan = Field(..., description="Zoning plan for simulation")
    traffic_inputs: Dict[str, Any] = Field(..., description="Traffic-related inputs")
    simulation_options: Dict[str, Any] = Field(..., description="Simulation options")

class SimulationResult(BaseModel):
    """Result of a simulation"""
    simulation_id: str = Field(..., description="Unique simulation identifier")
    timestamp: datetime = Field(..., description="Simulation timestamp")
    inputs_ref: str = Field(..., description="Reference to input data")
    results: Dict[str, Any] = Field(..., description="Simulation results")
    summary: Dict[str, Any] = Field(..., description="Simulation summary")
    update_diffs: Dict[str, Any] = Field(..., description="Map update differences")

class PlannerRequest(BaseModel):
    """Request to the planner agent"""
    user_prompt: str = Field(..., description="User's natural language request")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Context from previous interactions")
    session_id: Optional[str] = Field(default=None, description="Session identifier")
    project_id: Optional[str] = Field(default=None, description="Project identifier")

class PlannerResponse(BaseModel):
    """Response from the planner agent"""
    tool_invocations: List[Dict[str, Any]] = Field(..., description="List of tools to invoke")
    rationale: str = Field(..., description="Explanation of decisions")
    layout_changes: List[Dict[str, Any]] = Field(..., description="Specific layout change instructions")
    session_id: str = Field(..., description="Session identifier")

class DocumentInfo(BaseModel):
    """Information about a document"""
    id: str = Field(..., description="Unique identifier for the document")
    filename: str = Field(..., description="Name of the file")
    upload_date: datetime = Field(..., description="When the document was uploaded")
    file_size: int = Field(..., description="Size of the file in bytes")
    file_type: str = Field(..., description="Type of the file")
    status: str = Field(..., description="Processing status")

class QueryRequest(BaseModel):
    """Request to query documents"""
    query: str = Field(..., description="Query text")
    max_results: int = Field(default=5, description="Maximum number of results to return")
    include_metadata: bool = Field(default=True, description="Whether to include metadata")

class QueryResponse(BaseModel):
    """Response from document query"""
    query: str = Field(..., description="Original query")
    answer: str = Field(..., description="Answer to the query")
    sources: List[Dict[str, Any]] = Field(..., description="Source documents")
    confidence_score: float = Field(..., description="Confidence score of the answer")
    processing_time: float = Field(..., description="Time taken to process the query")

class FeedbackRequest(BaseModel):
    """Request to analyze feedback"""
    feedback_text: str = Field(..., description="Feedback text to analyze")

class FeedbackResponse(BaseModel):
    """Response from feedback analysis"""
    feedback_text: str = Field(..., description="Original feedback text")
    sentiment_score: float = Field(..., description="Sentiment score (-1 to 1)")
    sentiment_label: str = Field(..., description="Sentiment label (positive|neutral|negative)")
    topics: List[str] = Field(..., description="Topics identified in the feedback")
    confidence: float = Field(..., description="Confidence score of the analysis")
    processing_time: float = Field(..., description="Time taken to process the feedback")

# Service registration models
class ServiceRegistration(BaseModel):
    """Service registration information"""
    service_name: str = Field(..., description="Name of the service")
    endpoint_url: str = Field(..., description="URL of the service endpoint")
    status: str = Field(..., description="Current status of the service")
    registered_at: datetime = Field(..., description="When the service was registered")

class ServiceDiscoveryResponse(BaseModel):
    """Response from service discovery"""
    services: List[ServiceRegistration] = Field(..., description="List of registered services")
    timestamp: datetime = Field(..., description="Timestamp of the discovery")

# Authentication models
class User(BaseModel):
    """User information"""
    id: int = Field(..., description="User ID")
    email: str = Field(..., description="User email")
    name: str = Field(..., description="User name")

class AuthResponse(BaseModel):
    """Response from authentication"""
    success: bool = Field(..., description="Whether authentication was successful")
    message: str = Field(..., description="Response message")
    user: Optional[User] = Field(default=None, description="User information")
    token: Optional[str] = Field(default=None, description="Authentication token")

# Parser models
class ParsedFeature(BaseModel):
    """A parsed feature from a blueprint"""
    type: str = Field(..., description="Type of feature")
    geometry: Dict[str, Any] = Field(..., description="Geometric representation")
    metadata: Dict[str, Any] = Field(default={}, description="Additional metadata")

class ParsedBlueprint(BaseModel):
    """A parsed blueprint"""
    zones: List[ParsedFeature] = Field(..., description="Parsed zones")
    roads: List[ParsedFeature] = Field(..., description="Parsed roads")
    services: List[ParsedFeature] = Field(..., description="Parsed services")
    buildings: List[ParsedFeature] = Field(..., description="Parsed buildings")
    architectures: List[ParsedFeature] = Field(..., description="Parsed architectures")
    parks: List[ParsedFeature] = Field(..., description="Parsed parks")
    water_bodies: List[ParsedFeature] = Field(..., description="Parsed water bodies")
    other_features: List[ParsedFeature] = Field(..., description="Other parsed features")