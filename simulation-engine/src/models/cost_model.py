import numpy as np
from typing import Dict, List, Any
from dataclasses import dataclass
from src.performance_optimizer import performance_optimizer

@dataclass
class CostMetrics:
    """Data class to hold cost simulation metrics"""
    total_cost: float
    annual_operational: float
    cost_per_capita: float
    breakdown: Dict[str, float]  # Breakdown of costs
    budget_recommendations: List[str]  # Budget recommendations
    financial_impact_summary: str  # Summary of financial impact

class CostEstimationModel:
    """
    Cost Estimation Model for calculating infrastructure and operational costs.
    
    This model estimates financial costs of proposed changes including infrastructure
    costs, operational costs, and economic impact analysis.
    """
    
    def __init__(self):
        """Initialize the cost estimation model"""
        # Cost factors (these would typically come from a database or configuration)
        self.cost_factors = {
            "residential_zone": 100000,  # Cost per unit area for residential zones
            "commercial_zone": 150000,   # Cost per unit area for commercial zones
            "industrial_zone": 120000,   # Cost per unit area for industrial zones
            "green_space": 50000,        # Cost per unit area for green spaces
            "road_km": 500000,           # Cost per km of road
            "utility_km": 300000,        # Cost per km of utilities
            "building_unit": 200000,     # Cost per building unit
            "maintenance_rate": 0.05,    # Annual maintenance rate
            "service_cost_per_capita": 500  # Annual service cost per capita
        }
    
    def _calculate_infrastructure_cost(self, zoning_plan: Dict, 
                                     infra_edits: List[Dict]) -> Dict[str, float]:
        """
        Calculate infrastructure costs based on zoning plan and infrastructure edits.
        
        Args:
            zoning_plan: Zoning plan information
            infra_edits: Infrastructure edits
            
        Returns:
            Dictionary with infrastructure cost breakdown
        """
        costs = {
            "zoning": 0.0,
            "roads": 0.0,
            "utilities": 0.0,
            "buildings": 0.0
        }
        
        # Calculate zoning costs
        for zone in zoning_plan.get("zones", []):
            zone_type = zone.get("type", "")
            area = zone.get("area", 0.0)
            
            if zone_type == "residential":
                costs["zoning"] += area * self.cost_factors["residential_zone"]
            elif zone_type == "commercial":
                costs["zoning"] += area * self.cost_factors["commercial_zone"]
            elif zone_type == "industrial":
                costs["zoning"] += area * self.cost_factors["industrial_zone"]
            elif zone_type == "green_space":
                costs["zoning"] += area * self.cost_factors["green_space"]
        
        # Calculate infrastructure costs
        for edit in infra_edits:
            edit_type = edit.get("type", "")
            action = edit.get("action", "")
            
            # Only calculate costs for additions
            if action == "add":
                specifications = edit.get("specifications", {})
                
                if edit_type == "road":
                    length = specifications.get("length_km", 1.0)
                    costs["roads"] += length * self.cost_factors["road_km"]
                elif edit_type == "utility":
                    length = specifications.get("length_km", 1.0)
                    costs["utilities"] += length * self.cost_factors["utility_km"]
                elif edit_type == "building":
                    units = specifications.get("units", 1)
                    costs["buildings"] += units * self.cost_factors["building_unit"]
        
        return costs
    
    def _calculate_operational_cost(self, population: float) -> float:
        """
        Calculate annual operational costs.
        
        Args:
            population: Estimated population
            
        Returns:
            Annual operational cost
        """
        # Simplified operational cost calculation
        return float(population * self.cost_factors["service_cost_per_capita"])
    
    def _calculate_maintenance_cost(self, infrastructure_cost: float) -> float:
        """
        Calculate annual maintenance costs.
        
        Args:
            infrastructure_cost: Total infrastructure cost
            
        Returns:
            Annual maintenance cost
        """
        return infrastructure_cost * self.cost_factors["maintenance_rate"]
    
    def _generate_budget_recommendations(self, total_cost: float, 
                                       annual_operational: float) -> List[str]:
        """
        Generate budget recommendations based on cost analysis.
        
        Args:
            total_cost: Total project cost
            annual_operational: Annual operational cost
            
        Returns:
            List of budget recommendations
        """
        recommendations = []
        
        if total_cost > 10000000:  # 10 million
            recommendations.append("Consider phasing the project to manage costs")
        
        if annual_operational > 1000000:  # 1 million per year
            recommendations.append("Explore public-private partnerships to share costs")
        
        recommendations.append("Set aside 10% of total cost for contingencies")
        recommendations.append("Review financing options for long-term sustainability")
        
        return recommendations
    
    def _generate_financial_impact_summary(self, total_cost: float, 
                                         cost_per_capita: float) -> str:
        """
        Generate a summary of the financial impact.
        
        Args:
            total_cost: Total project cost
            cost_per_capita: Cost per capita
            
        Returns:
            Financial impact summary
        """
        if total_cost < 1000000:
            scale = "relatively small"
        elif total_cost < 10000000:
            scale = "moderate"
        else:
            scale = "large"
        
        if cost_per_capita < 100:
            burden = "low"
        elif cost_per_capita < 500:
            burden = "moderate"
        else:
            burden = "high"
        
        return f"This is a {scale} scale project with a {burden} financial burden per capita."
    
    def run_simulation(self, zoning_plan: Dict, infra_edits: List[Dict], 
                       traffic_inputs: Dict, population: float = 10000) -> CostMetrics:
        """
        Run the cost estimation simulation model.
        
        Args:
            zoning_plan: Zoning plan information
            infra_edits: Infrastructure edits
            traffic_inputs: Traffic-related inputs (for population estimation)
            population: Estimated population (default: 10000)
            
        Returns:
            CostMetrics object with simulation results
        """
        # Calculate infrastructure costs
        infrastructure_costs = self._calculate_infrastructure_cost(zoning_plan, infra_edits)
        
        # Calculate total infrastructure cost
        total_infrastructure_cost = sum(infrastructure_costs.values())
        
        # Calculate operational costs
        annual_operational_cost = self._calculate_operational_cost(population)
        
        # Calculate maintenance costs
        annual_maintenance_cost = self._calculate_maintenance_cost(total_infrastructure_cost)
        
        # Calculate total annual operational cost
        total_annual_operational = annual_operational_cost + annual_maintenance_cost
        
        # Calculate cost per capita
        cost_per_capita = total_infrastructure_cost / max(population, 1)
        
        # Generate budget recommendations
        recommendations = self._generate_budget_recommendations(
            total_infrastructure_cost, total_annual_operational)
        
        # Generate financial impact summary
        financial_summary = self._generate_financial_impact_summary(
            total_infrastructure_cost, cost_per_capita)
        
        return CostMetrics(
            total_cost=total_infrastructure_cost,
            annual_operational=total_annual_operational,
            cost_per_capita=cost_per_capita,
            breakdown=infrastructure_costs,
            budget_recommendations=recommendations,
            financial_impact_summary=financial_summary
        )

# Example usage
if __name__ == "__main__":
    # Example of how to use the cost estimation model
    model = CostEstimationModel()
    
    # Sample input data
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
    
    infra_edits = [
        {
            "type": "road",
            "action": "add",
            "specifications": {
                "length_km": 2.5
            }
        }
    ]
    
    traffic_inputs = {
        "population_density": 1000.0,
        "peak_hours": ["08:00", "17:00"],
        "vehicle_ownership": 0.8
    }
    
    # Run simulation
    results = model.run_simulation(zoning_plan, infra_edits, traffic_inputs, population=5000)
    
    print(f"Total Cost: ${results.total_cost:,.2f}")
    print(f"Annual Operational Cost: ${results.annual_operational:,.2f}")
    print(f"Cost Per Capita: ${results.cost_per_capita:,.2f}")
    print(f"Breakdown: {results.breakdown}")
    print(f"Recommendations: {results.budget_recommendations}")
    print(f"Financial Summary: {results.financial_impact_summary}")