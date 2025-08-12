import pytest
from src.summary_generator import SummaryGenerator

@pytest.fixture
def summary_generator():
    """Create a SummaryGenerator instance for testing"""
    return SummaryGenerator()

@pytest.fixture
def sample_results():
    """Sample results for testing"""
    return {
        "traffic": {
            "metrics": {
                "avg_travel_time": 15.5,
                "congestion_index": 0.8,
                "total_volume": 1000.0
            },
            "spatial_overlay": {"type": "FeatureCollection", "features": []}
        },
        "cost": {
            "metrics": {
                "total_cost": 5000000,
                "annual_operational": 500000,
                "cost_per_capita": 500
            },
            "breakdown": {
                "zoning": 3000000, 
                "roads": 1000000, 
                "utilities": 1000000, 
                "buildings": 1000000
            },
            "recommendations": [
                "Phase project to manage costs", 
                "Set aside 10% for contingencies"
            ]
        },
        "pollution": {
            "metrics": {
                "air_quality_index": 75.0,
                "co2_emissions": 50000,
                "pollution_hotspots": 2
            },
            "recommendations": [
                "Promote public transportation to reduce vehicle emissions", 
                "Regular air quality monitoring and reporting"
            ]
        }
    }

def test_generate_executive_summary(summary_generator, sample_results):
    """Test generating executive summary"""
    result = summary_generator.generate_executive_summary(sample_results)
    
    assert isinstance(result, str)
    assert len(result) > 0
    # Should contain key information
    assert "traffic" in result.lower()
    assert "air quality" in result.lower()
    assert "cost" in result.lower()

def test_generate_key_findings(summary_generator, sample_results):
    """Test generating key findings"""
    result = summary_generator.generate_key_findings(sample_results)
    
    assert isinstance(result, list)
    assert len(result) > 0
    # Should have findings for each model
    assert any("traffic" in finding.lower() for finding in result)
    assert any("cost" in finding.lower() for finding in result)
    assert any("air quality" in finding.lower() for finding in result)

def test_generate_recommendations(summary_generator, sample_results):
    """Test generating recommendations"""
    result = summary_generator.generate_recommendations(sample_results)
    
    assert isinstance(result, list)
    assert len(result) > 0
    # Should include general recommendations
    assert any("monitoring" in rec.lower() for rec in result)
    assert any("community" in rec.lower() for rec in result)

def test_generate_comprehensive_summary(summary_generator, sample_results):
    """Test generating comprehensive summary"""
    result = summary_generator.generate_comprehensive_summary(sample_results)
    
    assert isinstance(result, dict)
    assert "executive_summary" in result
    assert "key_findings" in result
    assert "recommendations" in result
    
    assert isinstance(result["executive_summary"], str)
    assert isinstance(result["key_findings"], list)
    assert isinstance(result["recommendations"], list)
    
    assert len(result["executive_summary"]) > 0
    assert len(result["key_findings"]) > 0
    assert len(result["recommendations"]) > 0