import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.security import SecurityManager

client = TestClient(app)

# Create a security manager for generating test tokens
security_manager = SecurityManager()

# Helper function to create a test token
def create_test_token(user_data=None):
    """Create a test JWT token for authentication"""
    if user_data is None:
        user_data = {
            "user_id": "test_user",
            "username": "testuser",
            "role": "user"
        }
    return security_manager.create_access_token(user_data)

def test_health_check():
    """
    Test the health check endpoint
    """
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "message": "Simulation Engine is running"}

def test_list_models():
    """
    Test the list models endpoint
    """
    token = create_test_token()
    response = client.get("/models", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert len(data["models"]) > 0

def test_get_simulation_not_found():
    """
    Test getting a simulation that doesn't exist
    """
    token = create_test_token()
    response = client.get("/simulation/nonexistent",
                         headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200  # For now, we just return a placeholder
    data = response.json()
    assert data["simulation_id"] == "nonexistent"

def test_register_model():
    """
    Test registering a new model
    """
    token = create_test_token({"user_id": "test_admin", "username": "testadmin", "role": "admin"})
    model_info = {
        "name": "walkability",
        "description": "Pedestrian flow and accessibility analysis"
    }
    response = client.post("/models/register",
                           json=model_info,
                           headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "model" in data

# Test data
sample_input = {
    "zoning_plan": {
        "zones": [
            {
                "id": "zone1",
                "type": "residential",
                "area": 1000.0,
                "location": {"x": 0.0, "y": 0.0},
                "properties": {}
            }
        ]
    },
    "infra_edits": [],
    "traffic_inputs": {
        "population_density": 1000.0,
        "peak_hours": ["08:00", "17:00"],
        "vehicle_ownership": 0.8
    },
    "simulation_options": {
        "models": ["traffic"],
        "time_horizon": "5 years",
        "scenarios": ["optimistic"]
    }
}

def test_run_traffic_simulation():
    """
    Test running a traffic simulation
    """
    token = create_test_token()
    response = client.post("/simulate/traffic",
                          json=sample_input,
                          headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "simulation_id" in data
    assert "results" in data

def test_run_cost_simulation():
    """
    Test running a cost simulation
    """
    token = create_test_token()
    response = client.post("/simulate/cost",
                          json=sample_input,
                          headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "simulation_id" in data
    assert "results" in data

def test_run_pollution_simulation():
    """
    Test running a pollution simulation
    """
    token = create_test_token()
    response = client.post("/simulate/pollution",
                          json=sample_input,
                          headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "simulation_id" in data
    assert "results" in data

def test_run_comprehensive_simulation():
    """
    Test running a comprehensive simulation
    """
    token = create_test_token()
    response = client.post("/simulate",
                          json=sample_input,
                          headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "simulation_id" in data
    assert "results" in data