import pytest
import base64
from src.overlay_generator import OverlayGenerator

@pytest.fixture
def overlay_generator():
    """Create an OverlayGenerator instance for testing"""
    return OverlayGenerator()

@pytest.fixture
def sample_traffic_results():
    """Sample traffic results for testing"""
    return {
        "metrics": {
            "avg_travel_time": 15.5,
            "congestion_index": 0.8,
            "total_volume": 1000.0
        }
    }

@pytest.fixture
def sample_cost_results():
    """Sample cost results for testing"""
    return {
        "metrics": {
            "total_cost": 5000000,
            "annual_operational": 500000,
            "cost_per_capita": 500
        }
    }

@pytest.fixture
def sample_pollution_results():
    """Sample pollution results for testing"""
    return {
        "metrics": {
            "air_quality_index": 75.0,
            "co2_emissions": 50000,
            "pollution_hotspots": 2
        }
    }

@pytest.fixture
def sample_aggregated_results():
    """Sample aggregated results for testing"""
    return {
        "traffic": {
            "metrics": {
                "avg_travel_time": 15.5,
                "congestion_index": 0.8,
                "total_volume": 1000.0
            }
        },
        "cost": {
            "metrics": {
                "total_cost": 5000000,
                "annual_operational": 500000,
                "cost_per_capita": 500
            }
        },
        "pollution": {
            "metrics": {
                "air_quality_index": 75.0,
                "co2_emissions": 50000,
                "pollution_hotspots": 2
            }
        }
    }

def test_generate_traffic_overlay(overlay_generator, sample_traffic_results):
    """Test generating traffic overlay"""
    result = overlay_generator.generate_traffic_overlay(sample_traffic_results)
    
    assert isinstance(result, str)
    # Should be base64 encoded
    try:
        base64.b64decode(result)
    except Exception:
        pytest.fail("Traffic overlay is not valid base64")

def test_generate_cost_overlay(overlay_generator, sample_cost_results):
    """Test generating cost overlay"""
    result = overlay_generator.generate_cost_overlay(sample_cost_results)
    
    assert isinstance(result, str)
    # Should be base64 encoded
    try:
        base64.b64decode(result)
    except Exception:
        pytest.fail("Cost overlay is not valid base64")

def test_generate_pollution_overlay(overlay_generator, sample_pollution_results):
    """Test generating pollution overlay"""
    result = overlay_generator.generate_pollution_overlay(sample_pollution_results)
    
    assert isinstance(result, str)
    # Should be base64 encoded
    try:
        base64.b64decode(result)
    except Exception:
        pytest.fail("Pollution overlay is not valid base64")

def test_generate_combined_overlay(overlay_generator, sample_aggregated_results):
    """Test generating combined overlay"""
    result = overlay_generator.generate_combined_overlay(sample_aggregated_results)
    
    assert isinstance(result, str)
    # Should be base64 encoded
    try:
        base64.b64decode(result)
    except Exception:
        pytest.fail("Combined overlay is not valid base64")