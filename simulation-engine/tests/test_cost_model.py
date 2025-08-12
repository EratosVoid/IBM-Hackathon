import pytest
import numpy as np
from src.models.cost_model import CostEstimationModel, CostMetrics

@pytest.fixture
def cost_model():
    """Create a CostEstimationModel instance for testing"""
    return CostEstimationModel()

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
            "specifications": {
                "length_km": 2.5
            }
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

def test_calculate_infrastructure_cost(cost_model, sample_zoning_plan, sample_infra_edits):
    """Test calculating infrastructure costs"""
    result = cost_model._calculate_infrastructure_cost(sample_zoning_plan, sample_infra_edits)
    
    assert isinstance(result, dict)
    assert "zoning" in result
    assert "roads" in result
    assert "utilities" in result
    assert "buildings" in result
    
    # Check that costs are non-negative
    for cost in result.values():
        assert cost >= 0

def test_calculate_operational_cost(cost_model):
    """Test calculating operational costs"""
    population = 5000
    result = cost_model._calculate_operational_cost(population)
    
    assert isinstance(result, float)
    assert result >= 0
    # Should be proportional to population
    expected = population * cost_model.cost_factors["service_cost_per_capita"]
    assert result == expected

def test_calculate_maintenance_cost(cost_model):
    """Test calculating maintenance costs"""
    infrastructure_cost = 1000000
    result = cost_model._calculate_maintenance_cost(infrastructure_cost)
    
    assert isinstance(result, float)
    assert result >= 0
    # Should be a percentage of infrastructure cost
    expected = infrastructure_cost * cost_model.cost_factors["maintenance_rate"]
    assert result == expected

def test_generate_budget_recommendations(cost_model):
    """Test generating budget recommendations"""
    total_cost = 15000000  # 15 million
    annual_operational = 2000000  # 2 million
    result = cost_model._generate_budget_recommendations(total_cost, annual_operational)
    
    assert isinstance(result, list)
    assert len(result) > 0
    # Should have at least the default recommendations
    assert "Set aside 10% of total cost for contingencies" in result
    assert "Review financing options for long-term sustainability" in result

def test_generate_financial_impact_summary(cost_model):
    """Test generating financial impact summary"""
    total_cost = 5000000
    cost_per_capita = 500
    result = cost_model._generate_financial_impact_summary(total_cost, cost_per_capita)
    
    assert isinstance(result, str)
    assert len(result) > 0
    # Should contain descriptive text
    assert "scale" in result.lower()
    assert "burden" in result.lower()

def test_run_simulation(cost_model, sample_zoning_plan, sample_infra_edits, sample_traffic_inputs):
    """Test running the cost simulation"""
    population = 5000
    result = cost_model.run_simulation(sample_zoning_plan, sample_infra_edits, sample_traffic_inputs, population)
    
    assert isinstance(result, CostMetrics)
    assert hasattr(result, 'total_cost')
    assert hasattr(result, 'annual_operational')
    assert hasattr(result, 'cost_per_capita')
    assert hasattr(result, 'breakdown')
    assert hasattr(result, 'budget_recommendations')
    assert hasattr(result, 'financial_impact_summary')
    
    # Check that metrics are reasonable
    assert result.total_cost >= 0
    assert result.annual_operational >= 0
    assert result.cost_per_capita >= 0