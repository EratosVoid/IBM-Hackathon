#!/usr/bin/env python3
"""
Run script for Document Processor API
Simple way to start the FastAPI server
"""

import uvicorn
import os
from dotenv import load_dotenv

def main():
    """Start the Document Processor API server"""
    # Load environment variables
    load_dotenv()
    
    # Get configuration from environment
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8001))
    
    print("🚀 Starting Document Processor API...")
    print(f"📍 Server will run on: http://{host}:{port}")
    print("📚 API Documentation: http://localhost:8001/docs")
    print("🔍 Health Check: http://localhost:8001/health")
    print("\nPress Ctrl+C to stop the server")
    print("=" * 60)
    
    # Start the server
    uvicorn.run(
        "src.main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main()
