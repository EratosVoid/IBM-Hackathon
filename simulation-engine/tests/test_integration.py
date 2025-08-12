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

# Test data with various scenarios
valid_input = {
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

invalid_zone_type_input = {
    "zoning_plan": {
        "zones": [
            {
                "id": "zone1",
                "type": "invalid_type",  # Invalid zone type
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

missing_required_field_input = {
    "zoning_plan": {
        "zones": [
            {
                "id": "zone1",
                "type": "residential",
                "area": 1000.0
                # Missing location field
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

invalid_model_name_input = {
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
        "models": ["invalid_model"],  # Invalid model name
        "time_horizon": "5 years",
        "scenarios": ["optimistic"]
    }
}

def test_health_check():
    """Test the health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "message": "Simulation Engine is running"}

def test_list_models():
    """Test the list models endpoint"""
    token = create_test_token()
    response = client.get("/models", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert len(data["models"]) > 0

def test_run_traffic_simulation_valid_input():
    """Test running a traffic simulation with valid input"""
    token = create_test_token()
    response = client.post("/simulate/traffic",
                          json=valid_input,
                          headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "simulation_id" in data
    assert "results" in data

def test_run_cost_simulation_valid_input():
    """Test running a cost simulation with valid input"""
    token = create_test_token()
    response = client.post("/simulate/cost",
                          json=valid_input,
                          headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "simulation_id" in data
    assert "results" in data

def test_run_pollution_simulation_valid_input():
    """Test running a pollution simulation with valid input"""
    token = create_test_token()
    response = client.post("/simulate/pollution",
                          json=valid_input,
                          headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "simulation_id" in data
    assert "results" in data

def test_run_comprehensive_simulation_valid_input():
    """Test running a comprehensive simulation with valid input"""
    token = create_test_token()
    response = client.post("/simulate",
                          json=valid_input,
                          headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "simulation_id" in data
    assert "results" in data

def test_run_simulation_invalid_zone_type():
    """Test running a simulation with invalid zone type"""
    token = create_test_token()
    response = client.post("/simulate/traffic",
                          json=invalid_zone_type_input,
                          headers={"Authorization": f"Bearer {token}"})
    # Should return 422 for validation error
    assert response.status_code == 422

def test_run_simulation_missing_required_field():
    """Test running a simulation with missing required field"""
    token = create_test_token()
    response = client.post("/simulate/traffic",
                          json=missing_required_field_input,
                          headers={"Authorization": f"Bearer {token}"})
    # Should return 422 for validation error
    assert response.status_code == 422

def test_run_simulation_invalid_model_name():
    """Test running a simulation with invalid model name"""
    token = create_test_token()
    response = client.post("/simulate/traffic",
                          json=invalid_model_name_input,
                          headers={"Authorization": f"Bearer {token}"})
    # Should return 422 for validation error
    assert response.status_code == 422

def test_get_simulation_not_found():
    """Test getting a simulation that doesn't exist"""
    token = create_test_token()
    response = client.get("/simulation/nonexistent",
                         headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200  # For now, we just return a placeholder
    data = response.json()
    assert data["simulation_id"] == "nonexistent"

def test_register_model():
    """Test registering a new model"""
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

def test_register_with_planner_agent():
    """Test registering with planner agent"""
    # This is a placeholder test since we can't actually call an external service
    # In a real test, you would use mocking to test this functionality
    response = client.post("/register-with-planner", params={"planner_url": "http://localhost:8001"})
    # This will likely fail since we're not providing authentication
    # but we can at least check that the endpoint exists
    assert response.status_code in [401, 403, 500]