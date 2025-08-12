from typing import Dict, List, Any
from src.performance_optimizer import performance_optimizer

class SummaryGenerator:
    """
    Summary Generator for creating interpretable summaries of simulation results.
    
    This class generates natural language explanations of simulation results
    for city planners, stakeholders, and public officials.
    """
    
    def __init__(self):
        """Initialize the summary generator"""
        pass
    
    def generate_executive_summary(self, results: Dict[str, Any]) -> str:
        """
        Generate an executive summary of the simulation results.
        
        Args:
            results: Aggregated results from available models
            
        Returns:
            Executive summary string
        """
        # Extract key metrics with default values
        traffic_congestion = 0.0
        cost_total = 0.0
        pollution_aqi = 50.0
        
        # Get available metrics
        if "traffic" in results and "metrics" in results["traffic"]:
            traffic_congestion = results["traffic"]["metrics"].get("congestion_index", 0.0)
        
        if "cost" in results and "metrics" in results["cost"]:
            cost_total = results["cost"]["metrics"].get("total_cost", 0.0)
        
        if "pollution" in results and "metrics" in results["pollution"]:
            pollution_aqi = results["pollution"]["metrics"].get("air_quality_index", 50.0)
        
        # Determine traffic condition
        if traffic_congestion < 0.5:
            traffic_desc = "excellent traffic flow"
        elif traffic_congestion < 1.0:
            traffic_desc = "good traffic flow"
        elif traffic_congestion < 1.5:
            traffic_desc = "moderate traffic congestion"
        else:
            traffic_desc = "severe traffic congestion"
        
        # Determine cost level
        if cost_total < 1000000:
            cost_desc = "relatively low"
        elif cost_total < 5000000:
            cost_desc = "moderate"
        else:
            cost_desc = "high"
        
        # Determine air quality
        if pollution_aqi > 80:
            air_quality_desc = "excellent"
        elif pollution_aqi > 60:
            air_quality_desc = "good"
        elif pollution_aqi > 40:
            air_quality_desc = "moderate"
        else:
            air_quality_desc = "poor"
        
        summary = (
            f"This urban planning simulation indicates {traffic_desc} with "
            f"{air_quality_desc} air quality. The total project cost is {cost_desc}, "
            f"amounting to ${cost_total:,.0f}. "
        )
        
        # Add contextual information only if all relevant data is available
        if "traffic" in results and "pollution" in results:
            if traffic_congestion > 1.0 and pollution_aqi < 50:
                summary += "The high traffic congestion combined with poor air quality suggests a need for mitigation measures. "
            elif traffic_congestion < 0.5 and pollution_aqi > 70:
                summary += "The efficient traffic flow with good air quality creates positive conditions for urban development. "
        
        return summary.strip()
    
    def generate_key_findings(self, results: Dict[str, Any]) -> List[str]:
        """
        Generate key findings from the simulation results.
        
        Args:
            results: Aggregated results from available models
            
        Returns:
            List of key findings
        """
        findings = []
        
        # Traffic findings
        if "traffic" in results and "metrics" in results["traffic"]:
            traffic_congestion = results["traffic"]["metrics"].get("congestion_index", 0.0)
            avg_travel_time = results["traffic"]["metrics"].get("avg_travel_time", 0.0)
            
            if traffic_congestion < 0.5:
                findings.append(f"Traffic flow is efficient with an average travel time of {avg_travel_time:.1f} minutes.")
            elif traffic_congestion > 1.5:
                findings.append(f"Significant traffic congestion identified with average travel time of {avg_travel_time:.1f} minutes.")
            else:
                findings.append(f"Moderate traffic conditions with average travel time of {avg_travel_time:.1f} minutes.")
        
        # Cost findings
        if "cost" in results and "metrics" in results["cost"]:
            cost_total = results["cost"]["metrics"].get("total_cost", 0.0)
            cost_per_capita = results["cost"]["metrics"].get("cost_per_capita", 0.0)
            
            findings.append(f"Total project cost estimated at ${cost_total:,.0f} (${cost_per_capita:,.0f} per capita).")
        
        # Pollution findings
        if "pollution" in results and "metrics" in results["pollution"]:
            air_quality_index = results["pollution"]["metrics"].get("air_quality_index", 50.0)
            co2_emissions = results["pollution"]["metrics"].get("co2_emissions", 0.0)
            
            if air_quality_index > 70:
                findings.append(f"Air quality is good with an Air Quality Index of {air_quality_index:.0f}.")
            elif air_quality_index > 50:
                findings.append(f"Air quality is moderate with an Air Quality Index of {air_quality_index:.0f}.")
            else:
                findings.append(f"Air quality concerns with an Air Quality Index of {air_quality_index:.0f}.")
            
            findings.append(f"Annual CO2 emissions estimated at {co2_emissions:,.0f} kg.")
            
            # Hotspots
            pollution_hotspots = results["pollution"]["metrics"].get("pollution_hotspots", 0)
            if pollution_hotspots > 0:
                findings.append(f"{pollution_hotspots} pollution hotspots identified requiring targeted mitigation.")
        
        return findings
    
    def generate_recommendations(self, results: Dict[str, Any]) -> List[str]:
        """
        Generate recommendations based on the simulation results.
        
        Args:
            results: Aggregated results from available models
            
        Returns:
            List of recommendations
        """
        recommendations = []
        
        # Traffic recommendations
        if "traffic" in results and "metrics" in results["traffic"]:
            traffic_congestion = results["traffic"]["metrics"].get("congestion_index", 0.0)
            
            if traffic_congestion > 1.5:
                recommendations.append("Implement traffic management measures to reduce congestion.")
                recommendations.append("Consider public transportation improvements to reduce vehicle dependency.")
            elif traffic_congestion > 1.0:
                recommendations.append("Monitor traffic patterns and consider minor infrastructure improvements.")
        
        # Cost recommendations
        if "cost" in results and "metrics" in results["cost"]:
            cost_total = results["cost"]["metrics"].get("total_cost", 0.0)
            
            if cost_total > 10000000:  # 10 million
                recommendations.append("Consider phasing the project to manage costs.")
                recommendations.append("Explore public-private partnerships to share costs.")
        
        # Pollution recommendations
        if "pollution" in results and "metrics" in results["pollution"]:
            air_quality_index = results["pollution"]["metrics"].get("air_quality_index", 50.0)
            pollution_hotspots = results["pollution"]["metrics"].get("pollution_hotspots", 0)
            
            if air_quality_index < 50:
                recommendations.append("Implement stricter emission controls for industrial zones.")
                recommendations.append("Increase green space coverage to improve air quality.")
            
            if air_quality_index < 70:
                recommendations.append("Promote public transportation to reduce vehicle emissions.")
                recommendations.append("Encourage electric vehicle adoption.")
            
            if pollution_hotspots > 2:
                recommendations.append("Focus pollution monitoring efforts on identified hotspots.")
                recommendations.append("Implement targeted emission reduction programs.")
        
        # General recommendations
        recommendations.append("Regular monitoring and reporting of key metrics.")
        recommendations.append("Community engagement on planning decisions and impacts.")
        
        # Add model-specific recommendations
        if "cost" in results and "recommendations" in results["cost"]:
            recommendations.extend(results["cost"]["recommendations"])
        
        if "pollution" in results and "recommendations" in results["pollution"]:
            recommendations.extend(results["pollution"]["recommendations"])
        
        # Remove duplicates while preserving order
        seen = set()
        unique_recommendations = []
        for rec in recommendations:
            if rec not in seen:
                seen.add(rec)
                unique_recommendations.append(rec)
        
        return unique_recommendations
    
    def generate_comprehensive_summary(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a comprehensive summary including executive summary, key findings, and recommendations.
        
        Args:
            results: Aggregated results from all models
            
        Returns:
            Dictionary with comprehensive summary
        """
        executive_summary = self.generate_executive_summary(results)
        key_findings = self.generate_key_findings(results)
        recommendations = self.generate_recommendations(results)
        
        return {
            "executive_summary": executive_summary,
            "key_findings": key_findings,
            "recommendations": recommendations
        }

# Example usage
if __name__ == "__main__":
    # Example of how to use the summary generator
    generator = SummaryGenerator()
    
    # Sample results (in practice, these would come from the simulation models)
    sample_results = {
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
    
    # Generate comprehensive summary
    summary = generator.generate_comprehensive_summary(sample_results)
    
    print("Executive Summary:")
    print(summary["executive_summary"])
    print("\nKey Findings:")
    for finding in summary["key_findings"]:
        print(f"- {finding}")
    print("\nRecommendations:")
    for rec in summary["recommendations"]:
        print(f"- {rec}")