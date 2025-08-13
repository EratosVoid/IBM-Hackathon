"""
Simplified demo runner for Agentic City Planner
This script starts the core Python services for demonstration.
"""

import os
import sys
import subprocess
import time
import threading

def start_service(command, cwd, name):
    """Start a service"""
    print(f"Starting {name}...")
    try:
        process = subprocess.Popen(
            command,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        print(f"OK {name} started successfully")
        return process
    except Exception as e:
        print(f"ERROR Failed to start {name}: {e}")
        return None

def main():
    """Main function to start core services"""
    print("Starting Agentic City Planner Demo (Python services only)...")
    print("=" * 60)
    
    # List to keep track of all processes
    processes = []
    
    try:
        # Start the Planner Agent
        planner_process = start_service(
            ['uvicorn', 'src.api:app', '--host', '127.0.0.1', '--port', '8000'],
            './planner-agent',
            'Planner Agent'
        )
        if planner_process:
            processes.append(planner_process)
            
        # Start the Simulation Engine
        simulation_process = start_service(
            ['uvicorn', 'src.main:app', '--host', '127.0.0.1', '--port', '8001'],
            './simulation-engine',
            'Simulation Engine'
        )
        if simulation_process:
            processes.append(simulation_process)
            
        # Start the Document Processor
        document_process = start_service(
            ['uvicorn', 'src.main:app', '--host', '127.0.0.1', '--port', '8002'],
            './document-processor',
            'Document Processor'
        )
        if document_process:
            processes.append(document_process)
            
        # Start the API Gateway
        gateway_process = start_service(
            ['python', 'api_gateway.py'],
            '.',
            'API Gateway'
        )
        if gateway_process:
            processes.append(gateway_process)
        
        # Wait a moment for services to start
        print("\nWaiting for services to initialize...")
        time.sleep(10)
        
        print("\nCore services are now running!")
        print("\nYou can now access the application:")
        print("   Frontend: http://localhost:8080")
        print("   Planner Agent: http://localhost:8000")
        print("   Simulation Engine: http://localhost:8001")
        print("   Document Processor: http://localhost:8002")
        print("\nNote: Auth service is not running (Node.js not available)")
        print("   Some features may be limited without authentication.")
        print("\nTo fully use the system, please install Node.js and run:")
        print("   cd auth && node server.js")
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