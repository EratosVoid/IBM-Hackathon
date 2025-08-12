import pytest
import numpy as np
from src.models.traffic_model import TrafficSimulationModel, TrafficMetrics

@pytest.fixture
def traffic_model():
    """Create a TrafficSimulationModel instance for testing"""
    return TrafficSimulationModel()

@pytest.fixture
def sample_zoning_plan():
    """Sample zoning plan for testing"""
    return {
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

@pytest.fixture
def sample_infra_edits():
    """Sample infrastructure edits for testing"""
    return [
        {
            "type": "road",
            "action": "add",
            "specifications": {}
        }
    ]

@pytest.fixture
def sample_traffic_inputs():
    """Sample traffic inputs for testing"""
    return {
        "population_density": 1000.0,
        "peak_hours": ["08:00", "17:00"],
        "vehicle_ownership": 0.8
    }

def test_build_road_network(traffic_model, sample_infra_edits):
    """Test building road network from infrastructure edits"""
    result = traffic_model._build_road_network(sample_infra_edits)
    
    # Should return a NetworkX Graph
    assert hasattr(result, 'nodes')
    assert hasattr(result, 'edges')

def test_calculate_congestion(traffic_model, sample_infra_edits):
    """Test calculating congestion levels"""
    road_network = traffic_model._build_road_network(sample_infra_edits)
    population_density = 1000.0
    result = traffic_model._calculate_congestion(road_network, population_density)
    
    assert isinstance(result, dict)
    # Should have congestion levels for each edge
    assert len(result) == len(road_network.edges())

def test_calculate_travel_times(traffic_model, sample_infra_edits):
    """Test calculating travel times"""
    road_network = traffic_model._build_road_network(sample_infra_edits)
    congestion_levels = traffic_model._calculate_congestion(road_network, 1000.0)
    result = traffic_model._calculate_travel_times(road_network, congestion_levels)
    
    assert isinstance(result, dict)
    # Should have travel times for each edge
    assert len(result) == len(road_network.edges())

def test_generate_traffic_flow_map(traffic_model, sample_infra_edits):
    """Test generating traffic flow map"""
    road_network = traffic_model._build_road_network(sample_infra_edits)
    travel_times = traffic_model._calculate_travel_times(road_network, {})
    result = traffic_model._generate_traffic_flow_map(road_network, travel_times)
    
    assert isinstance(result, dict)
    assert "type" in result
    assert "features" in result
    assert result["type"] == "FeatureCollection"

def test_generate_congestion_heatmap(traffic_model, sample_infra_edits):
    """Test generating congestion heatmap"""
    road_network = traffic_model._build_road_network(sample_infra_edits)
    congestion_levels = traffic_model._calculate_congestion(road_network, 1000.0)
    result = traffic_model._generate_congestion_heatmap(road_network, congestion_levels)
    
    assert isinstance(result, dict)
    assert "type" in result
    assert "features" in result
    assert result["type"] == "FeatureCollection"

def test_run_simulation(traffic_model, sample_zoning_plan, sample_infra_edits, sample_traffic_inputs):
    """Test running the traffic simulation"""
    result = traffic_model.run_simulation(sample_zoning_plan, sample_infra_edits, sample_traffic_inputs)
    
    assert isinstance(result, TrafficMetrics)
    assert hasattr(result, 'avg_travel_time')
    assert hasattr(result, 'congestion_index')
    assert hasattr(result, 'total_volume')
    assert hasattr(result, 'flow_map')
    assert hasattr(result, 'congestion_heatmap')
    
    # Check that metrics are reasonable
    assert result.avg_travel_time >= 0
    assert result.congestion_index >= 0
    assert result.total_volume >= 0