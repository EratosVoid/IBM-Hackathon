#!/usr/bin/env python3
"""
Demo script for running a comprehensive urban planning simulation.

This script demonstrates how to:
1. Load input data from a JSON file
2. Send a request to the Simulation Engine API
3. Process and display the results
"""

import json
import requests
import os
import sys

# Add the src directory to the path so we can import the simulation engine modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

def load_input_data():
    """Load input data from the JSON file."""
    input_file = os.path.join(os.path.dirname(__file__), 'input.json')
    with open(input_file, 'r') as f:
        return json.load(f)

def load_expected_output():
    """Load expected output from the JSON file."""
    expected_file = os.path.join(os.path.dirname(__file__), 'expected_output.json')
    with open(expected_file, 'r') as f:
        return json.load(f)

def run_simulation(input_data, api_url="http://localhost:8000"):
    """
    Run the simulation by sending a request to the API.
    
    Args:
        input_data: The input data for the simulation
        api_url: The base URL of the Simulation Engine API
        
    Returns:
        The response from the API
    """
    # In a real scenario, you would need to provide a valid JWT token
    # For this demo, we'll simulate a successful response
    print("Sending request to Simulation Engine API...")
    print(f"API URL: {api_url}/simulate")
    
    # This is a simulation - in a real scenario, you would use:
    # response = requests.post(f"{api_url}/simulate", 
    #                         headers={"Authorization": "Bearer YOUR_JWT_TOKEN",
    #                                 "Content-Type": "application/json"},
    #                         json=input_data)
    # return response.json()
    
    # For demo purposes, return the expected output
    return load_expected_output()

def display_results(results):
    """
    Display the simulation results in a formatted way.
    
    Args:
        results: The results from the simulation
    """
    print("\n" + "="*50)
    print("SIMULATION RESULTS")
    print("="*50)
    
    print(f"\nSimulation ID: {results['simulation_id']}")
    print(f"Timestamp: {results['timestamp']}")
    
    # Display traffic results
    print("\nTRAFFIC RESULTS:")
    traffic_metrics = results['results']['traffic']['metrics']
    print(f"  Average Travel Time: {traffic_metrics['avg_travel_time']:.1f} minutes")
    print(f"  Congestion Index: {traffic_metrics['congestion_index']:.2f}")
    print(f"  Total Volume: {traffic_metrics['total_volume']:.0f} vehicles")
    
    # Display cost results
    print("\nCOST RESULTS:")
    cost_metrics = results['results']['cost']['metrics']
    print(f"  Total Cost: ${cost_metrics['total_cost']:,.0f}")
    print(f"  Annual Operational Cost: ${cost_metrics['annual_operational']:,.0f}")
    print(f"  Cost Per Capita: ${cost_metrics['cost_per_capita']:,.0f}")
    
    cost_breakdown = results['results']['cost']['breakdown']
    print("  Cost Breakdown:")
    print(f"    Infrastructure: ${cost_breakdown['infrastructure']:,.0f}")
    print(f"    Services: ${cost_breakdown['services']:,.0f}")
    print(f"    Maintenance: ${cost_breakdown['maintenance']:,.0f}")
    
    # Display pollution results
    print("\nPOLLUTION RESULTS:")
    pollution_metrics = results['results']['pollution']['metrics']
    print(f"  Air Quality Index: {pollution_metrics['air_quality_index']:.0f}")
    print(f"  CO2 Emissions: {pollution_metrics['co2_emissions']:,.0f} kg")
    print(f"  Pollution Hotspots: {pollution_metrics['pollution_hotspots']}")
    
    pollution_recommendations = results['results']['pollution']['recommendations']
    print("  Recommendations:")
    for rec in pollution_recommendations:
        print(f"    - {rec}")
    
    # Display summary
    print("\nEXECUTIVE SUMMARY:")
    print(f"  {results['summary']['executive_summary']}")
    
    print("\nKEY FINDINGS:")
    for finding in results['summary']['key_findings']:
        print(f"  - {finding}")
    
    print("\nRECOMMENDATIONS:")
    for rec in results['summary']['recommendations']:
        print(f"  - {rec}")

def main():
    """Main function to run the demo."""
    print("Comprehensive Plan Demo")
    print("="*30)
    
    # Load input data
    print("Loading input data...")
    input_data = load_input_data()
    print("Input data loaded successfully!")
    
    # Run simulation
    results = run_simulation(input_data)
    
    # Display results
    display_results(results)
    
    print("\nDemo completed successfully!")

if __name__ == "__main__":
    main()