import pandas as pd
import numpy as np
from typing import Dict, List, Any, Tuple
from src.models.traffic_model import TrafficSimulationModel
from src.models.cost_model import CostEstimationModel
from src.models.pollution_model import PollutionSimulationModel
from src.performance_optimizer import performance_optimizer

class DataProcessor:
    """
    Data Processor for normalizing input data for simulation models.
    
    This class handles data normalization, validation, and preparation for 
    the different simulation models.
    """
    
    def __init__(self):
        """Initialize the data processor"""
        self.traffic_model = TrafficSimulationModel()
        self.cost_model = CostEstimationModel()
        self.pollution_model = PollutionSimulationModel()
    
    
    def normalize_zoning_data(self, zoning_plan: Dict) -> pd.DataFrame:
        """
        Normalize zoning plan data into a standardized format.
        
        Args:
            zoning_plan: Raw zoning plan data
            
        Returns:
            Normalized pandas DataFrame
        """
        zones_data = []
        
        for zone in zoning_plan.get("zones", []):
            zones_data.append({
                "zone_id": zone.get("id", ""),
                "zone_type": zone.get("type", ""),
                "area": zone.get("area", 0.0),
                "location_x": zone.get("location", {}).get("x", 0.0),
                "location_y": zone.get("location", {}).get("y", 0.0),
                "properties": zone.get("properties", {})
            })
        
        return pd.DataFrame(zones_data)
    
    def normalize_infra_edits(self, infra_edits: List[Dict]) -> pd.DataFrame:
        """
        Normalize infrastructure edits data into a standardized format.
        
        Args:
            infra_edits: Raw infrastructure edits data
            
        Returns:
            Normalized pandas DataFrame
        """
        edits_data = []
        
        for edit in infra_edits:
            edits_data.append({
                "type": edit.get("type", ""),
                "action": edit.get("action", ""),
                "specifications": edit.get("specifications", {})
            })
        
        return pd.DataFrame(edits_data)
    
    def normalize_traffic_inputs(self, traffic_inputs: Dict) -> Dict:
        """
        Normalize traffic inputs data into a standardized format.
        
        Args:
            traffic_inputs: Raw traffic inputs data
            
        Returns:
            Normalized traffic inputs dictionary
        """
        normalized = {
            "population_density": traffic_inputs.get("population_density", 0.0),
            "peak_hours": traffic_inputs.get("peak_hours", []),
            "vehicle_ownership": traffic_inputs.get("vehicle_ownership", 0.0)
        }
        
        return normalized
    
    def estimate_population(self, zoning_plan: Dict, 
                          population_density: float) -> float:
        """
        Estimate population based on zoning plan and density.
        
        Args:
            zoning_plan: Zoning plan data
            population_density: Population density per unit area
            
        Returns:
            Estimated population
        """
        total_area = 0.0
        
        # Calculate total residential and commercial area
        for zone in zoning_plan.get("zones", []):
            if zone.get("type") in ["residential", "commercial"]:
                total_area += zone.get("area", 0.0)
        
        return total_area * population_density
    
    def process_input_data(self, input_data: Dict) -> Dict:
        """
        Process and normalize all input data for simulation models.
        
        Args:
            input_data: Raw input data from the API
            
        Returns:
            Dictionary with processed data for each model
        """
        # Extract components
        zoning_plan = input_data.get("zoning_plan", {})
        infra_edits = input_data.get("infra_edits", [])
        traffic_inputs = input_data.get("traffic_inputs", {})
        simulation_options = input_data.get("simulation_options", {})
        
        # Normalize data
        normalized_zoning = self.normalize_zoning_data(zoning_plan)
        normalized_edits = self.normalize_infra_edits(infra_edits)
        normalized_traffic = self.normalize_traffic_inputs(traffic_inputs)
        
        # Estimate population
        population = self.estimate_population(zoning_plan, 
                                             traffic_inputs.get("population_density", 0.0))
        
        # Prepare data for each model
        processed_data = {
            "zoning_plan": zoning_plan,
            "infra_edits": infra_edits,
            "traffic_inputs": normalized_traffic,
            "population": population,
            "models_to_run": simulation_options.get("models", [])
        }
        
        return processed_data
    
    def run_selected_simulations(self, processed_data: Dict) -> Dict:
        """
        Run the selected simulations based on processed data.
        
        Args:
            processed_data: Processed data from process_input_data
            
        Returns:
            Dictionary with results from each simulation model
        """
        results = {}
        
        zoning_plan = processed_data["zoning_plan"]
        infra_edits = processed_data["infra_edits"]
        traffic_inputs = processed_data["traffic_inputs"]
        population = processed_data["population"]
        models_to_run = processed_data["models_to_run"]
        
        # Run traffic simulation if selected
        if "traffic" in models_to_run:
            try:
                traffic_results = self.traffic_model.run_simulation(
                    zoning_plan, infra_edits, traffic_inputs)
                results["traffic"] = {
                    "metrics": {
                        "avg_travel_time": traffic_results.avg_travel_time,
                        "congestion_index": traffic_results.congestion_index,
                        "total_volume": traffic_results.total_volume
                    },
                    "spatial_overlay": traffic_results.flow_map
                }
            except Exception as e:
                results["traffic"] = {
                    "error": f"Traffic simulation failed: {str(e)}"
                }
        
        # Run cost simulation if selected
        if "cost" in models_to_run:
            try:
                cost_results = self.cost_model.run_simulation(
                    zoning_plan, infra_edits, traffic_inputs, population)
                results["cost"] = {
                    "metrics": {
                        "total_cost": cost_results.total_cost,
                        "annual_operational": cost_results.annual_operational,
                        "cost_per_capita": cost_results.cost_per_capita
                    },
                    "breakdown": cost_results.breakdown
                }
            except Exception as e:
                results["cost"] = {
                    "error": f"Cost simulation failed: {str(e)}"
                }
        
        # Run pollution simulation if selected
        if "pollution" in models_to_run:
            try:
                pollution_results = self.pollution_model.run_simulation(
                    zoning_plan, infra_edits, traffic_inputs)
                results["pollution"] = {
                    "metrics": {
                        "air_quality_index": pollution_results.air_quality_index,
                        "co2_emissions": pollution_results.co2_emissions,
                        "pollution_hotspots": pollution_results.pollution_hotspots
                    },
                    "recommendations": pollution_results.recommendations
                }
            except Exception as e:
                results["pollution"] = {
                    "error": f"Pollution simulation failed: {str(e)}"
                }
        
        return results

# Example usage
if __name__ == "__main__":
    # Example of how to use the data processor
    processor = DataProcessor()
    
    # Sample input data
    sample_input = {
        "zoning_plan": {
            "zones": [
                {
                    "id": "zone1",
                    "type": "residential",
                    "area": 1000.0,
                    "location": {"x": 0.0, "y": 0.0},
                    "properties": {}
                }
            ]
        },
        "infra_edits": [
            {
                "type": "road",
                "action": "add",
                "specifications": {
                    "length_km": 2.5
                }
            }
        ],
        "traffic_inputs": {
            "population_density": 1000.0,
            "peak_hours": ["08:00", "17:00"],
            "vehicle_ownership": 0.8
        },
        "simulation_options": {
            "models": ["traffic", "cost", "pollution"],
            "time_horizon": "5 years",
            "scenarios": ["optimistic"]
        }
    }
    
    # Process input data
    processed_data = processor.process_input_data(sample_input)
    print("Data processed successfully")
    
    # Run simulations
    results = processor.run_selected_simulations(processed_data)
    print("Simulations completed")
    print(f"Results: {list(results.keys())}")