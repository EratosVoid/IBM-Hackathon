import pytest
import numpy as np
from src.models.pollution_model import PollutionSimulationModel, PollutionMetrics

@pytest.fixture
def pollution_model():
    """Create a PollutionSimulationModel instance for testing"""
    return PollutionSimulationModel()

@pytest.fixture
def sample_zoning_plan():
    """Sample zoning plan for testing"""
    return {
        "zones": [
            {
                "id": "zone1",
                "type": "industrial",
                "area": 1000.0,
                "location": {"x": 0.0, "y": 0.0},
                "properties": {}
            },
            {
                "id": "zone2",
                "type": "green_space",
                "area": 500.0,
                "location": {"x": 1.0, "y": 1.0},
                "properties": {}
            }
        ]
    }

@pytest.fixture
def sample_infra_edits():
    """Sample infrastructure edits for testing"""
    return []

@pytest.fixture
def sample_traffic_inputs():
    """Sample traffic inputs for testing"""
    return {
        "population_density": 1000.0,
        "peak_hours": ["08:00", "17:00"],
        "vehicle_ownership": 0.8
    }

def test_calculate_zone_emissions(pollution_model, sample_zoning_plan):
    """Test calculating zone emissions"""
    result = pollution_model._calculate_zone_emissions(sample_zoning_plan)
    
    assert isinstance(result, dict)
    assert "residential" in result
    assert "commercial" in result
    assert "industrial" in result
    
    # Check that emissions are non-negative
    for emission in result.values():
        assert emission >= 0

def test_calculate_traffic_emissions(pollution_model, sample_traffic_inputs):
    """Test calculating traffic emissions"""
    vehicle_ownership = 0.8
    result = pollution_model._calculate_traffic_emissions(sample_traffic_inputs, vehicle_ownership)
    
    assert isinstance(result, float)
    assert result >= 0

def test_calculate_co2_emissions(pollution_model, sample_zoning_plan):
    """Test calculating CO2 emissions"""
    result = pollution_model._calculate_co2_emissions(sample_zoning_plan)
    
    assert isinstance(result, float)
    assert result >= 0

def test_calculate_green_space_benefit(pollution_model, sample_zoning_plan):
    """Test calculating green space benefit"""
    result = pollution_model._calculate_green_space_benefit(sample_zoning_plan)
    
    assert isinstance(result, float)
    assert result >= 0

def test_calculate_air_quality_index(pollution_model):
    """Test calculating air quality index"""
    total_emissions = 1000.0
    green_space_benefit = 200.0
    result = pollution_model._calculate_air_quality_index(total_emissions, green_space_benefit)
    
    assert isinstance(result, float)
    # AQI should be between 0 and 100
    assert 0 <= result <= 100

def test_identify_pollution_hotspots(pollution_model, sample_zoning_plan, sample_traffic_inputs):
    """Test identifying pollution hotspots"""
    result = pollution_model._identify_pollution_hotspots(sample_zoning_plan, sample_traffic_inputs)
    
    assert isinstance(result, int)
    assert result >= 0

def test_generate_pollution_map(pollution_model, sample_zoning_plan):
    """Test generating pollution map"""
    air_quality_index = 75.0
    result = pollution_model._generate_pollution_map(sample_zoning_plan, air_quality_index)
    
    assert isinstance(result, dict)
    assert "type" in result
    assert "features" in result
    assert result["type"] == "FeatureCollection"

def test_generate_mitigation_recommendations(pollution_model):
    """Test generating mitigation recommendations"""
    air_quality_index = 40.0
    pollution_hotspots = 3
    result = pollution_model._generate_mitigation_recommendations(air_quality_index, pollution_hotspots)
    
    assert isinstance(result, list)
    assert len(result) > 0

def test_generate_environmental_impact_summary(pollution_model):
    """Test generating environmental impact summary"""
    air_quality_index = 75.0
    co2_emissions = 50000
    result = pollution_model._generate_environmental_impact_summary(air_quality_index, co2_emissions)
    
    assert isinstance(result, str)
    assert len(result) > 0

def test_run_simulation(pollution_model, sample_zoning_plan, sample_infra_edits, sample_traffic_inputs):
    """Test running the pollution simulation"""
    result = pollution_model.run_simulation(sample_zoning_plan, sample_infra_edits, sample_traffic_inputs)
    
    assert isinstance(result, PollutionMetrics)
    assert hasattr(result, 'air_quality_index')
    assert hasattr(result, 'co2_emissions')
    assert hasattr(result, 'pollution_hotspots')
    assert hasattr(result, 'pollution_map')
    assert hasattr(result, 'recommendations')
    assert hasattr(result, 'environmental_impact_score')
    
    # Check that metrics are reasonable
    assert 0 <= result.air_quality_index <= 100
    assert result.co2_emissions >= 0
    assert result.pollution_hotspots >= 0