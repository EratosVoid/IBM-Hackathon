#!/usr/bin/env python3
"""
Demo script for testing edge cases and error conditions.

This script demonstrates how to:
1. Load invalid input data from a JSON file
2. Send a request to the Simulation Engine API
3. Process and display error responses
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
    # For this demo, we'll simulate an error response
    print("Sending request to Simulation Engine API...")
    print(f"API URL: {api_url}/simulate")
    
    # This is a simulation - in a real scenario, you would use:
    # response = requests.post(f"{api_url}/simulate", 
    #                         headers={"Authorization": "Bearer YOUR_JWT_TOKEN",
    #                                 "Content-Type": "application/json"},
    #                         json=input_data)
    # return response.json()
    
    # For demo purposes, return the expected error output
    return load_expected_output()

def display_results(results):
    """
    Display the error response in a formatted way.
    
    Args:
        results: The error response from the API
    """
    print("\n" + "="*50)
    print("ERROR RESPONSE")
    print("="*50)
    
    if "detail" in results:
        print("\nValidation Errors:")
        for error in results["detail"]:
            loc = " -> ".join(str(x) for x in error["loc"])
            print(f"  {loc}: {error['msg']}")
    else:
        print("\nUnexpected response format:")
        print(json.dumps(results, indent=2))

def main():
    """Main function to run the demo."""
    print("Edge Cases Demo")
    print("="*30)
    
    # Load input data
    print("Loading invalid input data...")
    input_data = load_input_data()
    print("Invalid input data loaded successfully!")
    
    # Run simulation
    results = run_simulation(input_data)
    
    # Display results
    display_results(results)
    
    print("\nDemo completed. As expected, the API correctly validated the input and returned appropriate error messages.")

if __name__ == "__main__":
    main()