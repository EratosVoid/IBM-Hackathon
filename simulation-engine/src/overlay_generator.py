import base64
import io
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
from typing import Dict, Any
import folium
from folium import plugins
from src.performance_optimizer import performance_optimizer

class OverlayGenerator:
    """
    Overlay Generator for creating spatial overlays for visualization.
    
    This class generates visual overlays for traffic, cost, and pollution data
    that can be used for map visualization.
    """
    
    def __init__(self):
        """Initialize the overlay generator"""
        pass
    
    def generate_traffic_overlay(self, traffic_results: Dict[str, Any]) -> str:
        """
        Generate a traffic flow overlay as a base64 encoded image.
        
        Args:
            traffic_results: Results from traffic simulation model
            
        Returns:
            Base64 encoded image string
        """
        # Create a simple traffic flow visualization
        fig, ax = plt.subplots(figsize=(8, 6))
        
        # Extract congestion data (simplified)
        congestion_index = traffic_results["metrics"]["congestion_index"]
        
        # Create a color-coded representation
        if congestion_index < 0.5:
            color = 'green'  # Low congestion
        elif congestion_index < 1.0:
            color = 'yellow'  # Moderate congestion
        elif congestion_index < 1.5:
            color = 'orange'  # High congestion
        else:
            color = 'red'  # Severe congestion
        
        # Draw a simple representation
        ax.add_patch(patches.Rectangle((0, 0), 10, 10, facecolor=color, alpha=0.7))
        ax.text(5, 5, f'Congestion\nIndex: {congestion_index:.2f}', 
                ha='center', va='center', fontsize=12, weight='bold')
        
        ax.set_xlim(0, 10)
        ax.set_ylim(0, 10)
        ax.set_title('Traffic Congestion Map')
        ax.set_xlabel('X Coordinate')
        ax.set_ylabel('Y Coordinate')
        
        # Convert to base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', bbox_inches='tight')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        plt.close(fig)
        
        return image_base64
    
    def generate_cost_overlay(self, cost_results: Dict[str, Any]) -> str:
        """
        Generate a cost heatmap overlay as a base64 encoded image.
        
        Args:
            cost_results: Results from cost estimation model
            
        Returns:
            Base64 encoded image string
        """
        # Create a simple cost heatmap visualization
        fig, ax = plt.subplots(figsize=(8, 6))
        
        # Extract cost data (simplified)
        total_cost = cost_results["metrics"]["total_cost"]
        cost_per_capita = cost_results["metrics"]["cost_per_capita"]
        
        # Create a heatmap-like representation
        # In a real implementation, this would be based on spatial data
        data = np.random.rand(10, 10) * (total_cost / 1000000)  # Simplified
        
        im = ax.imshow(data, cmap='YlOrRd', interpolation='nearest')
        ax.set_title('Infrastructure Cost Heatmap')
        ax.set_xlabel('X Coordinate')
        ax.set_ylabel('Y Coordinate')
        
        # Add colorbar
        cbar = plt.colorbar(im, ax=ax)
        cbar.set_label('Cost (Millions $)')
        
        # Add text annotation
        ax.text(5, 5, f'Total Cost: ${total_cost/1000000:.1f}M', 
                ha='center', va='center', fontsize=10, 
                bbox=dict(boxstyle="round,pad=0.3", facecolor="white", alpha=0.7))
        
        # Convert to base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', bbox_inches='tight')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        plt.close(fig)
        
        return image_base64
    
    def generate_pollution_overlay(self, pollution_results: Dict[str, Any]) -> str:
        """
        Generate a pollution map overlay as a base64 encoded image.
        
        Args:
            pollution_results: Results from pollution simulation model
            
        Returns:
            Base64 encoded image string
        """
        # Create a simple pollution map visualization
        fig, ax = plt.subplots(figsize=(8, 6))
        
        # Extract pollution data
        aqi = pollution_results["metrics"]["air_quality_index"]
        co2_emissions = pollution_results["metrics"]["co2_emissions"]
        hotspots = pollution_results["metrics"]["pollution_hotspots"]
        
        # Create a color-coded representation
        if aqi > 80:
            color = 'green'  # Excellent air quality
        elif aqi > 60:
            color = 'yellow'  # Good air quality
        elif aqi > 40:
            color = 'orange'  # Moderate air quality
        else:
            color = 'red'  # Poor air quality
        
        # Draw background
        ax.add_patch(patches.Rectangle((0, 0), 10, 10, facecolor=color, alpha=0.5))
        
        # Add hotspots
        np.random.seed(42)  # For reproducible results
        for i in range(hotspots):
            x = np.random.uniform(1, 9)
            y = np.random.uniform(1, 9)
            ax.add_patch(patches.Circle((x, y), 0.3, facecolor='red', alpha=0.8))
        
        ax.set_xlim(0, 10)
        ax.set_ylim(0, 10)
        ax.set_title('Air Quality and Pollution Hotspots Map')
        ax.set_xlabel('X Coordinate')
        ax.set_ylabel('Y Coordinate')
        
        # Add text annotations
        ax.text(5, 9, f'AQI: {aqi:.0f}', ha='center', va='center', 
                fontsize=12, weight='bold',
                bbox=dict(boxstyle="round,pad=0.3", facecolor="white", alpha=0.7))
        ax.text(5, 8, f'CO2: {co2_emissions/1000:.0f} tons', ha='center', va='center', 
                fontsize=10,
                bbox=dict(boxstyle="round,pad=0.3", facecolor="white", alpha=0.7))
        ax.text(5, 7, f'Hotspots: {hotspots}', ha='center', va='center', 
                fontsize=10,
                bbox=dict(boxstyle="round,pad=0.3", facecolor="white", alpha=0.7))
        
        # Convert to base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', bbox_inches='tight')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        plt.close(fig)
        
        return image_base64
    
    def generate_combined_overlay(self, results: Dict[str, Any]) -> str:
        """
        Generate a combined overlay showing all simulation results.
        
        Args:
            results: Aggregated results from all models
            
        Returns:
            Base64 encoded image string
        """
        # Create a combined visualization
        fig, axs = plt.subplots(2, 2, figsize=(12, 10))
        fig.suptitle('Urban Planning Simulation Results', fontsize=16)
        
        # Traffic overlay
        if "traffic" in results and "metrics" in results["traffic"]:
            congestion_index = results["traffic"]["metrics"].get("congestion_index", 0.0)
            if congestion_index < 0.5:
                traffic_color = 'green'
            elif congestion_index < 1.0:
                traffic_color = 'yellow'
            elif congestion_index < 1.5:
                traffic_color = 'orange'
            else:
                traffic_color = 'red'
                
            axs[0, 0].add_patch(patches.Rectangle((0, 0), 10, 10, facecolor=traffic_color, alpha=0.7))
            axs[0, 0].text(5, 5, f'Congestion\nIndex: {congestion_index:.2f}',
                          ha='center', va='center', fontsize=10, weight='bold')
            axs[0, 0].set_title('Traffic Flow')
            axs[0, 0].set_xlim(0, 10)
            axs[0, 0].set_ylim(0, 10)
        else:
            axs[0, 0].text(0.5, 0.5, 'No Traffic Data', ha='center', va='center',
                          fontsize=12, transform=axs[0, 0].transAxes)
            axs[0, 0].set_title('Traffic Flow')
            axs[0, 0].axis('off')
        
        # Cost overlay
        if "cost" in results and "metrics" in results["cost"]:
            total_cost = results["cost"]["metrics"].get("total_cost", 0.0)
            cost_data = np.random.rand(10, 10) * (total_cost / 1000000)
            im = axs[0, 1].imshow(cost_data, cmap='YlOrRd', interpolation='nearest')
            axs[0, 1].set_title('Cost Heatmap')
            axs[0, 1].set_xlabel('Cost (Millions $)')
        else:
            axs[0, 1].text(0.5, 0.5, 'No Cost Data', ha='center', va='center',
                          fontsize=12, transform=axs[0, 1].transAxes)
            axs[0, 1].set_title('Cost Heatmap')
            axs[0, 1].axis('off')
        
        # Pollution overlay
        if "pollution" in results and "metrics" in results["pollution"]:
            aqi = results["pollution"]["metrics"].get("air_quality_index", 50.0)
            hotspots = results["pollution"]["metrics"].get("pollution_hotspots", 0)
            
            if aqi > 80:
                pollution_color = 'green'
            elif aqi > 60:
                pollution_color = 'yellow'
            elif aqi > 40:
                pollution_color = 'orange'
            else:
                pollution_color = 'red'
                
            axs[1, 0].add_patch(patches.Rectangle((0, 0), 10, 10, facecolor=pollution_color, alpha=0.5))
            
            # Add hotspots
            np.random.seed(42)
            for i in range(hotspots):
                x = np.random.uniform(1, 9)
                y = np.random.uniform(1, 9)
                axs[1, 0].add_patch(patches.Circle((x, y), 0.3, facecolor='red', alpha=0.8))
                
            axs[1, 0].text(5, 5, f'AQI: {aqi:.0f}\nHotspots: {hotspots}',
                          ha='center', va='center', fontsize=10)
            axs[1, 0].set_title('Pollution Map')
            axs[1, 0].set_xlim(0, 10)
            axs[1, 0].set_ylim(0, 10)
        else:
            axs[1, 0].text(0.5, 0.5, 'No Pollution Data', ha='center', va='center',
                          fontsize=12, transform=axs[1, 0].transAxes)
            axs[1, 0].set_title('Pollution Map')
            axs[1, 0].axis('off')
        
        # Summary
        summary_parts = []
        if "traffic" in results and "metrics" in results["traffic"]:
            congestion_index = results["traffic"]["metrics"].get("congestion_index", 0.0)
            summary_parts.append(f"Traffic: {congestion_index:.2f}")
        if "cost" in results and "metrics" in results["cost"]:
            total_cost = results["cost"]["metrics"].get("total_cost", 0.0)
            summary_parts.append(f"Cost: ${total_cost/1000000:.1f}M")
        if "pollution" in results and "metrics" in results["pollution"]:
            aqi = results["pollution"]["metrics"].get("air_quality_index", 50.0)
            summary_parts.append(f"AQI: {aqi:.0f}")
        
        summary_text = "\n".join(summary_parts) if summary_parts else "No Data Available"
        axs[1, 1].text(0.5, 0.5, summary_text, ha='center', va='center',
                      fontsize=12, transform=axs[1, 1].transAxes,
                      bbox=dict(boxstyle="round,pad=0.5", facecolor="lightblue"))
        axs[1, 1].set_title('Summary')
        axs[1, 1].axis('off')
        
        # Adjust layout
        plt.tight_layout()
        
        # Convert to base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', bbox_inches='tight')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        plt.close(fig)
        
        return image_base64

# Example usage
if __name__ == "__main__":
    # Example of how to use the overlay generator
    generator = OverlayGenerator()
    
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
    
    # Generate overlays
    traffic_overlay = generator.generate_traffic_overlay(sample_results["traffic"])
    cost_overlay = generator.generate_cost_overlay(sample_results["cost"])
    pollution_overlay = generator.generate_pollution_overlay(sample_results["pollution"])
    combined_overlay = generator.generate_combined_overlay(sample_results)
    
    print("Overlays generated successfully")
    print(f"Traffic overlay length: {len(traffic_overlay)}")
    print(f"Cost overlay length: {len(cost_overlay)}")
    print(f"Pollution overlay length: {len(pollution_overlay)}")
    print(f"Combined overlay length: {len(combined_overlay)}")
