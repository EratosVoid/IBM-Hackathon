from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.security import HTTPBearer
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
import uvicorn
import os
import httpx
import logging
from src.data_processor import DataProcessor
from src.models.traffic_model import TrafficSimulationModel
from src.models.cost_model import CostEstimationModel
from src.models.pollution_model import PollutionSimulationModel
from src.result_aggregator import ResultAggregator
from src.summary_generator import SummaryGenerator
from src.overlay_generator import OverlayGenerator
from src.security import SecurityManager, get_current_user, require_user, require_admin
from src.performance_optimizer import performance_optimizer, PerformanceOptimizer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create the FastAPI app
app = FastAPI(
    title="Simulation Engine API",
    description="API for running urban planning simulations including traffic, cost, and pollution analysis",
    version="1.0.0"
)

# Initialize models and processors
data_processor = DataProcessor()
traffic_model = TrafficSimulationModel()
cost_model = CostEstimationModel()
pollution_model = PollutionSimulationModel()
result_aggregator = ResultAggregator()
summary_generator = SummaryGenerator()
overlay_generator = OverlayGenerator()
security_manager = SecurityManager()

# Security scheme
security = HTTPBearer()

# Health check endpoint (no authentication required)
@app.get("/health")
async def health_check():
    """
    Health check endpoint to verify the API is running
    """
    return {"status": "healthy", "message": "Simulation Engine is running"}

# Data models with validation
class Location(BaseModel):
    x: float = Field(..., description="X coordinate")
    y: float = Field(..., description="Y coordinate")

class Zone(BaseModel):
    id: str = Field(..., min_length=1, max_length=50, description="Zone identifier")
    type: str = Field(..., description="Zone type (residential|commercial|industrial|green_space)")
    
    @validator("type")
    def validate_zone_type(cls, v):
        allowed_types = ["residential", "commercial", "industrial", "green_space"]
        if v not in allowed_types:
            raise ValueError(f"Zone type must be one of {allowed_types}")
        return v
    
    area: float = Field(..., gt=0, description="Zone area in square units")
    location: Location = Field(..., description="Zone location coordinates")
    properties: dict = Field(default={}, description="Additional zone properties")

class ZoningPlan(BaseModel):
    zones: List[Zone] = Field(..., min_items=1, max_items=1000, description="List of zones")

class InfraEdit(BaseModel):
    type: str = Field(..., description="Infrastructure type (road|utility|building)")
    
    @validator("type")
    def validate_infra_type(cls, v):
        allowed_types = ["road", "utility", "building"]
        if v not in allowed_types:
            raise ValueError(f"Infrastructure type must be one of {allowed_types}")
        return v
    
    action: str = Field(..., description="Action to perform (add|modify|remove)")
    
    @validator("action")
    def validate_action(cls, v):
        allowed_actions = ["add", "modify", "remove"]
        if v not in allowed_actions:
            raise ValueError(f"Action must be one of {allowed_actions}")
        return v
    
    specifications: dict = Field(default={}, description="Infrastructure specifications")

class TrafficInputs(BaseModel):
    population_density: float = Field(..., ge=0, description="Population density")
    peak_hours: List[str] = Field(..., min_items=1, max_items=10, description="Peak traffic hours")
    vehicle_ownership: float = Field(..., ge=0, le=1, description="Vehicle ownership rate (0-1)")

class SimulationOptions(BaseModel):
    models: List[str] = Field(..., min_items=1, description="Models to run (traffic|cost|pollution)")
    
    @validator("models")
    def validate_models(cls, v):
        allowed_models = ["traffic", "cost", "pollution"]
        for model in v:
            if model not in allowed_models:
                raise ValueError(f"Model must be one of {allowed_models}")
        return v
    
    time_horizon: str = Field(..., min_length=1, max_length=50, description="Simulation time horizon")
    scenarios: List[str] = Field(..., min_items=1, max_items=5, description="Simulation scenarios")

class SimulationInput(BaseModel):
    zoning_plan: ZoningPlan = Field(..., description="Zoning plan for simulation")
    infra_edits: List[InfraEdit] = Field(default=[], max_items=100, description="Infrastructure edits")
    traffic_inputs: TrafficInputs = Field(..., description="Traffic-related inputs")
    simulation_options: SimulationOptions = Field(..., description="Simulation options")

class SimulationResult(BaseModel):
    simulation_id: str = Field(..., description="Unique simulation identifier")
    timestamp: str = Field(..., description="Simulation timestamp")
    inputs_ref: str = Field(..., description="Reference to input data")
    results: dict = Field(..., description="Simulation results")
    summary: dict = Field(..., description="Simulation summary")
    update_diffs: dict = Field(..., description="Map update differences")

