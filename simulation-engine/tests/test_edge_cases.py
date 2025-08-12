import pytest
import numpy as np
from src.data_processor import DataProcessor
from src.models.traffic_model import TrafficSimulationModel, TrafficMetrics
from src.models.cost_model import CostEstimationModel, CostMetrics
from src.models.pollution_model import PollutionSimulationModel, PollutionMetrics

@pytest.fixture
def data_processor():
    """Create a DataProcessor instance for testing"""
    return DataProcessor()

@pytest.fixture
def traffic_model():
    """Create a TrafficSimulationModel instance for testing"""
    return TrafficSimulationModel()

@pytest.fixture
def cost_model():
    """Create a CostEstimationModel instance for testing"""
    return CostEstimationModel()

@pytest.fixture
def pollution_model():
    """Create a PollutionSimulationModel instance for testing"""
    return PollutionSimulationModel()

# Edge case test data
empty_zoning_plan = {
    "zones": []
}

large_zoning_plan = {
    "zones": [
        {
            "id": f"zone{i}",
            "type": "residential" if i % 3 == 0 else "commercial" if i % 3 == 1 else "industrial",
            "area": float(i * 100),
            "location": {"x": float(i), "y": float(i * 2)},
            "properties": {}
        } for i in range(100)  # 100 zones
    ]
}

zero_values_input = {
    "population_density": 0.0,
    "peak_hours": ["08:00", "17:00"],
    "vehicle_ownership": 0.0
}

extreme_values_input = {
    "population_density": 1000000.0,  # Very high density
    "peak_hours": ["08:00", "17:00"],
    "vehicle_ownership": 1.0  # 100% vehicle ownership
}

def test_data_processor_with_empty_zoning_plan(data_processor):
    """Test data processor with empty zoning plan"""
    input_data = {
        "zoning_plan": empty_zoning_plan,
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
    
    result = data_processor.process_input_data(input_data)
    assert isinstance(result, dict)
    assert "zoning_plan" in result

def test_data_processor_with_large_zoning_plan(data_processor):
    """Test data processor with large zoning plan"""
    input_data = {
        "zoning_plan": large_zoning_plan,
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
    
    result = data_processor.process_input_data(input_data)
    assert isinstance(result, dict)
    assert "zoning_plan" in result
    assert len(result["zoning_plan"]["zones"]) == 100

def test_traffic_model_with_zero_values(traffic_model):
    """Test traffic model with zero values"""
    zoning_plan = {
        "zones": [
            {
                "id": "zone1",
                "type": "residential",
                "area": 1000.0,
                "location": {"x": 0.0, "y": 0.0},
                "properties": {}
            }
        ]
    }
    infra_edits = []
    
    result = traffic_model.run_simulation(zoning_plan, infra_edits, zero_values_input)
    assert isinstance(result, TrafficMetrics)
    # Should handle zero values gracefully
    assert result.avg_travel_time >= 0
    assert result.congestion_index >= 0

def test_traffic_model_with_extreme_values(traffic_model):
    """Test traffic model with extreme values"""
    zoning_plan = {
        "zones": [
            {
                "id": "zone1",
                "type": "residential",
                "area": 1000.0,
                "location": {"x": 0.0, "y": 0.0},
                "properties": {}
            }
        ]
    }
    infra_edits = []
    
    result = traffic_model.run_simulation(zoning_plan, infra_edits, extreme_values_input)
    assert isinstance(result, TrafficMetrics)
    # Should handle extreme values gracefully
    assert result.avg_travel_time >= 0
    assert result.congestion_index >= 0

def test_cost_model_with_zero_population(cost_model):
    """Test cost model with zero population"""
    zoning_plan = {
        "zones": [
            {
                "id": "zone1",
                "type": "residential",
                "area": 1000.0,
                "location": {"x": 0.0, "y": 0.0},
                "properties": {}
            }
        ]
    }
    infra_edits = []
    traffic_inputs = zero_values_input
    population = 0.0
    
    result = cost_model.run_simulation(zoning_plan, infra_edits, traffic_inputs, population)
    assert isinstance(result, CostMetrics)
    # Should handle zero population gracefully
    assert result.total_cost >= 0
    assert result.annual_operational >= 0

def test_cost_model_with_large_values(cost_model):
    """Test cost model with large values"""
    zoning_plan = large_zoning_plan
    infra_edits = [
        {
            "type": "road",
            "action": "add",
            "specifications": {
                "length_km": 1000.0  # Very long road
            }
        }
    ]
    traffic_inputs = extreme_values_input
    population = 10000000.0  # 10 million people
    
    result = cost_model.run_simulation(zoning_plan, infra_edits, traffic_inputs, population)
    assert isinstance(result, CostMetrics)
    # Should handle large values gracefully
    assert result.total_cost >= 0
    assert result.annual_operational >= 0

def test_pollution_model_with_zero_emissions(pollution_model):
    """Test pollution model with zero emissions"""
    zoning_plan = {
        "zones": [
            {
                "id": "zone1",
                "type": "green_space",  # Green space has no emissions
                "area": 1000.0,
                "location": {"x": 0.0, "y": 0.0},
                "properties": {}
            }
        ]
    }
    infra_edits = []
    
    result = pollution_model.run_simulation(zoning_plan, infra_edits, zero_values_input)
    assert isinstance(result, PollutionMetrics)
    # Should handle zero emissions gracefully
    assert result.air_quality_index >= 0
    assert result.co2_emissions >= 0

def test_pollution_model_with_high_emissions(pollution_model):
    """Test pollution model with high emissions"""
    zoning_plan = {
        "zones": [
            {
                "id": "zone1",
                "type": "industrial",  # Industrial zones have high emissions
                "area": 10000.0,  # Large area
                "location": {"x": 0.0, "y": 0.0},
                "properties": {}
            }
        ]
    }
    infra_edits = []
    traffic_inputs = extreme_values_input
    
    result = pollution_model.run_simulation(zoning_plan, infra_edits, traffic_inputs)
    assert isinstance(result, PollutionMetrics)
    # Should handle high emissions gracefully
    assert 0 <= result.air_quality_index <= 100
    assert result.co2_emissions >= 0

def test_estimate_population_edge_cases(data_processor):
    """Test population estimation with edge cases"""
    # Test with no residential or commercial zones
    zoning_plan_no_pop = {
        "zones": [
            {
                "id": "zone1",
                "type": "industrial",
                "area": 1000.0,
                "location": {"x": 0.0, "y": 0.0},
                "properties": {}
            }
        ]
    }
    
    population = data_processor.estimate_population(zoning_plan_no_pop, 1000.0)
    # Should be 0 since there are no residential or commercial zones
    assert population == 0.0
    
    # Test with very high density
    zoning_plan = {
        "zones": [
            {
                "id": "zone1",
                "type": "residential",
                "area": 1000.0,
                "location": {"x": 0.0, "y": 0.0},
                "properties": {}
            }
        ]
    }
    
    population = data_processor.estimate_population(zoning_plan, 1000000.0)
    # Should handle high density
    assert population >= 0