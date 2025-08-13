# Agentic City Planner - System Architecture

## Overview

The Agentic City Planner is a comprehensive urban planning tool that combines AI-powered decision making with simulation capabilities and citizen feedback mechanisms.

## Component Architecture

```mermaid
graph TD
    A[Frontend UI] --> B[Auth Service]
    A --> C[Planner Agent]
    A --> D[Simulation Engine]
    A --> E[Document Processor]
    
    C --> D
    C --> E
    C --> F[Parser]
    
    D --> G[Database]
    E --> G
    B --> G
    
    subgraph Backend Services
        B
        C
        D
        E
        F
    end
    
    subgraph Data Layer
        G
    end
```

## Component Descriptions

### 1. Frontend UI (Missing)
Interactive web interface for:
- City planning visualization
- Map rendering with overlays
- User interaction with AI agent
- Simulation result display
- Document upload and feedback submission

### 2. Auth Service (Node.js/Express)
Handles:
- User authentication and authorization
- Session management
- API gateway for all services

### 3. Planner Agent (Python/FastAPI)
The central AI brain that:
- Processes user requests
- Orchestrates external tools
- Generates rationale for decisions
- Maintains conversation context

### 4. Simulation Engine (Python/FastAPI)
Computes quantitative outcomes:
- Traffic flow simulations
- Cost estimations
- Pollution impact analysis
- Real-time layout updates

### 5. Document Processor (Python/FastAPI)
Handles:
- Document upload and storage
- RAG-based policy queries
- Feedback analysis and classification

### 6. Parser (Python)
Processes:
- Blueprint file parsing (GeoJSON, DXF, JSON, ZIP)
- Image-based feature detection
- Normalization of city data

## Data Flow

1. **User Interaction**: User interacts with frontend UI
2. **Authentication**: Auth service validates user credentials
3. **Planning Request**: User request sent to Planner Agent
4. **Tool Orchestration**: Planner Agent determines required tools
5. **Simulation**: Simulation Engine runs relevant models
6. **Document Processing**: Document Processor handles policy queries
7. **Parsing**: Parser processes uploaded blueprints
8. **Feedback**: Citizen feedback analyzed and incorporated
9. **Visualization**: Results displayed in frontend UI

## Integration Points

### Planner Agent Integrations:
- **Simulation Engine**: For traffic/cost/pollution simulations
- **Document Processor**: For policy document retrieval
- **Parser**: For blueprint processing
- **Frontend**: For user interaction

### API Endpoints:
- Auth Service: `/api/auth/*`, `/api/init-city`, `/api/prompt`
- Planner Agent: `/plan`, `/register-tool`
- Simulation Engine: `/simulate/*`, `/models/*`
- Document Processor: `/documents/*`, `/query`, `/feedback/*`

## Deployment Architecture

```mermaid
graph LR
    A[Client Browser] --> B[Load Balancer]
    B --> C[Frontend Service]
    B --> D[Auth Service]
    B --> E[Planner Agent]
    B --> F[Simulation Engine]
    B --> G[Document Processor]
    B --> H[Parser Service]
    
    E --> I[Database]
    F --> I
    G --> I
    D --> I
    
    J[File Storage] --> K[Cloud Storage]
    
    subgraph Application Layer
        C
        D
        E
        F
        G
        H
    end
    
    subgraph Data Layer
        I
        J
        K
    end
```

## Priority Implementation Order

1. **Frontend UI** - Critical for user interaction
2. **Backend Integrations** - Connect all services
3. **Database Implementation** - Persistent storage
4. **Security & Authentication** - Secure all services
5. **Deployment & Monitoring** - Production readiness