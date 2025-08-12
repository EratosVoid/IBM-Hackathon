# Simulation Engine

The Simulation Engine is a critical component of the Agentic City Planner system that computes quantitative outcomes for urban planning changes, including traffic flow, cost estimation, and pollution impact.

## Features

- Traffic flow simulation
- Cost estimation for infrastructure projects
- Pollution impact analysis
- REST API for integration with the Planner Agent
- Modular architecture for extensibility

## Technology Stack

- **Language**: Python
- **Framework**: FastAPI
- **Data Processing**: Pandas, NumPy
- **Visualization**: Matplotlib, Folium
- **Testing**: Pytest
- **Deployment**: Docker

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd simulation-engine

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Usage

```bash
# Run the server
uvicorn src.main:app --reload
```

## API Endpoints

- `GET /health` - Health check
- `POST /simulate` - Run comprehensive simulation
- `POST /simulate/traffic` - Traffic flow simulation
- `POST /simulate/cost` - Cost estimation simulation
- `POST /simulate/pollution` - Pollution impact simulation

## Testing

```bash
# Run tests
pytest
```

## License

MIT