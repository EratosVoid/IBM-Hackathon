# Simulation Engine API Documentation

## Overview

The Simulation Engine API provides endpoints for running urban planning simulations including traffic flow, cost estimation, and pollution impact analysis. The API is built with FastAPI and follows REST principles.

## Base URL

```
http://localhost:8000
```

## Authentication

All endpoints except `/health` require authentication using JWT tokens. Tokens can be obtained through the Planner Agent authentication system.

## API Endpoints

### Health Check

#### `GET /health`

Health check endpoint to verify the API is running.

**Response:**
```json
{
  "status": "healthy",
  "message": "Simulation Engine is running"
}
```

### Simulation Endpoints

#### `POST /simulate`

Run a comprehensive simulation for a city plan.

**Request Body:**
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

**Response:**
```json
{
  "simulation_id": "string",
  "timestamp": "ISO8601",
  "inputs_ref": "input_id",
  "results": {
    "traffic": {
      "metrics": {
        "avg_travel_time": "float",
        "congestion_index": "float",
        "total_volume": "float"
      },
      "spatial_overlay": "base64_encoded_overlay_data"
    },
    "cost": {
      "metrics": {
        "total_cost": "float",
        "annual_operational": "float",
        "cost_per_capita": "float"
      },
      "breakdown": {
        "infrastructure": "float",
        "services": "float",
        "maintenance": "float"
      }
    },
    "pollution": {
      "metrics": {
        "air_quality_index": "float",
        "co2_emissions": "float",
        "pollution_hotspots": "int"
      },
      "recommendations": ["string"]
    }
  },
  "summary": {
    "executive_summary": "string",
    "key_findings": ["string"],
    "recommendations": ["string"]
  },
  "update_diffs": {
    "map_updates": ["change_object"],
    "layer_updates": ["layer_object"]
  }
}
```

#### `POST /simulate/traffic`

Run traffic flow simulation.

**Request Body:**
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
    "models": ["traffic"],
    "time_horizon": "5 years",
    "scenarios": ["optimistic", "pessimistic"]
  }
}
```

**Response:**
```json
{
  "simulation_id": "string",
  "timestamp": "ISO8601",
  "inputs_ref": "input_id",
  "results": {
    "traffic": {
      "metrics": {
        "avg_travel_time": "float",
        "congestion_index": "float",
        "total_volume": "float"
      },
      "spatial_overlay": "base64_encoded_overlay_data"
    }
  },
  "summary": {
    "executive_summary": "string",
    "key_findings": ["string"],
    "recommendations": ["string"]
  },
  "update_diffs": {
    "map_updates": ["change_object"],
    "layer_updates": ["layer_object"]
  }
}
```

#### `POST /simulate/cost`

Run cost estimation simulation.

**Request Body:**
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
    "models": ["cost"],
    "time_horizon": "5 years",
    "scenarios": ["optimistic", "pessimistic"]
  }
}
```

**Response:**
```json
{
  "simulation_id": "string",
  "timestamp": "ISO8601",
  "inputs_ref": "input_id",
  "results": {
    "cost": {
      "metrics": {
        "total_cost": "float",
        "annual_operational": "float",
        "cost_per_capita": "float"
      },
      "breakdown": {
        "infrastructure": "float",
        "services": "float",
        "maintenance": "float"
      },
      "spatial_overlay": "base64_encoded_overlay_data"
    }
  },
  "summary": {
    "executive_summary": "string",
    "key_findings": ["string"],
    "recommendations": ["string"]
  },
  "update_diffs": {
    "map_updates": ["change_object"],
    "layer_updates": ["layer_object"]
  }
}
```

#### `POST /simulate/pollution`

Run pollution impact simulation.

**Request Body:**
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
    "models": ["pollution"],
    "time_horizon": "5 years",
    "scenarios": ["optimistic", "pessimistic"]
  }
}
```

**Response:**
```json
{
  "simulation_id": "string",
  "timestamp": "ISO8601",
  "inputs_ref": "input_id",
  "results": {
    "pollution": {
      "metrics": {
        "air_quality_index": "float",
        "co2_emissions": "float",
        "pollution_hotspots": "int"
      },
      "recommendations": ["string"],
      "spatial_overlay": "base64_encoded_overlay_data"
    }
  },
  "summary": {
    "executive_summary": "string",
    "key_findings": ["string"],
    "recommendations": ["string"]
  },
  "update_diffs": {
    "map_updates": ["change_object"],
    "layer_updates": ["layer_object"]
  }
}
```

### Utility Endpoints

#### `GET /models`

List available simulation models.

**Response:**
```json
{
  "models": [
    {
      "name": "traffic",
      "description": "Traffic flow simulation"
    },
    {
      "name": "cost",
      "description": "Cost estimation simulation"
    },
    {
      "name": "pollution",
      "description": "Pollution impact simulation"
    }
  ]
}
```

#### `POST /models/register`

Register a new simulation model (admin only).

**Request Body:**
```json
{
  "name": "string",
  "description": "string"
}
```

**Response:**
```json
{
  "message": "Model registered successfully",
  "model": {
    "name": "string",
    "description": "string"
  }
}
```

#### `GET /simulation/{simulation_id}`

Get results of a specific simulation.

**Response:**
```json
{
  "simulation_id": "string",
  "status": "completed",
  "results": {}
}
```

#### `POST /register-with-planner`

Register this Simulation Engine with the Planner Agent (admin only).

**Query Parameters:**
- `planner_url`: URL of the Planner Agent API (e.g., http://localhost:8000)

**Response:**
```json
{
  "message": "Successfully registered with Planner Agent",
  "planner_url": "string",
  "tool_name": "simulation_engine"
}
```

## Error Responses

### 400 Bad Request

Invalid request data.

```json
{
  "detail": "Validation error message"
}
```

### 401 Unauthorized

Authentication failed or token expired.

```json
{
  "detail": "Token has expired"
}
```

### 403 Forbidden

Insufficient permissions.

```json
{
  "detail": "Access denied. admin role required."
}
```

### 422 Unprocessable Entity

Validation error in request body.

```json
{
  "detail": [
    {
      "loc": ["body", "field_name"],
      "msg": "Field validation error",
      "type": "value_error"
    }
  ]
}
```

### 500 Internal Server Error

Server error occurred during simulation.

```json
{
  "detail": "Simulation failed: error message"
}
```

## Data Models

### Zone

```json
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
```

### InfraEdit

```json
{
  "type": "road|utility|building",
  "action": "add|modify|remove",
  "specifications": {}
}
```

### TrafficInputs

```json
{
  "population_density": "float",
  "peak_hours": ["08:00", "17:00"],
  "vehicle_ownership": "float"
}
```

### SimulationOptions

```json
{
  "models": ["traffic|cost|pollution"],
  "time_horizon": "string",
  "scenarios": ["optimistic|pessimistic"]
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 100 requests per minute per IP address
- 1000 requests per hour per authenticated user

Exceeding these limits will result in a 429 Too Many Requests response.

## CORS Policy

The API allows CORS requests from the following origins:
- `http://localhost:3000`
- `http://localhost:8080`
- `https://planner-agent.example.com`

## Versioning

The API follows semantic versioning. The current version is 1.0.0.

## Changelog

### v1.0.0 (2023-01-01)

- Initial release
- Support for traffic, cost, and pollution simulations
- REST API with JWT authentication
- Integration with Planner Agent