# Custom exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Process errors to make them JSON serializable
    processed_errors = []
    for error in exc.errors():
        processed_error = error.copy()
        # Convert error object to string if it's not JSON serializable
        if "ctx" in processed_error and "error" in processed_error["ctx"]:
            processed_error["ctx"]["error"] = str(processed_error["ctx"]["error"])
        processed_errors.append(processed_error)
    
    logger.error(f"Validation error for {request.url}: {processed_errors}")
    return JSONResponse(
        status_code=422,
        content={"detail": processed_errors, "body": exc.body}
    )

# Custom exception handler for HTTP exceptions
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(f"HTTP error for {request.url}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

# Main simulation endpoint
@app.post("/simulate", response_model=SimulationResult)
async def run_simulation(input_data: SimulationInput, current_user: dict = Depends(require_user)):
    """
    Run a comprehensive simulation for a city plan
    """
    try:
        logger.info(f"Running comprehensive simulation for user {current_user.get('username')}")
        
        # Process input data
        processed_data = data_processor.process_input_data(input_data.dict())
        
        # Run selected simulations
        results = data_processor.run_selected_simulations(processed_data)
        
        # Generate summary
        summary = summary_generator.generate_comprehensive_summary(results)
        
        # Log the results before generating overlays
        logger.info(f"Results before overlay generation: {list(results.keys())}")
        
        # Generate overlays only for models that were run
        if "traffic" in results:
            logger.info("Generating traffic overlay")
            traffic_overlay = overlay_generator.generate_traffic_overlay(results["traffic"])
            results["traffic"]["spatial_overlay"] = traffic_overlay
         
        if "cost" in results:
            logger.info("Generating cost overlay")
            cost_overlay = overlay_generator.generate_cost_overlay(results["cost"])
            results["cost"]["spatial_overlay"] = cost_overlay
         
        if "pollution" in results:
            logger.info("Generating pollution overlay")
            pollution_overlay = overlay_generator.generate_pollution_overlay(results["pollution"])
            results["pollution"]["spatial_overlay"] = pollution_overlay
         
        # Generate combined overlay if at least one model was run
        if results:
            logger.info("Generating combined overlay")
            combined_overlay = overlay_generator.generate_combined_overlay(results)
            results["combined_overlay"] = combined_overlay
        
        return SimulationResult(
            simulation_id="sim_12345",
            timestamp="2023-01-01T00:00:00Z",
            inputs_ref="input_12345",
            results=results,
            summary=summary,
            update_diffs={}
        )
    except Exception as e:
        logger.error(f"Simulation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

# Traffic simulation endpoint
@app.post("/simulate/traffic", response_model=SimulationResult)
async def run_traffic_simulation(input_data: SimulationInput, current_user: dict = Depends(require_user)):
    """
    Run traffic flow simulation
    """
    try:
        logger.info(f"Running traffic simulation for user {current_user.get('username')}")
        
        zoning_plan = input_data.zoning_plan.dict()
        infra_edits = [edit.dict() for edit in input_data.infra_edits]
        traffic_inputs = input_data.traffic_inputs.dict()
        
        # Run traffic simulation
        traffic_results = traffic_model.run_simulation(zoning_plan, infra_edits, traffic_inputs)
        
        # Generate overlay
        traffic_overlay = overlay_generator.generate_traffic_overlay({
            "metrics": {
                "avg_travel_time": traffic_results.avg_travel_time,
                "congestion_index": traffic_results.congestion_index,
                "total_volume": traffic_results.total_volume
            }
        })
        
        results = {
            "traffic": {
                "metrics": {
                    "avg_travel_time": traffic_results.avg_travel_time,
                    "congestion_index": traffic_results.congestion_index,
                    "total_volume": traffic_results.total_volume
                },
                "spatial_overlay": traffic_overlay
            }
        }
        
        summary = summary_generator.generate_comprehensive_summary(results)
        
        return SimulationResult(
            simulation_id="sim_12345",
            timestamp="2023-01-01T00:00:00Z",
            inputs_ref="input_12345",
            results=results,
            summary=summary,
            update_diffs={}
        )
    except Exception as e:
        logger.error(f"Traffic simulation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Traffic simulation failed: {str(e)}")

# Cost simulation endpoint
@app.post("/simulate/cost", response_model=SimulationResult)
async def run_cost_simulation(input_data: SimulationInput, current_user: dict = Depends(require_user)):
    """
    Run cost estimation simulation
    """
    try:
        logger.info(f"Running cost simulation for user {current_user.get('username')}")
        
        zoning_plan = input_data.zoning_plan.dict()
        infra_edits = [edit.dict() for edit in input_data.infra_edits]
        traffic_inputs = input_data.traffic_inputs.dict()
        
        # Estimate population for cost calculations
        population = data_processor.estimate_population(zoning_plan, traffic_inputs.get("population_density", 0.0))
        
        # Run cost simulation
        cost_results = cost_model.run_simulation(zoning_plan, infra_edits, traffic_inputs, population)
        
        # Generate overlay
        cost_overlay = overlay_generator.generate_cost_overlay({
            "metrics": {
                "total_cost": cost_results.total_cost,
                "annual_operational": cost_results.annual_operational,
                "cost_per_capita": cost_results.cost_per_capita
            }
        })
        
        results = {
            "cost": {
                "metrics": {
                    "total_cost": cost_results.total_cost,
                    "annual_operational": cost_results.annual_operational,
                    "cost_per_capita": cost_results.cost_per_capita
                },
                "breakdown": cost_results.breakdown,
                "spatial_overlay": cost_overlay
            }
        }
        
        summary = summary_generator.generate_comprehensive_summary(results)
        
        return SimulationResult(
            simulation_id="sim_12345",
            timestamp="2023-01-01T00:00:00Z",
            inputs_ref="input_12345",
            results=results,
            summary=summary,
            update_diffs={}
        )
    except Exception as e:
        logger.error(f"Cost simulation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Cost simulation failed: {str(e)}")

# Pollution simulation endpoint
@app.post("/simulate/pollution", response_model=SimulationResult)
async def run_pollution_simulation(input_data: SimulationInput, current_user: dict = Depends(require_user)):
    """
    Run pollution impact simulation
    """
    try:
        logger.info(f"Running pollution simulation for user {current_user.get('username')}")
        
        zoning_plan = input_data.zoning_plan.dict()
        infra_edits = [edit.dict() for edit in input_data.infra_edits]
        traffic_inputs = input_data.traffic_inputs.dict()
        
        # Run pollution simulation
        pollution_results = pollution_model.run_simulation(zoning_plan, infra_edits, traffic_inputs)
        
        # Generate overlay
        pollution_overlay = overlay_generator.generate_pollution_overlay({
            "metrics": {
                "air_quality_index": pollution_results.air_quality_index,
                "co2_emissions": pollution_results.co2_emissions,
                "pollution_hotspots": pollution_results.pollution_hotspots
            }
        })
        
        results = {
            "pollution": {
                "metrics": {
                    "air_quality_index": pollution_results.air_quality_index,
                    "co2_emissions": pollution_results.co2_emissions,
                    "pollution_hotspots": pollution_results.pollution_hotspots
                },
                "recommendations": pollution_results.recommendations,
                "spatial_overlay": pollution_overlay
            }
        }
        
        summary = summary_generator.generate_comprehensive_summary(results)
        
        return SimulationResult(
            simulation_id="sim_12345",
            timestamp="2023-01-01T00:00:00Z",
            inputs_ref="input_12345",
            results=results,
            summary=summary,
            update_diffs={}
        )
    except Exception as e:
        logger.error(f"Pollution simulation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Pollution simulation failed: {str(e)}")

# Models endpoints
@app.get("/models")
async def list_models(current_user: dict = Depends(require_user)):
    """
    List available simulation models
    """
    return {
        "models": [
            {"name": "traffic", "description": "Traffic flow simulation"},
            {"name": "cost", "description": "Cost estimation simulation"},
            {"name": "pollution", "description": "Pollution impact simulation"}
        ]
    }

# Utility endpoint for registering new models (admin only)
@app.post("/models/register")
async def register_model(model_info: dict, current_user: dict = Depends(require_admin)):
    """
    Register a new simulation model (for extensibility)
    """
    # This is a placeholder implementation
    return {"message": "Model registered successfully", "model": model_info}

# Get specific simulation results
@app.get("/simulation/{simulation_id}")
async def get_simulation(simulation_id: str, current_user: dict = Depends(require_user)):
    """
    Get results of a specific simulation
    """
    # This is a placeholder implementation
    return {
        "simulation_id": simulation_id,
        "status": "completed",
        "results": {}
    }

# Integration endpoint for registering with Planner Agent (admin only)
@app.post("/register-with-planner")
async def register_with_planner_agent(planner_url: str, current_user: dict = Depends(require_admin)):
    """
    Register this Simulation Engine with the Planner Agent
    
    Args:
        planner_url: URL of the Planner Agent API (e.g., http://localhost:8000)
    """
    try:
        # Prepare registration data
        tool_name = "simulation_engine"
        endpoint_url = f"{os.getenv('HOST', 'http://localhost')}:{os.getenv('PORT', 8000)}"
        
        # Make request to Planner Agent's register-tool endpoint
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{planner_url}/register-tool",
                params={
                    "tool_name": tool_name,
                    "endpoint_url": endpoint_url
                }
            )
            
            if response.status_code == 200:
                return {
                    "message": "Successfully registered with Planner Agent",
                    "planner_url": planner_url,
                    "tool_name": tool_name
                }
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to register with Planner Agent: {response.text}"
                )
    except Exception as e:
        logger.error(f"Registration failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("src.main:app", host=host, port=port, reload=True)
