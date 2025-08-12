# Simulation Engine User Guide

## Overview

The Simulation Engine is a critical component of the Agentic City Planner system that computes quantitative outcomes for urban planning changes, including traffic flow, cost estimation, and pollution impact. This guide will help you understand how to use the Simulation Engine effectively.

## Table of Contents

1. [Getting Started](#getting-started)
2. [System Requirements](#system-requirements)
3. [Installation](#installation)
4. [Running the Simulation Engine](#running-the-simulation-engine)
5. [API Usage](#api-usage)
6. [Input Data Format](#input-data-format)
7. [Understanding the Results](#understanding-the-results)
8. [Demo Scenarios](#demo-scenarios)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

## Getting Started

The Simulation Engine provides a REST API for running urban planning simulations. It can be integrated with the Planner Agent or used standalone for specific simulation needs.

### Key Features

- Traffic flow simulation
- Cost estimation for infrastructure projects
- Pollution impact analysis
- REST API for integration
- Modular architecture for extensibility

## System Requirements

### Minimum Requirements

- Python 3.7 or higher
- 4 GB RAM
- 100 MB available disk space
- Docker (for containerized deployment)

### Recommended Requirements

- Python 3.9 or higher
- 8 GB RAM
- 1 GB available disk space
- Docker (for containerized deployment)
- Multi-core processor

## Installation

### Method 1: Using Virtual Environment (Recommended)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd simulation-engine
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Method 2: Using Docker

1. Build the Docker image:
   ```bash
   docker build -t simulation-engine .
   ```

2. Run the container:
   ```bash
   docker run -p 8000:8000 simulation-engine
   ```

## Running the Simulation Engine

### Starting the Server

To start the Simulation Engine server:

```bash
uvicorn src.main:app --reload
```

The server will start on `http://localhost:8000` by default.

### Configuration

The Simulation Engine can be configured using environment variables:

- `HOST`: Server host (default: 127.0.0.1)
- `PORT`: Server port (default: 8000)
- `SECRET_KEY`: JWT secret key for authentication
- `ALGORITHM`: JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time (default: 30)

## API Usage

### Authentication

All endpoints except `/health` require authentication using JWT tokens. Obtain a token through the Planner Agent authentication system.

```bash
curl -X POST http://localhost:8000/simulate \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d @input.json
```

### Health Check

Verify that the server is running:

```bash
curl http://localhost:8000/health
```

### Running Simulations

#### Comprehensive Simulation

To run a comprehensive simulation that includes traffic, cost, and pollution analysis:

```bash
curl -X POST http://localhost:8000/simulate \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d @input.json
```

#### Individual Simulations

You can also run individual simulations:

- Traffic simulation: `POST /simulate/traffic`
- Cost simulation: `POST /simulate/cost`
- Pollution simulation: `POST /simulate/pollution`

## Input Data Format

The Simulation Engine accepts JSON input with the following structure:

```json
{
  "zoning_plan": {
    "zones": [
      {
        "id": "string",
        "type": "residential|commercial|industrial|green_space",
        "area": "float",
        "location": {
          "x": "float",
          "y": "float"
        },
        "properties": {}
      }
    ]
  },
  "infra_edits": [
    {
      "type": "road|utility|building",
      "action": "add|modify|remove",
      "specifications": {}
    }
  ],
  "traffic_inputs": {
    "population_density": "float",
    "peak_hours": ["08:00", "17:00"],
    "vehicle_ownership": "float"
  },
  "simulation_options": {
    "models": ["traffic", "cost", "pollution"],
    "time_horizon": "5 years",
    "scenarios": ["optimistic", "pessimistic"]
  }
}
```

### Field Descriptions

#### Zoning Plan

- `zones`: Array of zone objects
- `id`: Unique identifier for the zone
- `type`: Type of zone (residential, commercial, industrial, green_space)
- `area`: Area of the zone in square units
- `location`: Coordinates of the zone
- `properties`: Additional properties specific to the zone type

#### Infrastructure Edits

- `type`: Type of infrastructure (road, utility, building)
- `action`: Action to perform (add, modify, remove)
- `specifications`: Additional specifications for the infrastructure

#### Traffic Inputs

- `population_density`: Population density per unit area
- `peak_hours`: Array of peak traffic hours
- `vehicle_ownership`: Rate of vehicle ownership (0-1)

#### Simulation Options

- `models`: Array of models to run (traffic, cost, pollution)
- `time_horizon`: Time horizon for the simulation
- `scenarios`: Array of scenarios to consider

## Understanding the Results

The Simulation Engine returns comprehensive results including metrics, visualizations, and summaries.

### Traffic Results

- `avg_travel_time`: Average travel time in minutes
- `congestion_index`: Congestion level indicator
- `total_volume`: Total traffic volume
- `spatial_overlay`: Visual representation of traffic patterns

### Cost Results

- `total_cost`: Total project cost
- `annual_operational`: Annual operational cost
- `cost_per_capita`: Cost per capita
- `breakdown`: Detailed cost breakdown
- `spatial_overlay`: Visual representation of cost distribution

### Pollution Results

- `air_quality_index`: Air quality index (0-100)
- `co2_emissions`: CO2 emissions in kg
- `pollution_hotspots`: Number of pollution hotspots
- `recommendations`: Mitigation recommendations
- `spatial_overlay`: Visual representation of pollution levels

### Summary

- `executive_summary`: High-level summary of findings
- `key_findings`: Key findings from the simulation
- `recommendations`: Actionable recommendations

## Demo Scenarios

The Simulation Engine includes several demo scenarios to help you understand how to use the system:

1. **Basic Zoning Change**: Add a residential zone and simulate its impact
2. **Infrastructure Addition**: Add a new road and analyze traffic improvement
3. **Comprehensive Plan**: Multi-zone development with full simulation
4. **Edge Cases**: Invalid inputs and error conditions

To run a demo scenario:

```bash
cd demo/basic_zoning_change
python run_demo.py
```

## Troubleshooting

### Common Issues

#### Server Not Starting

- Check that all dependencies are installed
- Verify that the port is not already in use
- Check the logs for error messages

#### Authentication Errors

- Verify that you're using a valid JWT token
- Check that the token hasn't expired
- Ensure the token has the required permissions

#### Invalid Input Data

- Verify that all required fields are present
- Check that field values are within valid ranges
- Refer to the API documentation for detailed validation rules

### Getting Help

If you encounter issues not covered in this guide:

1. Check the API documentation in `docs/api.md`
2. Review the demo scenarios in the `demo/` directory
3. Examine the logs for detailed error messages
4. Contact the development team for support

## Best Practices

### Data Preparation

1. Ensure all input data is accurate and complete
2. Use consistent units of measurement
3. Validate data before submitting to the API
4. Keep backups of important input datasets

### Performance Optimization

1. Run only the simulations you need (select specific models)
2. Use appropriate time horizons for your analysis
3. Batch multiple simulations when possible
4. Monitor resource usage during long-running simulations

### Security

1. Always use valid authentication tokens
2. Protect sensitive data and credentials
3. Regularly update dependencies to address security vulnerabilities
4. Follow the principle of least privilege for user permissions

### Integration

1. Handle API errors gracefully in your applications
2. Implement retry logic for transient failures
3. Cache results when appropriate to reduce API calls
4. Monitor API usage and rate limits

## Conclusion

The Simulation Engine is a powerful tool for urban planning analysis. By following this guide, you should be able to effectively use the system to evaluate the impact of various planning decisions. For more detailed information about the API, refer to the API documentation in `docs/api.md`.