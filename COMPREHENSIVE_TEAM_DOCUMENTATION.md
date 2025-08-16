# Agentic City Planner - Comprehensive Technical Documentation

> **Last Updated:** August 16, 2025  
> **Version:** 1.0.0  
> **Target Audience:** Development Team & Stakeholders

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Component Analysis](#component-analysis)
4. [Technical Stack & Dependencies](#technical-stack--dependencies)
5. [API Endpoints & Integration](#api-endpoints--integration)
6. [Data Models & Flow](#data-models--flow)
7. [AI & Machine Learning Integration](#ai--machine-learning-integration)
8. [Frontend Architecture](#frontend-architecture)
9. [Database Schema](#database-schema)
10. [Security & Authentication](#security--authentication)
11. [Deployment Strategy](#deployment-strategy)
12. [Testing & Quality Assurance](#testing--quality-assurance)
13. [Performance Optimization](#performance-optimization)
14. [Monitoring & Observability](#monitoring--observability)
15. [Team Responsibilities](#team-responsibilities)
16. [Development Workflow](#development-workflow)
17. [Troubleshooting Guide](#troubleshooting-guide)
18. [Future Roadmap](#future-roadmap)

---

## Project Overview

### Vision Statement
The Agentic City Planner is an AI-powered urban planning platform that enables intelligent, data-driven city development through natural language interaction, real-time simulation, and collaborative feedback mechanisms.

### Core Value Proposition
- **AI-Driven Planning**: Leverage IBM Watson AI for intelligent urban planning decisions
- **Real-Time Simulation**: Immediate feedback on traffic, cost, and environmental impacts
- **Collaborative Design**: Enable public participation through feedback mechanisms
- **Data-Driven Insights**: Make informed decisions based on comprehensive analytics

### Key Features
1. **Natural Language Urban Planning**: Chat with AI to design cities
2. **Multi-Modal Simulation Engine**: Traffic, cost, and pollution analysis
3. **Document Processing & RAG**: Policy-aware planning with document retrieval
4. **Blueprint Parsing**: Support for multiple file formats (GeoJSON, DXF, images)
5. **Real-Time Collaboration**: Public feedback and citizen engagement
6. **Visual City Rendering**: Interactive maps and overlays

---

## System Architecture

### High-Level Architecture

```mermaid
graph TB
    %% Client Layer
    Client[React Frontend Client]
    
    %% API Gateway Layer
    Gateway[API Gateway/Load Balancer]
    
    %% Authentication Layer
    Auth[Authentication Service]
    
    %% Core Services Layer
    Planner[Planner Agent Service]
    Simulation[Simulation Engine]
    Documents[Document Processor]
    Parser[Blueprint Parser]
    
    %% External AI Services
    Watson[IBM Watson AI]
    
    %% Data Layer
    Database[(PostgreSQL Database)]
    FileStorage[(File Storage)]
    Vector[(ChromaDB Vector Store)]
    
    %% Connections
    Client --> Gateway
    Gateway --> Auth
    Gateway --> Planner
    Gateway --> Simulation
    Gateway --> Documents
    Gateway --> Parser
    
    Planner --> Watson
    Documents --> Watson
    Documents --> Vector
    
    Auth --> Database
    Planner --> Database
    Simulation --> Database
    Documents --> Database
    Parser --> FileStorage
    
    style Watson fill:#e1f5fe
    style Database fill:#f3e5f5
    style Vector fill:#e8f5e8
```

### Component Responsibilities

| Component | Primary Responsibility | Technology Stack |
|-----------|----------------------|------------------|
| **Frontend Client** | User interface, visualization, interaction | React, TypeScript, HeroUI, Leaflet |
| **API Gateway** | Routing, load balancing, rate limiting | Nginx |
| **Authentication Service** | User management, JWT tokens, sessions | Node.js, Express, bcrypt |
| **Planner Agent** | AI orchestration, intent classification, feature generation | Node.js, IBM Watson AI |
| **Simulation Engine** | Traffic, cost, pollution simulations | Python, FastAPI, NumPy |
| **Document Processor** | RAG, document embedding, feedback analysis | Python, LlamaIndex, ChromaDB |
| **Blueprint Parser** | File parsing, feature extraction, normalization | Python, OpenCV, GeoPandas |

---

## Component Analysis

### 1. Frontend Client (`/client`)

**Technology Stack:**
- React 18.3.1 with TypeScript
- HeroUI for component library
- Leaflet for map rendering
- Zustand for state management
- React Query for API state
- Vite for build tooling

**Key Components:**
- `CityPlanRenderer.tsx`: Canvas-based city visualization with coordinate transformation
- `ProjectSidebar.tsx`: AI chat interface and project management
- `CityPlanTypes.ts`: Comprehensive type definitions for urban features
- Authentication pages with form validation

**State Management:**
- `authStore.ts`: User authentication state
- `projectStore.ts`: Project and city data management
- `uiStore.ts`: UI state and preferences

### 2. Authentication Service (`/api`)

**Core Features:**
- JWT-based authentication with bcrypt password hashing
- PostgreSQL integration for user management
- Session management and token refresh
- File upload handling with Multer

**Key Endpoints:**
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `GET /auth/profile` - User profile retrieval
- `POST /auth/logout` - Session termination

### 3. Planner Agent Service (`/api/services`)

**AI Integration:**
- IBM Watson Granite 3.2-8B model integration
- Intent classification for natural language processing
- Spatial analysis and collision detection
- Feature generation with coordinate validation

**Key Capabilities:**
- Natural language intent classification
- Intelligent feature placement with conflict avoidance
- Spatial analysis and buffer zone calculations
- Fallback mechanisms for AI service failures

### 4. Simulation Engine (`/simulation-engine`)

**Simulation Models:**
- **Traffic Model**: Flow analysis, congestion prediction, volume calculations
- **Cost Model**: Infrastructure cost estimation, operational expenses
- **Pollution Model**: Air quality assessment, CO2 emissions, hotspot identification

**API Features:**
- RESTful endpoints for each simulation type
- Comprehensive input validation with Pydantic
- Real-time overlay generation for visualization
- Performance optimization with async processing

### 5. Document Processor (`/document-processor`)

**RAG Implementation:**
- LlamaIndex for document indexing and retrieval
- ChromaDB for vector storage and similarity search
- IBM Watson AI for embeddings and query processing
- Support for PDF, DOCX, TXT, and Markdown files

**Feedback Analysis:**
- Sentiment analysis of citizen feedback
- Topic extraction and classification
- Summary statistics and trend analysis

### 6. Blueprint Parser (`/parser`)

**File Format Support:**
- GeoJSON for geographic data
- DXF for CAD drawings
- Image files (PNG, JPG, TIFF) with OpenCV processing
- ZIP archives with multiple file types

**Feature Detection:**
- Computer vision for feature extraction from images
- Coordinate normalization and validation
- Metadata preservation and confidence scoring

---

## Technical Stack & Dependencies

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Authentication service runtime |
| Python | 3.8+ | AI services and simulation engine |
| Express.js | 4.18+ | REST API framework |
| FastAPI | Latest | Python API framework with validation |
| PostgreSQL | 13+ | Primary database |
| ChromaDB | Latest | Vector database for embeddings |

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.6.3 | Type safety |
| Vite | 6.0.11 | Build tool and dev server |
| HeroUI | 2.8.2 | Component library |
| Leaflet | 1.9.4 | Map visualization |
| Zustand | 5.0.7 | State management |

### AI & Machine Learning

| Technology | Purpose |
|------------|---------|
| IBM Watson AI | Natural language processing and generation |
| LlamaIndex | Document indexing and RAG implementation |
| ChromaDB | Vector embeddings storage |
| OpenCV | Computer vision for image processing |
| NumPy/Pandas | Data processing and analysis |

---

## API Endpoints & Integration

### Authentication Endpoints

```
POST /api/auth/register
POST /api/auth/login  
GET  /api/auth/profile
POST /api/auth/logout
```

### Project Management

```
GET    /api/projects/          # List user projects
GET    /api/projects/:id       # Get project details
POST   /api/projects/init-city # Create new project
PUT    /api/projects/:id/blueprint # Update blueprint
DELETE /api/projects/:id       # Delete project
```

### AI Planner Agent

```
POST /api/planner/prompt        # Natural language planning
POST /api/planner/confirm-features # Confirm generated features
```

### Simulation Engine

```
POST /simulate                  # Comprehensive simulation
POST /simulate/traffic         # Traffic-only simulation
POST /simulate/cost            # Cost-only simulation  
POST /simulate/pollution       # Pollution-only simulation
GET  /models                   # List available models
```

### Document Processing

```
POST /documents/upload         # Upload policy documents
GET  /documents/list          # List documents
POST /query                   # RAG-based document query
POST /feedback/analyze        # Analyze feedback sentiment
```

### Public Endpoints

```
GET  /api/public/:projectId           # Public project view
POST /api/public/:projectId/feedback  # Submit public feedback
```

---

## Data Models & Flow

### Core Data Structures

#### CityFeature
```typescript
interface CityFeature {
  id: string;
  type: FeatureType; // zone, road, building, park, water_body, service, architecture
  subtype?: string;
  name: string;
  description?: string;
  geometry: Geometry; // Point, LineString, or Polygon
  style?: FeatureStyle;
  metadata: {
    area?: number;
    confidence?: "low" | "medium" | "high";
    ai_generated?: boolean;
    [key: string]: any;
  };
}
```

#### CityPlanData
```typescript
interface CityPlanData {
  id: string;
  name: string;
  coordinateSystem: {
    type: "cartesian" | "geographic";
    unit: "meters" | "feet" | "degrees";
    origin?: Coordinate;
  };
  bounds: CityBounds;
  blueprint?: BlueprintDimensions;
  features: CityFeature[];
  layers: { [layerId: string]: CityLayer };
  metadata: {
    lastModified: string;
    version: string;
    [key: string]: any;
  };
}
```

### Data Flow Architecture

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Auth
    participant Planner
    participant Watson
    participant Simulation
    participant Database

    User->>Frontend: "Add residential zone"
    Frontend->>Auth: Validate session
    Auth-->>Frontend: Valid token
    Frontend->>Planner: POST /prompt
    Planner->>Watson: Classify intent
    Watson-->>Planner: Intent: add_zone
    Planner->>Watson: Generate coordinates
    Watson-->>Planner: Feature coordinates
    Planner->>Database: Store temp features
    Planner-->>Frontend: Preview features
    User->>Frontend: Confirm features
    Frontend->>Planner: POST /confirm-features
    Planner->>Database: Save final features
    Frontend->>Simulation: Run simulations
    Simulation-->>Frontend: Simulation results
```

---

## AI & Machine Learning Integration

### IBM Watson AI Integration

**Model Configuration:**
- Primary Model: `ibm/granite-3-2-8b-instruct`
- Embedding Model: `ibm/slate-125m-english-rtrvr`
- Project-based isolation for security

**Key AI Capabilities:**

1. **Intent Classification**
   - Natural language understanding
   - Urban planning context awareness
   - Feature type and subtype identification

2. **Spatial Intelligence**
   - Collision detection and avoidance
   - Buffer zone calculations
   - Optimal placement algorithms

3. **Feature Generation**
   - Contextual coordinate generation
   - Geometry type selection
   - Size and scale optimization

### RAG Implementation

**Document Processing Pipeline:**
1. Document upload and validation
2. Text extraction and chunking
3. Embedding generation with Watson AI
4. Vector storage in ChromaDB
5. Query-time retrieval and ranking

**Vector Search Parameters:**
- Chunk size: 1000 characters
- Overlap: 200 characters
- Top-k retrieval: 5 documents
- Similarity threshold: 0.7

---

## Frontend Architecture

### Component Hierarchy

```
App.tsx
├── Provider.tsx (Theme, Query, Auth)
├── DefaultLayout.tsx
│   ├── Navbar.tsx
│   └── Main Content
├── Pages/
│   ├── DashboardPage.tsx
│   ├── ProjectViewPage.tsx
│   ├── CreateProjectPage.tsx
│   └── PublicFeedbackPage.tsx
└── Components/
    ├── project/
    │   ├── CityPlanRenderer.tsx
    │   ├── ProjectSidebar.tsx
    │   └── BlueprintEditModal.tsx
    └── primitives/
```

### State Management Strategy

**Zustand Stores:**
- **authStore**: User authentication state and token management
- **projectStore**: Project data, city features, and CRUD operations
- **uiStore**: UI preferences, theme, and temporary state

**React Query Integration:**
- API state management with automatic caching
- Background refetching and error handling
- Optimistic updates for better UX

### Visualization Architecture

**Canvas-Based Rendering:**
- HTML5 Canvas for high-performance city visualization
- Coordinate transformation (world ↔ screen)
- Layer-based rendering with z-index control
- Real-time feature updates and animations

---

## Database Schema

### PostgreSQL Tables

#### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Projects Table
```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  city_type VARCHAR(50),
  city_data JSONB,
  blueprint_width INTEGER,
  blueprint_height INTEGER,
  blueprint_unit VARCHAR(20),
  constraints JSONB,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Feedback Table
```sql
CREATE TABLE feedback (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  author_name VARCHAR(255),
  author_email VARCHAR(255),
  feedback_text TEXT NOT NULL,
  sentiment VARCHAR(20),
  topics JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Data Relationships

- Users → Projects (1:many)
- Projects → Feedback (1:many)
- Projects store city_data as JSONB for flexibility
- Constraints and metadata stored as JSONB

---

## Security & Authentication

### Authentication Flow

1. **User Registration**: bcrypt password hashing (salt rounds: 10)
2. **Login Process**: Credential validation and JWT generation
3. **Token Management**: JWT with 7-day expiration
4. **Session Persistence**: Local storage with automatic refresh

### Security Measures

**API Security:**
- JWT token validation on protected routes
- Input validation and sanitization
- Rate limiting and request throttling
- CORS configuration for cross-origin requests

**Data Protection:**
- Password hashing with bcrypt
- SQL injection prevention with parameterized queries
- XSS protection with input sanitization
- Environment variable security for API keys

**File Upload Security:**
- File type validation
- Size limitations
- Virus scanning (recommended for production)
- Secure file storage with access controls

---

## Deployment Strategy

### Containerization

**Docker Compose Services:**
```yaml
services:
  - auth-service (Node.js)
  - planner-agent (Python)
  - simulation-engine (Python)
  - document-processor (Python)
  - parser-service (Python)
  - database (PostgreSQL)
  - api-gateway (Nginx)
```

### IBM Cloud Deployment

**Code Engine Configuration:**
- Automatic scaling based on demand
- Container registry integration
- Environment variable management
- Load balancing and health checks

**Watson AI Integration:**
- Service credentials and API key management
- Project-based resource isolation
- Usage monitoring and billing

### Environment Configuration

**Required Environment Variables:**
```bash
# Authentication
JWT_SECRET=your_jwt_secret
DATABASE_URL=postgresql://user:pass@host:port/db

# IBM Watson AI
WATSONX_API_KEY=your_watson_api_key
WATSONX_PROJECT_ID=your_project_id
WATSONX_URL=https://us-south.ml.cloud.ibm.com

# Service Configuration
NODE_ENV=production
PORT=5000
```

---

## Testing & Quality Assurance

### Testing Strategy

**Backend Testing:**
- Unit tests for service functions
- Integration tests for API endpoints
- Mock testing for external AI services
- Database transaction testing

**Frontend Testing:**
- Component unit tests with React Testing Library
- E2E testing with Playwright/Cypress
- Visual regression testing
- Accessibility testing

**AI Testing:**
- Intent classification accuracy
- Feature generation validation
- Fallback mechanism verification
- Performance benchmarking

### Quality Metrics

**Code Quality:**
- TypeScript strict mode enabled
- ESLint and Prettier configuration
- Test coverage > 80%
- Code review requirements

**Performance Metrics:**
- API response time < 500ms
- AI processing time < 5s
- Canvas rendering at 60fps
- Database query optimization

---

## Performance Optimization

### Backend Optimization

**Database Performance:**
- Indexed queries on frequently accessed columns
- JSONB indexing for city_data queries
- Connection pooling with pg
- Query optimization and caching

**AI Service Optimization:**
- Request batching for multiple features
- Response caching for similar prompts
- Fallback mechanisms for service failures
- Async processing for long-running tasks

### Frontend Optimization

**Rendering Performance:**
- Canvas-based rendering for complex city visualizations
- Viewport culling for large datasets
- Debounced user input handling
- Lazy loading for components

**Network Optimization:**
- API response caching with React Query
- Image optimization and compression
- Bundle splitting and code splitting
- CDN integration for static assets

---

## Monitoring & Observability

### Logging Strategy

**Application Logs:**
- Structured logging with Winston/Python logging
- Request/response logging
- Error tracking and alerting
- Performance metrics collection

**AI Service Monitoring:**
- Watson AI usage tracking
- Response time monitoring
- Error rate analysis
- Cost optimization tracking

### Health Checks

**Service Health Endpoints:**
- `/health` for each service
- Database connectivity checks
- External service dependency validation
- Resource utilization monitoring

### Alerting

**Critical Alerts:**
- Service downtime
- Database connection failures
- AI service quota exceeded
- High error rates (>5%)

---

## Team Responsibilities

### Development Team Structure

| Role | Responsibilities | Skills Required |
|------|-----------------|----------------|
| **Frontend Developer** | React components, UI/UX, visualization | React, TypeScript, Canvas/WebGL |
| **Backend Developer** | API development, database design | Node.js, Python, PostgreSQL |
| **AI Engineer** | Watson integration, model optimization | Machine Learning, NLP, Python |
| **DevOps Engineer** | Deployment, monitoring, infrastructure | Docker, IBM Cloud, CI/CD |
| **QA Engineer** | Testing strategy, automation | Testing frameworks, E2E testing |

### Code Ownership

- **Frontend**: `client/` directory
- **Authentication**: `api/` directory
- **AI Services**: `api/services/plannerAgent.js`, `api/services/watsonService.js`
- **Simulation**: `simulation-engine/` directory
- **Documents**: `document-processor/` directory
- **Parsing**: `parser/` directory

---

## Development Workflow

### Git Workflow

**Branch Strategy:**
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: Feature development
- `hotfix/*`: Production fixes

**Commit Convention:**
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Testing changes

### Code Review Process

1. Feature branch creation
2. Implementation and local testing
3. Pull request submission
4. Automated CI/CD checks
5. Peer code review
6. Integration testing
7. Merge to develop/main

### Release Process

1. Feature freeze on develop branch
2. Release candidate testing
3. Production deployment
4. Post-deployment verification
5. Release notes and documentation

---

## Troubleshooting Guide

### Common Issues

#### Watson AI Service Errors
**Symptoms:** AI features not working, fallback responses
**Solutions:**
- Verify WATSONX_API_KEY and WATSONX_PROJECT_ID
- Check service quotas and billing
- Review network connectivity
- Validate model availability

#### Database Connection Issues
**Symptoms:** Authentication failures, data not saving
**Solutions:**
- Check DATABASE_URL configuration
- Verify PostgreSQL service status
- Review connection pool settings
- Check database permissions

#### Frontend Rendering Issues
**Symptoms:** City plan not displaying, canvas errors
**Solutions:**
- Check browser compatibility (Canvas support)
- Verify coordinate data validity
- Review console errors for JavaScript issues
- Test with different city plan data

### Debug Tools

**Backend Debugging:**
- Console logging with appropriate levels
- Postman/Insomnia for API testing
- Database query analyzers
- Watson AI service logs

**Frontend Debugging:**
- React Developer Tools
- Browser DevTools for performance
- Canvas debugging utilities
- Network tab for API analysis

---

## Future Roadmap

### Short-term Goals (3-6 months)

1. **Enhanced AI Capabilities**
   - Multi-language support
   - Advanced spatial reasoning
   - Historical data integration

2. **Improved Simulation Models**
   - Real-time traffic data integration
   - Climate impact modeling
   - Economic impact analysis

3. **User Experience Enhancements**
   - Mobile responsiveness
   - Offline mode support
   - Advanced visualization options

### Medium-term Goals (6-12 months)

1. **Collaboration Features**
   - Real-time multi-user editing
   - Version control for city plans
   - Advanced feedback mechanisms

2. **Integration Ecosystem**
   - GIS system integration
   - Government database connections
   - Third-party planning tools

3. **Advanced Analytics**
   - Predictive modeling
   - Scenario planning
   - Performance benchmarking

### Long-term Vision (1-2 years)

1. **Smart City Integration**
   - IoT sensor data integration
   - Real-time city monitoring
   - Adaptive planning algorithms

2. **Global Expansion**
   - Multi-region support
   - Localized planning regulations
   - Cultural adaptation features

3. **AI Evolution**
   - Custom model training
   - Advanced reasoning capabilities
   - Autonomous planning features

---

## Conclusion

The Agentic City Planner represents a significant advancement in AI-powered urban planning tools. This comprehensive documentation serves as the foundation for continued development, maintenance, and enhancement of the platform.

**Key Success Factors:**
- Robust AI integration with IBM Watson
- Scalable microservices architecture
- User-centric design approach
- Comprehensive testing and monitoring

**Next Steps:**
1. Review and validate all technical specifications
2. Establish development and deployment workflows
3. Implement monitoring and alerting systems
4. Begin user testing and feedback collection

---

**Document Maintenance:**
This document should be updated regularly to reflect changes in architecture, features, and team structure. All team members are responsible for keeping their sections current.

**Contact Information:**
- Technical Lead: [Contact Information]
- Product Manager: [Contact Information]
- DevOps Lead: [Contact Information]

---

*This document was generated through comprehensive codebase analysis and is intended to serve as the definitive technical reference for the Agentic City Planner project.*