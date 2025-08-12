import traceback
from fastapi.testclient import TestClient
from src.main import app
from src.security import SecurityManager

# Create a test client
client = TestClient(app)
security_manager = SecurityManager()

# Test data
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

# Create a token
token = security_manager.create_access_token({
    "user_id": "test_user",
    "username": "testuser",
    "role": "user"
})

try:
    response = client.post("/simulate", 
                          json=valid_input, 
                          headers={"Authorization": f"Bearer {token}"})
    print("Status code:", response.status_code)
    print("Response:", response.json())
except Exception as e:
    print("Exception:", str(e))
    traceback.print_exc()