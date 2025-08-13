"""
Main Orchestrator for Agentic City Planner
This script integrates all components and manages their interactions.
"""

import os
import sys
import time
import subprocess
import requests
import json
from typing import Dict, Any

# Add paths for all components
sys.path.append(os.path.join(os.path.dirname(__file__), 'planner-agent', 'src'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'simulation-engine', 'src'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'document-processor', 'src'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'parser', 'ingestion'))

class CityPlannerOrchestrator:
    """
    Main orchestrator class that manages all components of the Agentic City Planner
    """
    
    def __init__(self):
        self.services = {}
        self.service_ports = {
            'auth': 5000,
            'planner': 8000,
            'simulation': 8001,
            'document': 8002,
            'parser': 8003
        }
        self.running_processes = []
        
    def start_services(self):
        """
        Start all backend services as separate processes
        """
        print("Starting backend services...")
        
        # Start Auth Service (Node.js)
        auth_process = subprocess.Popen(
            ['node', 'auth/server.js'],
            cwd=os.path.join(os.path.dirname(__file__), 'auth'),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        self.running_processes.append(('auth', auth_process))
        print("Auth service started on port 5000")
        
        # Start Planner Agent (Python/FastAPI)
        planner_process = subprocess.Popen(
            ['uvicorn', 'src.api:app', '--host', '0.0.0.0', '--port', '8000'],
            cwd=os.path.join(os.path.dirname(__file__), 'planner-agent'),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        self.running_processes.append(('planner', planner_process))
        print("Planner Agent started on port 8000")
        
        # Start Simulation Engine (Python/FastAPI)
        simulation_process = subprocess.Popen(
            ['uvicorn', 'src.main:app', '--host', '0.0.0.0', '--port', '8001'],
            cwd=os.path.join(os.path.dirname(__file__), 'simulation-engine'),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        self.running_processes.append(('simulation', simulation_process))
        print("Simulation Engine started on port 8001")
        
        # Start Document Processor (Python/FastAPI)
        document_process = subprocess.Popen(
            ['uvicorn', 'src.main:app', '--host', '0.0.0.0', '--port', '8002'],
            cwd=os.path.join(os.path.dirname(__file__), 'document-processor'),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        self.running_processes.append(('document', document_process))
        print("Document Processor started on port 8002")
        
        # Give services time to start
        time.sleep(10)
        
        # Register services with Planner Agent
        self.register_services()
        
        print("All services started successfully!")
        
    def register_services(self):
        """
        Register all services with the Planner Agent
        """
        print("Registering services with Planner Agent...")
        
        # Register Simulation Engine with Planner Agent
        try:
            response = requests.post(
                'http://localhost:8000/register-tool',
                params={
                    'tool_name': 'simulation_engine',
                    'endpoint_url': 'http://localhost:8001'
                }
            )
            if response.status_code == 200:
                print("Simulation Engine registered successfully")
            else:
                print(f"Failed to register Simulation Engine: {response.text}")
        except Exception as e:
            print(f"Error registering Simulation Engine: {e}")
            
        # Register Document Processor with Planner Agent
        try:
            response = requests.post(
                'http://localhost:8000/register-tool',
                params={
                    'tool_name': 'document_processor',
                    'endpoint_url': 'http://localhost:8002'
                }
            )
            if response.status_code == 200:
                print("Document Processor registered successfully")
            else:
                print(f"Failed to register Document Processor: {response.text}")
        except Exception as e:
            print(f"Error registering Document Processor: {e}")
            
        # Register Parser with Planner Agent
        try:
            response = requests.post(
                'http://localhost:8000/register-tool',
                params={
                    'tool_name': 'parser',
                    'endpoint_url': 'http://localhost:8003'
                }
            )
            if response.status_code == 200:
                print("Parser registered successfully")
            else:
                print(f"Failed to register Parser: {response.text}")
        except Exception as e:
            print(f"Error registering Parser: {e}")
            
    def stop_services(self):
        """
        Stop all running services
        """
        print("Stopping services...")
        for name, process in self.running_processes:
            try:
                process.terminate()
                process.wait(timeout=5)
                print(f"{name} service stopped")
            except subprocess.TimeoutExpired:
                process.kill()
                print(f"{name} service killed")
            except Exception as e:
                print(f"Error stopping {name} service: {e}")
                
    def health_check(self):
        """
        Check health of all services
        """
        print("Performing health check...")
        services_healthy = True
        
        # Check Auth Service
        try:
            response = requests.get('http://localhost:5000/api/health')
            if response.status_code == 200:
                print("Auth Service: Healthy")
            else:
                print("Auth Service: Unhealthy")
                services_healthy = False
        except Exception as e:
            print(f"Auth Service: Unreachable - {e}")
            services_healthy = False
            
        # Check Planner Agent
        try:
            response = requests.get('http://localhost:8000/health')
            if response.status_code == 200:
                print("Planner Agent: Healthy")
            else:
                print("Planner Agent: Unhealthy")
                services_healthy = False
        except Exception as e:
            print(f"Planner Agent: Unreachable - {e}")
            services_healthy = False
            
        # Check Simulation Engine
        try:
            response = requests.get('http://localhost:8001/health')
            if response.status_code == 200:
                print("Simulation Engine: Healthy")
            else:
                print("Simulation Engine: Unhealthy")
                services_healthy = False
        except Exception as e:
            print(f"Simulation Engine: Unreachable - {e}")
            services_healthy = False
            
        # Check Document Processor
        try:
            response = requests.get('http://localhost:8002/health')
            if response.status_code == 200:
                print("Document Processor: Healthy")
            else:
                print("Document Processor: Unhealthy")
                services_healthy = False
        except Exception as e:
            print(f"Document Processor: Unreachable - {e}")
            services_healthy = False
            
        return services_healthy
        
    def run_sample_workflow(self):
        """
        Run a sample workflow to demonstrate the integrated system
        """
        print("Running sample workflow...")
        
        # 1. Authenticate user
        print("1. Authenticating user...")
        try:
            auth_response = requests.post(
                'http://localhost:5000/api/auth/login',
                json={
                    'email': 'dev@hackathon.com',
                    'password': 'cityplanner123'
                }
            )
            
            if auth_response.status_code == 200:
                auth_data = auth_response.json()
                token = auth_data['token']
                print("Authentication successful")
            else:
                print(f"Authentication failed: {auth_response.text}")
                return
        except Exception as e:
            print(f"Authentication error: {e}")
            return
            
        # 2. Initialize city project
        print("2. Initializing city project...")
        try:
            headers = {'Authorization': f'Bearer {token}'}
            init_response = requests.post(
                'http://localhost:5000/api/init-city',
                headers=headers,
                json={
                    'name': 'Sample City Project',
                    'description': 'A sample city planning project',
                    'cityType': 'new',
                    'constraints': {
                        'area': 1000,
                        'budget': 5000000
                    }
                }
            )
            
            if init_response.status_code == 201:
                project_data = init_response.json()
                project_id = project_data['project']['id']
                print(f"City project initialized with ID: {project_id}")
            else:
                print(f"Project initialization failed: {init_response.text}")
                return
        except Exception as e:
            print(f"Project initialization error: {e}")
            return
            
        # 3. Send planning request to Planner Agent
        print("3. Sending planning request to Planner Agent...")
        try:
            prompt_response = requests.post(
                'http://localhost:5000/api/prompt',
                headers=headers,
                json={
                    'message': 'Add a green space to the city center',
                    'projectId': project_id,
                    'context': {}
                }
            )
            
            if prompt_response.status_code == 200:
                prompt_data = prompt_response.json()
                print("Planning request sent successfully")
                print(f"Agent response: {prompt_data['response']['agent_response']}")
            else:
                print(f"Planning request failed: {prompt_response.text}")
        except Exception as e:
            print(f"Planning request error: {e}")
            
        # 4. Run simulation
        print("4. Running simulation...")
        try:
            sim_response = requests.get(
                f'http://localhost:5000/api/simulation/{project_id}',
                headers=headers
            )
            
            if sim_response.status_code == 200:
                sim_data = sim_response.json()
                print("Simulation completed successfully")
                print(f"Simulation metrics: {sim_data['simulation']['metrics']}")
            else:
                print(f"Simulation failed: {sim_response.text}")
        except Exception as e:
            print(f"Simulation error: {e}")
            
        print("Sample workflow completed!")
        
    def run(self):
        """
        Main run method
        """
        try:
            # Start all services
            self.start_services()
            
            # Wait a moment for services to fully initialize
            time.sleep(5)
            
            # Perform health check
            if self.health_check():
                print("All services are healthy!")
                
                # Run sample workflow
                self.run_sample_workflow()
            else:
                print("Some services are unhealthy. Please check the logs.")
                
        except KeyboardInterrupt:
            print("\nShutting down services...")
        except Exception as e:
            print(f"Error running orchestrator: {e}")
        finally:
            # Stop all services
            self.stop_services()

if __name__ == "__main__":
    orchestrator = CityPlannerOrchestrator()
    orchestrator.run()