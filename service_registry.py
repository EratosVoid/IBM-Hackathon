"""
Service Registry for Agentic City Planner
This module provides service registration and discovery functionality.
"""

import json
import logging
import time
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
from shared_models import ServiceRegistration

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class RegisteredService:
    """Represents a registered service"""
    service_name: str
    endpoint_url: str
    status: str
    registered_at: float
    last_heartbeat: float

class ServiceRegistry:
    """Service registry for managing service registration and discovery"""
    
    def __init__(self):
        self.services: Dict[str, RegisteredService] = {}
        self.heartbeat_timeout = 30  # seconds
        
    def register_service(self, service_name: str, endpoint_url: str) -> ServiceRegistration:
        """
        Register a service with the registry
        
        Args:
            service_name: Name of the service
            endpoint_url: URL of the service endpoint
            
        Returns:
            ServiceRegistration object
        """
        logger.info(f"Registering service: {service_name} at {endpoint_url}")
        
        # If service already exists, update it
        if service_name in self.services:
            service = self.services[service_name]
            service.endpoint_url = endpoint_url
            service.status = "registered"
            service.registered_at = time.time()
            service.last_heartbeat = time.time()
        else:
            # Create new service registration
            service = RegisteredService(
                service_name=service_name,
                endpoint_url=endpoint_url,
                status="registered",
                registered_at=time.time(),
                last_heartbeat=time.time()
            )
            self.services[service_name] = service
            
        # Return the registration information
        return ServiceRegistration(
            service_name=service.service_name,
            endpoint_url=service.endpoint_url,
            status=service.status,
            registered_at=datetime.fromtimestamp(service.registered_at)
        )
        
    def unregister_service(self, service_name: str) -> bool:
        """
        Unregister a service from the registry
        
        Args:
            service_name: Name of the service to unregister
            
        Returns:
            True if service was unregistered, False if not found
        """
        if service_name in self.services:
            del self.services[service_name]
            logger.info(f"Unregistered service: {service_name}")
            return True
        return False
        
    def update_service_status(self, service_name: str, status: str) -> bool:
        """
        Update the status of a registered service
        
        Args:
            service_name: Name of the service
            status: New status of the service
            
        Returns:
            True if status was updated, False if service not found
        """
        if service_name in self.services:
            self.services[service_name].status = status
            logger.info(f"Updated status of {service_name} to {status}")
            return True
        return False
        
    def heartbeat(self, service_name: str) -> bool:
        """
        Update the heartbeat timestamp for a service
        
        Args:
            service_name: Name of the service
            
        Returns:
            True if heartbeat was updated, False if service not found
        """
        if service_name in self.services:
            self.services[service_name].last_heartbeat = time.time()
            return True
        return False
        
    def get_service(self, service_name: str) -> Optional[ServiceRegistration]:
        """
        Get information about a specific service
        
        Args:
            service_name: Name of the service
            
        Returns:
            ServiceRegistration object or None if not found
        """
        if service_name in self.services:
            service = self.services[service_name]
            # Check if service has timed out
            if time.time() - service.last_heartbeat > self.heartbeat_timeout:
                service.status = "timeout"
                
            return ServiceRegistration(
                service_name=service.service_name,
                endpoint_url=service.endpoint_url,
                status=service.status,
                registered_at=datetime.fromtimestamp(service.registered_at)
            )
        return None
        
    def list_services(self) -> List[ServiceRegistration]:
        """
        List all registered services
        
        Returns:
            List of ServiceRegistration objects
        """
        services = []
        current_time = time.time()
        
        for service in self.services.values():
            # Check if service has timed out
            if current_time - service.last_heartbeat > self.heartbeat_timeout:
                service.status = "timeout"
                
            services.append(ServiceRegistration(
                service_name=service.service_name,
                endpoint_url=service.endpoint_url,
                status=service.status,
                registered_at=datetime.fromtimestamp(service.registered_at)
            ))
            
        return services
        
    def get_active_services(self) -> List[ServiceRegistration]:
        """
        List all active services (not timed out)
        
        Returns:
            List of ServiceRegistration objects for active services
        """
        services = []
        current_time = time.time()
        
        for service in self.services.values():
            # Check if service is active
            if current_time - service.last_heartbeat <= self.heartbeat_timeout:
                services.append(ServiceRegistration(
                    service_name=service.service_name,
                    endpoint_url=service.endpoint_url,
                    status=service.status,
                    registered_at=datetime.fromtimestamp(service.registered_at)
                ))
                
        return services
        
    def cleanup_timeout_services(self) -> int:
        """
        Remove services that have timed out
        
        Returns:
            Number of services removed
        """
        current_time = time.time()
        removed_count = 0
        
        # Create a list of services to remove
        to_remove = []
        for service_name, service in self.services.items():
            if current_time - service.last_heartbeat > self.heartbeat_timeout:
                to_remove.append(service_name)
                
        # Remove the services
        for service_name in to_remove:
            del self.services[service_name]
            removed_count += 1
            logger.info(f"Removed timed out service: {service_name}")
            
        return removed_count
        
    def save_to_file(self, filename: str) -> bool:
        """
        Save the service registry to a file
        
        Args:
            filename: Path to the file
            
        Returns:
            True if saved successfully, False otherwise
        """
        try:
            # Convert services to serializable format
            services_data = []
            for service in self.services.values():
                services_data.append({
                    'service_name': service.service_name,
                    'endpoint_url': service.endpoint_url,
                    'status': service.status,
                    'registered_at': service.registered_at,
                    'last_heartbeat': service.last_heartbeat
                })
                
            with open(filename, 'w') as f:
                json.dump(services_data, f, indent=2)
                
            logger.info(f"Service registry saved to {filename}")
            return True
        except Exception as e:
            logger.error(f"Error saving service registry: {e}")
            return False
            
    def load_from_file(self, filename: str) -> bool:
        """
        Load the service registry from a file
        
        Args:
            filename: Path to the file
            
        Returns:
            True if loaded successfully, False otherwise
        """
        try:
            with open(filename, 'r') as f:
                services_data = json.load(f)
                
            # Clear current services
            self.services.clear()
            
            # Load services from file
            for service_data in services_data:
                service = RegisteredService(
                    service_name=service_data['service_name'],
                    endpoint_url=service_data['endpoint_url'],
                    status=service_data['status'],
                    registered_at=service_data['registered_at'],
                    last_heartbeat=service_data['last_heartbeat']
                )
                self.services[service.service_name] = service
                
            logger.info(f"Service registry loaded from {filename}")
            return True
        except Exception as e:
            logger.error(f"Error loading service registry: {e}")
            return False

# Global service registry instance
service_registry = ServiceRegistry()

if __name__ == "__main__":
    # Example usage
    registry = ServiceRegistry()
    
    # Register some services
    auth_service = registry.register_service("auth", "http://localhost:5000")
    planner_service = registry.register_service("planner", "http://localhost:8000")
    simulation_service = registry.register_service("simulation", "http://localhost:8001")
    
    # List all services
    print("All services:")
    for service in registry.list_services():
        print(f"  {service.service_name}: {service.endpoint_url} ({service.status})")
        
    # Get a specific service
    auth_info = registry.get_service("auth")
    if auth_info:
        print(f"\nAuth service: {auth_info.endpoint_url}")
        
    # Update service status
    registry.update_service_status("planner", "busy")
    planner_info = registry.get_service("planner")
    if planner_info:
        print(f"Planner service status: {planner_info.status}")