import pytest
import pandas as pd
import numpy as np
from src.data_processor import DataProcessor

@pytest.fixture
def data_processor():
    """Create a DataProcessor instance for testing"""
    return DataProcessor()

@pytest.fixture
def sample_input_data():
    """Sample input data for testing"""
    return {
        "zoning_plan": {
            "zones": [
                {
                    "id": "zone1",
                    "type": "residential",
                    "area": 1000.0,
                    "location": {"x": 0.0, "y": 0.0},
                    "properties": {}
                },
                {
                    "id": "zone2",
                    "type": "commercial",
                    "area": 500.0,
                    "location": {"x": 1.0, "y": 1.0},
                    "properties": {}
                }
            ]
        },
        "infra_edits": [
            {
                "type": "road",
                "action": "add",
                "specifications": {
                    "length_km": 2.5
                }
            }
        ],
        "traffic_inputs": {
            "population_density": 1000.0,
            "peak_hours": ["08:00", "17:00"],
            "vehicle_ownership": 0.8
        },
        "simulation_options": {
            "models": ["traffic", "cost", "pollution"],
            "time_horizon": "5 years",
            "scenarios": ["optimistic"]
        }
    }

def test_normalize_zoning_data(data_processor, sample_input_data):
    """Test normalizing zoning data"""
    zoning_plan = sample_input_data["zoning_plan"]
    result = data_processor.normalize_zoning_data(zoning_plan)
    
    assert isinstance(result, pd.DataFrame)
    assert len(result) == 2
    assert "zone_id" in result.columns
    assert "zone_type" in result.columns
    assert "area" in result.columns
    assert "location_x" in result.columns
    assert "location_y" in result.columns
    assert "properties" in result.columns

def test_normalize_infra_edits(data_processor, sample_input_data):
    """Test normalizing infrastructure edits"""
    infra_edits = sample_input_data["infra_edits"]
    result = data_processor.normalize_infra_edits(infra_edits)
    
    assert isinstance(result, pd.DataFrame)
    assert len(result) == 1
    assert "type" in result.columns
    assert "action" in result.columns
    assert "specifications" in result.columns

def test_normalize_traffic_inputs(data_processor, sample_input_data):
    """Test normalizing traffic inputs"""
    traffic_inputs = sample_input_data["traffic_inputs"]
    result = data_processor.normalize_traffic_inputs(traffic_inputs)
    
    assert isinstance(result, dict)
    assert "population_density" in result
    assert "peak_hours" in result
    assert "vehicle_ownership" in result
    assert result["population_density"] == 1000.0
    assert result["vehicle_ownership"] == 0.8

def test_estimate_population(data_processor, sample_input_data):
    """Test population estimation"""
    zoning_plan = sample_input_data["zoning_plan"]
    population_density = sample_input_data["traffic_inputs"]["population_density"]
    result = data_processor.estimate_population(zoning_plan, population_density)
    
    # Population should be calculated as (residential_area + commercial_area) * density
    expected = (1000.0 + 500.0) * 1000.0
    assert result == expected

def test_process_input_data(data_processor, sample_input_data):
    """Test processing input data"""
    result = data_processor.process_input_data(sample_input_data)
    
    assert isinstance(result, dict)
    assert "zoning_plan" in result
    assert "infra_edits" in result
    assert "traffic_inputs" in result
    assert "population" in result
    assert "models_to_run" in result

def test_run_selected_simulations(data_processor, sample_input_data):
    """Test running selected simulations"""
    processed_data = data_processor.process_input_data(sample_input_data)
    result = data_processor.run_selected_simulations(processed_data)
    
    assert isinstance(result, dict)
    # Should have results for all three models
    assert "traffic" in result
    assert "cost" in result
    assert "pollution" in result
    
    # Check that each model has the expected structure
    for model in ["traffic", "cost", "pollution"]:
        assert "metrics" in result[model] or "error" in result[model]