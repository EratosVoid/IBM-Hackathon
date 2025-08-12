from typing import Dict, List, Any
from src.models.traffic_model import TrafficMetrics
from src.models.cost_model import CostMetrics
from src.models.pollution_model import PollutionMetrics
from src.performance_optimizer import performance_optimizer

class ResultAggregator:
    """
    Result Aggregator for combining results from different simulation models.
    
    This class combines results from traffic, cost, and pollution models into
    a unified view for reporting and visualization.
    """
    
    def __init__(self):
        """Initialize the result aggregator"""
        pass
    
    def aggregate_results(self, traffic_results: TrafficMetrics, 
                         cost_results: CostMetrics, 
                         pollution_results: PollutionMetrics) -> Dict[str, Any]:
        """
        Aggregate results from all simulation models.
        
        Args:
            traffic_results: Results from traffic simulation model
            cost_results: Results from cost estimation model
            pollution_results: Results from pollution simulation model
            
        Returns:
            Dictionary with aggregated results
        """
        aggregated = {
            "traffic": {
                "metrics": {
                    "avg_travel_time": traffic_results.avg_travel_time,
                    "congestion_index": traffic_results.congestion_index,
                    "total_volume": traffic_results.total_volume
                },
                "spatial_overlay": traffic_results.flow_map
            },
            "cost": {
                "metrics": {
                    "total_cost": cost_results.total_cost,
                    "annual_operational": cost_results.annual_operational,
                    "cost_per_capita": cost_results.cost_per_capita
                },
                "breakdown": cost_results.breakdown
            },
            "pollution": {
                "metrics": {
                    "air_quality_index": pollution_results.air_quality_index,
                    "co2_emissions": pollution_results.co2_emissions,
                    "pollution_hotspots": pollution_results.pollution_hotspots
                },
                "recommendations": pollution_results.recommendations
            }
        }
        
        return aggregated
    
    def create_comparative_analysis(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a comparative analysis of the results.
        
        Args:
            results: Aggregated results from all models
            
        Returns:
            Dictionary with comparative analysis
        """
        analysis = {
            "tradeoffs": [],
            "synergies": [],
            "conflicts": [],
            "overall_score": 0.0
        }
        
        # Extract key metrics
        traffic_congestion = results["traffic"]["metrics"]["congestion_index"]
        cost_total = results["cost"]["metrics"]["total_cost"]
        pollution_aqi = results["pollution"]["metrics"]["air_quality_index"]
        
        # Analyze tradeoffs
        if traffic_congestion > 1.0:
            analysis["tradeoffs"].append("High traffic congestion may require infrastructure investment")
        
        if cost_total > 1000000:  # 1 million
            analysis["tradeoffs"].append("High costs may limit project scope")
            
        if pollution_aqi < 50:
            analysis["tradeoffs"].append("Poor air quality requires mitigation measures")
        
        # Analyze synergies
        if traffic_congestion < 0.5 and pollution_aqi > 70:
            analysis["synergies"].append("Good traffic flow with low pollution creates positive synergy")
        
        # Analyze conflicts
        if traffic_congestion > 1.5 and pollution_aqi < 40:
            analysis["conflicts"].append("High traffic congestion conflicts with poor air quality")
        
        # Calculate overall score (simplified)
        traffic_score = max(0, 100 - (traffic_congestion * 20))
        cost_score = max(0, 100 - (cost_total / 10000))  # Normalize cost
        pollution_score = pollution_aqi
        
        analysis["overall_score"] = (traffic_score + cost_score + pollution_score) / 3
        
        return analysis
    
    def generate_update_diffs(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate update diffs for map changes.
        
        Args:
            results: Aggregated results from all models
            
        Returns:
            Dictionary with update diffs for map changes
        """
        # This is a simplified implementation
        # In a real implementation, this would generate actual diffs
        # based on the simulation results
        diffs = {
            "map_updates": [],
            "layer_updates": []
        }
        
        # Add map updates based on results
        if results["traffic"]["metrics"]["congestion_index"] > 1.0:
            diffs["map_updates"].append({
                "type": "add",
                "layer": "traffic",
                "feature": "congestion_zone",
                "properties": {
                    "level": "high"
                }
            })
        
        if results["pollution"]["metrics"]["air_quality_index"] < 50:
            diffs["map_updates"].append({
                "type": "add",
                "layer": "pollution",
                "feature": "poor_air_quality_zone",
                "properties": {
                    "level": "poor"
                }
            })
        
        if results["cost"]["metrics"]["total_cost"] > 1000000:
            diffs["map_updates"].append({
                "type": "add",
                "layer": "cost",
                "feature": "high_cost_zone",
                "properties": {
                    "level": "high"
                }
            })
        
        return diffs

# Example usage
if __name__ == "__main__":
    # Example of how to use the result aggregator
    aggregator = ResultAggregator()
    
    # Sample results (in practice, these would come from the simulation models)
    traffic_results = TrafficMetrics(
        avg_travel_time=15.5,
        congestion_index=0.8,
        total_volume=1000.0,
        flow_map={"type": "FeatureCollection", "features": []},
        congestion_heatmap={"type": "FeatureCollection", "features": []}
    )
    
    cost_results = CostMetrics(
        total_cost=5000000,
        annual_operational=500000,
        cost_per_capita=500,
        breakdown={"zoning": 3000000, "roads": 1000000, "utilities": 1000000, "buildings": 1000000},
        budget_recommendations=["Phase project to manage costs", "Set aside 10% for contingencies"],
        financial_impact_summary="This is a moderate scale project with a moderate financial burden per capita."
    )
    
    pollution_results = PollutionMetrics(
        air_quality_index=75.0,
        co2_emissions=50000,
        pollution_hotspots=2,
        pollution_map={"type": "FeatureCollection", "features": []},
        recommendations=["Promote public transportation to reduce vehicle emissions", "Regular air quality monitoring and reporting"],
        environmental_impact_score="Air quality is good with a moderate carbon footprint."
    )
    
    # Aggregate results
    aggregated = aggregator.aggregate_results(traffic_results, cost_results, pollution_results)
    print("Aggregated results:", aggregated.keys())
    
    # Create comparative analysis
    analysis = aggregator.create_comparative_analysis(aggregated)
    print("Comparative analysis:", analysis)
    
    # Generate update diffs
    diffs = aggregator.generate_update_diffs(aggregated)
    print("Update diffs:", diffs)