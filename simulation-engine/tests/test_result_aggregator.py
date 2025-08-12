import pytest
from src.result_aggregator import ResultAggregator
from src.models.traffic_model import TrafficMetrics
from src.models.cost_model import CostMetrics
from src.models.pollution_model import PollutionMetrics

@pytest.fixture
def result_aggregator():
    """Create a ResultAggregator instance for testing"""
    return ResultAggregator()

@pytest.fixture
def sample_traffic_results():
    """Sample traffic results for testing"""
    return TrafficMetrics(
        avg_travel_time=15.5,
        congestion_index=0.8,
        total_volume=1000.0,
        flow_map={"type": "FeatureCollection", "features": []},
        congestion_heatmap={"type": "FeatureCollection", "features": []}
    )

@pytest.fixture
def sample_cost_results():
    """Sample cost results for testing"""
    return CostMetrics(
        total_cost=5000000,
        annual_operational=500000,
        cost_per_capita=500,
        breakdown={"zoning": 3000000, "roads": 1000000, "utilities": 1000000, "buildings": 1000000},
        budget_recommendations=["Phase project to manage costs", "Set aside 10% for contingencies"],
        financial_impact_summary="This is a moderate scale project with a moderate financial burden per capita."
    )

@pytest.fixture
def sample_pollution_results():
    """Sample pollution results for testing"""
    return PollutionMetrics(
        air_quality_index=75.0,
        co2_emissions=50000,
        pollution_hotspots=2,
        pollution_map={"type": "FeatureCollection", "features": []},
        recommendations=["Promote public transportation to reduce vehicle emissions", "Regular air quality monitoring and reporting"],
        environmental_impact_score="Air quality is good with a moderate carbon footprint."
    )

def test_aggregate_results(result_aggregator, sample_traffic_results, sample_cost_results, sample_pollution_results):
    """Test aggregating results from all models"""
    result = result_aggregator.aggregate_results(sample_traffic_results, sample_cost_results, sample_pollution_results)
    
    assert isinstance(result, dict)
    assert "traffic" in result
    assert "cost" in result
    assert "pollution" in result
    
    # Check traffic results structure
    assert "metrics" in result["traffic"]
    assert "spatial_overlay" in result["traffic"]
    assert "avg_travel_time" in result["traffic"]["metrics"]
    assert "congestion_index" in result["traffic"]["metrics"]
    assert "total_volume" in result["traffic"]["metrics"]
    
    # Check cost results structure
    assert "metrics" in result["cost"]
    assert "breakdown" in result["cost"]
    assert "total_cost" in result["cost"]["metrics"]
    assert "annual_operational" in result["cost"]["metrics"]
    assert "cost_per_capita" in result["cost"]["metrics"]
    
    # Check pollution results structure
    assert "metrics" in result["pollution"]
    assert "recommendations" in result["pollution"]
    assert "air_quality_index" in result["pollution"]["metrics"]
    assert "co2_emissions" in result["pollution"]["metrics"]
    assert "pollution_hotspots" in result["pollution"]["metrics"]

def test_create_comparative_analysis(result_aggregator, sample_traffic_results, sample_cost_results, sample_pollution_results):
    """Test creating comparative analysis"""
    # First aggregate results
    aggregated = result_aggregator.aggregate_results(sample_traffic_results, sample_cost_results, sample_pollution_results)
    
    # Then create comparative analysis
    result = result_aggregator.create_comparative_analysis(aggregated)
    
    assert isinstance(result, dict)
    assert "tradeoffs" in result
    assert "synergies" in result
    assert "conflicts" in result
    assert "overall_score" in result
    
    assert isinstance(result["tradeoffs"], list)
    assert isinstance(result["synergies"], list)
    assert isinstance(result["conflicts"], list)
    assert isinstance(result["overall_score"], float)
    
    # Overall score should be between 0 and 100
    assert 0 <= result["overall_score"] <= 100

def test_generate_update_diffs(result_aggregator, sample_traffic_results, sample_cost_results, sample_pollution_results):
    """Test generating update diffs"""
    # First aggregate results
    aggregated = result_aggregator.aggregate_results(sample_traffic_results, sample_cost_results, sample_pollution_results)
    
    # Then generate update diffs
    result = result_aggregator.generate_update_diffs(aggregated)
    
    assert isinstance(result, dict)
    assert "map_updates" in result
    assert "layer_updates" in result
    
    assert isinstance(result["map_updates"], list)
    assert isinstance(result["layer_updates"], list)