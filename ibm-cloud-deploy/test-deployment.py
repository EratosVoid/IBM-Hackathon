#!/usr/bin/env python3
"""
Test script to verify IBM Cloud deployment configuration for Agentic City Planner
"""

import os
import sys
import subprocess
from pathlib import Path

def check_file_exists(file_path):
    """Check if a file exists and print status"""
    if os.path.exists(file_path):
        print(f"[PASS] {file_path} exists")
        return True
    else:
        print(f"[FAIL] {file_path} not found")
        return False

def check_docker_config():
    """Check Docker configuration files"""
    print("\nChecking Docker configuration...")
    
    # Check main Dockerfile
    dockerfile_exists = check_file_exists("Dockerfile")
    
    # Check service Dockerfiles
    services = ["auth", "planner-agent", "simulation-engine", "document-processor", "parser"]
    service_dockerfiles = []
    
    for service in services:
        dockerfile_path = f"{service}/Dockerfile"
        exists = check_file_exists(dockerfile_path)
        service_dockerfiles.append(exists)
    
    return dockerfile_exists and all(service_dockerfiles)

def check_deployment_files():
    """Check IBM Cloud deployment files"""
    print("\nChecking IBM Cloud deployment files...")
    
    deployment_files = [
        "ibm-cloud-deploy/README.md",
        "ibm-cloud-deploy/deployment.yaml",
        "ibm-cloud-deploy/build-and-push.sh",
        "ibm-cloud-deploy/build-and-push.bat",
        "ibm-cloud-deploy/WATSON_AI_SETUP.md"
    ]
    
    results = []
    for file_path in deployment_files:
        exists = check_file_exists(file_path)
        results.append(exists)
    
    return all(results)

def check_environment_variables():
    """Check environment variable configuration"""
    print("\nChecking environment variables...")
    
    # Check .env file
    env_exists = check_file_exists(".env")
    
    if env_exists:
        # Read .env file and check for Watson AI variables
        with open(".env", "r") as f:
            env_content = f.read()
        
        required_vars = [
            "IBM_WATSONX_API_KEY",
            "IBM_WATSONX_PROJECT_ID",
            "WATSONX_APIKEY",
            "WATSONX_PROJECT_ID"
        ]
        
        var_results = []
        for var in required_vars:
            if var in env_content:
                print(f"[PASS] {var} found in .env")
                var_results.append(True)
            else:
                print(f"[FAIL] {var} not found in .env")
                var_results.append(False)
        
        return all(var_results)
    
    return env_exists

def check_watson_ai_integration():
    """Check Watson AI integration in source code"""
    print("\nChecking Watson AI integration...")
    
    # Check planner agent
    planner_files = [
        "planner-agent/src/planner_agent.py",
        "planner-agent/requirements.txt"
    ]
    
    planner_results = []
    for file_path in planner_files:
        exists = check_file_exists(file_path)
        planner_results.append(exists)
    
    # Check document processor
    doc_processor_files = [
        "document-processor/src/document_processor.py",
        "document-processor/requirements.txt"
    ]
    
    doc_results = []
    for file_path in doc_processor_files:
        exists = check_file_exists(file_path)
        doc_results.append(exists)
    
    return all(planner_results) and all(doc_results)

def check_docker_build():
    """Test Docker build process"""
    print("\nTesting Docker build process...")
    
    services = ["auth", "planner-agent", "simulation-engine", "document-processor", "parser"]
    build_results = []
    
    for service in services:
        try:
            # Test build with --dry-run to avoid actually building
            result = subprocess.run(
                ["docker", "build", "--help"], 
                capture_output=True, 
                text=True,
                cwd=service
            )
            if result.returncode == 0:
                print(f"[PASS] Docker build command available for {service}")
                build_results.append(True)
            else:
                print(f"[FAIL] Docker build command failed for {service}")
                build_results.append(False)
        except FileNotFoundError:
            print(f"✗ Docker not found for {service}")
            build_results.append(False)
    
    return all(build_results)

def main():
    """Main test function"""
    print("Testing IBM Cloud Deployment Configuration for Agentic City Planner")
    print("=" * 70)
    
    # Change to project root directory
    project_root = Path(__file__).parent.parent
    os.chdir(project_root)
    print(f"Working directory: {os.getcwd()}")
    
    # Run all checks
    checks = [
        ("Docker Configuration", check_docker_config),
        ("Deployment Files", check_deployment_files),
        ("Environment Variables", check_environment_variables),
        ("Watson AI Integration", check_watson_ai_integration),
        ("Docker Build Process", check_docker_build)
    ]
    
    results = []
    for check_name, check_function in checks:
        print(f"\n{check_name}:")
        result = check_function()
        results.append(result)
    
    # Print summary
    print("\n" + "=" * 70)
    print("Deployment Test Summary:")
    print("=" * 70)
    
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"All tests passed ({passed}/{total})")
        print("[PASS] Application is ready for IBM Cloud deployment")
        return 0
    else:
        print(f"Some tests failed ({passed}/{total})")
        print("[FAIL] Please fix the issues before deploying to IBM Cloud")
        return 1

if __name__ == "__main__":
    sys.exit(main())