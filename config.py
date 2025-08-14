"""
Shared Configuration for Agentic City Planner
This file contains common configuration settings used across all services.
"""

import os
from typing import Dict, Any

class Config:
    """Base configuration class"""
    
    # Service ports
    API_PORT = int(os.getenv('API_PORT', 5000))
    PLANNER_PORT = int(os.getenv('PLANNER_PORT', 8000))
    SIMULATION_PORT = int(os.getenv('SIMULATION_PORT', 8001))
    DOCUMENT_PORT = int(os.getenv('DOCUMENT_PORT', 8002))
    PARSER_PORT = int(os.getenv('PARSER_PORT', 8003))
    
    # Service URLs - configurable for different environments
    API_URL = os.getenv('API_URL', f"http://localhost:{API_PORT}")
    PLANNER_URL = os.getenv('PLANNER_URL', f"http://localhost:{PLANNER_PORT}")
    SIMULATION_URL = os.getenv('SIMULATION_URL', f"http://localhost:{SIMULATION_PORT}")
    DOCUMENT_URL = os.getenv('DOCUMENT_URL', f"http://localhost:{DOCUMENT_PORT}")
    PARSER_URL = os.getenv('PARSER_URL', f"http://localhost:{PARSER_PORT}")
    
    # Database configuration
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./city_planner.db')
    
    # JWT configuration
    JWT_SECRET = os.getenv('JWT_SECRET', 'cityplanner_secret_key')
    
    # WatsonX configuration
    IBM_WATSONX_API_KEY = os.getenv('IBM_WATSONX_API_KEY', '')
    IBM_WATSONX_URL = os.getenv('IBM_WATSONX_URL', 'https://us-south.ml.cloud.ibm.com')
    IBM_WATSONX_PROJECT_ID = os.getenv('IBM_WATSONX_PROJECT_ID', '')
    
    # Logging configuration
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    
    # ChromaDB configuration
    CHROMA_PERSIST_DIR = os.getenv('CHROMA_PERSIST_DIR', './chroma_db')
    
    @staticmethod
    def get_service_urls() -> Dict[str, str]:
        """Return a dictionary of all service URLs"""
        return {
            'api': Config.API_URL,
            'planner': Config.PLANNER_URL,
            'simulation': Config.SIMULATION_URL,
            'document': Config.DOCUMENT_URL,
            'parser': Config.PARSER_URL
        }
        
    @staticmethod
    def get_service_ports() -> Dict[str, int]:
        """Return a dictionary of all service ports"""
        return {
            'api': Config.API_PORT,
            'planner': Config.PLANNER_PORT,
            'simulation': Config.SIMULATION_PORT,
            'document': Config.DOCUMENT_PORT,
            'parser': Config.PARSER_PORT
        }

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://user:password@localhost/cityplanner')

class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    DATABASE_URL = 'sqlite:///:memory:'

# Configuration factory
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig
}

def get_config(config_name: str = 'development') -> Config:
    """Get configuration object based on environment"""
    return config.get(config_name, DevelopmentConfig)