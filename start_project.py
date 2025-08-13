"""
Startup script for Agentic City Planner
This script starts all services in the correct order.
"""

import os
import sys
import subprocess
import time
import requests
import threading

def check_service_health(url, service_name):
    """Check if a service is healthy"""
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            print(f"OK {service_name} is healthy")
            return True
        else:
            print(f"ERROR {service_name} returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"ERROR {service_name} is not responding: {e}")
        return False

def start_auth_service():
    """Start the authentication service"""
    print("Starting Auth Service...")
    try:
        # Start the Node.js auth service
        auth_process = subprocess.Popen(
            ['node', 'server.js'],
            cwd='./auth',
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        print("OK Auth Service started")
        return auth_process
    except Exception as e:
        print(f"ERROR Failed to start Auth Service: {e}")
        return None

def start_planner_agent():
    """Start the planner agent service"""
    print("Starting Planner Agent...")
    try:
        # Start the Python planner agent
        planner_process = subprocess.Popen(
            ['uvicorn', 'src.api:app', '--host', '0.0.0.0', '--port', '8000'],
            cwd='./planner-agent',
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        print("OK Planner Agent started")
        return planner_process
    except Exception as e:
        print(f"ERROR Failed to start Planner Agent: {e}")
        return None

def start_simulation_engine():
    """Start the simulation engine service"""
    print("Starting Simulation Engine...")
    try:
        # Start the Python simulation engine
        simulation_process = subprocess.Popen(
            ['uvicorn', 'src.main:app', '--host', '0.0.0.0', '--port', '8001'],
            cwd='./simulation-engine',
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        print("OK Simulation Engine started")
        return simulation_process
    except Exception as e:
        print(f"ERROR Failed to start Simulation Engine: {e}")
        return None

def start_document_processor():
    """Start the document processor service"""
    print("Starting Document Processor...")
    try:
        # Start the Python document processor
        document_process = subprocess.Popen(
            ['uvicorn', 'src.main:app', '--host', '0.0.0.0', '--port', '8002'],
            cwd='./document-processor',
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        print("OK Document Processor started")
        return document_process
    except Exception as e:
        print(f"ERROR Failed to start Document Processor: {e}")
        return None

def start_api_gateway():
    """Start the API gateway"""
    print("Starting API Gateway...")
    try:
        # Start the API gateway
        gateway_process = subprocess.Popen(
            ['python', 'api_gateway.py'],
            cwd='.',
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        print("OK API Gateway started")
        return gateway_process
    except Exception as e:
        print(f"ERROR Failed to start API Gateway: {e}")
        return None

def health_check_services():
    """Perform health checks on all services"""
    print("\nPerforming health checks...")
    
    # Give services time to start
    time.sleep(10)
    
    services = [
        ("http://localhost:5000/api/health", "Auth Service"),
        ("http://localhost:8000/health", "Planner Agent"),
        ("http://localhost:8001/health", "Simulation Engine"),
        ("http://localhost:8002/health", "Document Processor"),
        ("http://localhost:8080/health", "API Gateway")
    ]
    
    all_healthy = True
    for url, service_name in services:
        if not check_service_health(url, service_name):
            all_healthy = False
            
    return all_healthy

def main():
    """Main function to start all services"""
    print("Starting Agentic City Planner...")
    print("=" * 50)
    
    # List to keep track of all processes
    processes = []
    
    try:
        # Start services in order
        auth_process = start_auth_service()
        if auth_process:
            processes.append(auth_process)
            
        planner_process = start_planner_agent()
        if planner_process:
            processes.append(planner_process)
            
        simulation_process = start_simulation_engine()
        if simulation_process:
            processes.append(simulation_process)
            
        document_process = start_document_processor()
        if document_process:
            processes.append(document_process)
            
        gateway_process = start_api_gateway()
        if gateway_process:
            processes.append(gateway_process)
        
        # Perform health checks
        if health_check_services():
            print("\nAll services are running!")
            print("\nYou can now access the application:")
            print("   Frontend: http://localhost:8080")
            print("   Auth Service: http://localhost:5000")
            print("   Planner Agent: http://localhost:8000")
            print("   Simulation Engine: http://localhost:8001")
            print("   Document Processor: http://localhost:8002")
            print("\nLogin credentials:")
            print("   Email: dev@hackathon.com")
            print("   Password: cityplanner123")
            print("\nPress Ctrl+C to stop all services")
            
            # Wait for processes to complete or for user interruption
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\nShutting down services...")
                
    except Exception as e:
        print(f"Error starting services: {e}")
    finally:
        # Terminate all processes
        for process in processes:
            try:
                process.terminate()
                process.wait(timeout=5)
                print(f"Process terminated")
            except subprocess.TimeoutExpired:
                process.kill()
                print(f"Process killed")
            except Exception as e:
                print(f"Error terminating process: {e}")

if __name__ == "__main__":
    main()