# Simulation Engine - Team Overview

## What is the Simulation Engine?

The Simulation Engine is a critical component of the Agentic City Planner system that computes quantitative outcomes for urban planning changes. It evaluates the impact of proposed city plans on traffic flow, infrastructure costs, and environmental pollution.

## Key Features

- **Traffic Flow Simulation**: Analyzes how changes to city plans affect traffic congestion and travel times
- **Cost Estimation**: Calculates infrastructure and operational costs of proposed changes
- **Pollution Impact Analysis**: Estimates environmental impact including air quality and emissions
- **REST API**: Provides endpoints for integration with the Planner Agent
- **Modular Architecture**: Designed for extensibility with new simulation models

## Technology Stack

- **Language**: Python
- **Framework**: FastAPI
- **Data Processing**: Pandas, NumPy
- **Visualization**: Matplotlib
- **Testing**: Pytest
- **Deployment**: Docker

## Project Structure

```
simulation-engine/
├── src/                 # Source code
│   ├── models/          # Individual simulation models
│   │   ├── traffic_model.py
│   │   ├── cost_model.py
│   │   └── pollution_model.py
│   ├── data_processor.py # Data normalization and processing
│   ├── overlay_generator.py # Spatial overlay generation
│   ├── summary_generator.py # Natural language summaries
│   ├── result_aggregator.py # Combines results from models
│   ├── security.py      # Authentication and authorization
│   ├── performance_optimizer.py # Performance optimizations
│   └── main.py          # Main application entry point
├── tests/               # Unit and integration tests
├── docs/                # Documentation
├── demo/                # Demo scenarios
├── Dockerfile           # Docker configuration
├── requirements.txt     # Python dependencies
└── README.md            # Project documentation
```

## How It Works

1. **Input Processing**: The engine receives urban planning data including zoning plans, infrastructure edits, and traffic inputs
2. **Simulation Execution**: Based on the requested models, it runs simulations for traffic, cost, and/or pollution
3. **Result Generation**: Each model produces quantitative metrics and spatial overlays
4. **Summary Creation**: Results are converted into natural language summaries and recommendations
5. **Output Delivery**: All results are returned through the API to the Planner Agent

## API Endpoints

- `POST /simulate` - Run comprehensive simulation with all selected models
- `POST /simulate/traffic` - Run traffic flow simulation only
- `POST /simulate/cost` - Run cost estimation simulation only
- `POST /simulate/pollution` - Run pollution impact simulation only
- `GET /models` - List available simulation models
- `GET /health` - Health check endpoint

## Key Components Explained

### Data Models
- Defined in `src/main.py` with validation using Pydantic
- Include Zone, InfraEdit, TrafficInputs, and SimulationOptions

### Traffic Model (`src/models/traffic_model.py`)
- Simulates traffic flow, congestion levels, and travel times
- Uses graph-based road network analysis
- Outputs metrics like average travel time and congestion index

### Cost Model (`src/models/cost_model.py`)
- Estimates infrastructure and operational costs
- Calculates costs for zoning, roads, utilities, and buildings
- Provides budget recommendations and financial impact summaries

### Pollution Model (`src/models/pollution_model.py`)
- Estimates environmental impact including emissions
- Calculates air quality index and identifies pollution hotspots
- Provides mitigation recommendations

### Data Processor (`src/data_processor.py`)
- Normalizes input data for simulation models
- Coordinates execution of selected simulations
- Processes results from individual models

### Overlay Generator (`src/overlay_generator.py`)
- Creates visual representations of simulation results
- Generates base64 encoded images for traffic, cost, and pollution data
- Produces combined overlays showing all results

### Summary Generator (`src/summary_generator.py`)
- Creates natural language explanations of results
- Generates executive summaries, key findings, and recommendations
- Makes technical results accessible to planners and stakeholders

### Security (`src/security.py`)
- Implements JWT-based authentication
- Provides role-based access control (admin, user, viewer)
- Secures API endpoints with token validation

## Development Workflow

1. **Setup**: Install dependencies with `pip install -r requirements.txt`
2. **Run**: Start the server with `uvicorn src.main:app --reload`
3. **Test**: Run tests with `pytest`
4. **Deploy**: Build and run with Docker

## Authentication

The API uses JWT tokens for authentication:
- All simulation endpoints require a valid token
- Different roles (admin, user, viewer) have different access levels
- Tokens can be generated using the SecurityManager class

This overview should help your team understand the structure and functionality of the Simulation Engine. For more detailed information, check the individual source files and the full documentation in the `docs/` directory.