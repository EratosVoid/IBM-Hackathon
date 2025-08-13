"""
API Gateway for Agentic City Planner
This script acts as a central routing mechanism for all services.
"""

import os
import json
import logging
from typing import Dict, Any
from flask import Flask, request, jsonify, Response
import requests
from config import Config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Service URLs from config
SERVICE_URLS = Config.get_service_urls()

def forward_request(service_name: str, path: str) -> Response:
    """
    Forward request to the appropriate service
    """
    try:
        # Construct the full URL
        service_url = SERVICE_URLS.get(service_name)
        if not service_url:
            return jsonify({"error": f"Service {service_name} not found"}), 404
            
        full_url = f"{service_url}{path}"
        logger.info(f"Forwarding request to {full_url}")
        
        # Forward the request
        if request.method == 'GET':
            resp = requests.get(full_url, params=request.args, headers=request.headers)
        elif request.method == 'POST':
            resp = requests.post(full_url, json=request.get_json(), headers=request.headers)
        elif request.method == 'PUT':
            resp = requests.put(full_url, json=request.get_json(), headers=request.headers)
        elif request.method == 'DELETE':
            resp = requests.delete(full_url, headers=request.headers)
        else:
            return jsonify({"error": "Method not allowed"}), 405
            
        # Return the response
        return Response(
            resp.content,
            status=resp.status_code,
            headers=dict(resp.headers)
        )
    except Exception as e:
        logger.error(f"Error forwarding request to {service_name}: {e}")
        return jsonify({"error": f"Error forwarding request: {str(e)}"}), 500

# Auth service routes
@app.route('/api/auth/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def auth_service(path):
    return forward_request('auth', f'/api/auth/{path}')

@app.route('/api/init-city', methods=['POST'])
def init_city():
    return forward_request('auth', '/api/init-city')

@app.route('/api/prompt', methods=['POST'])
def prompt():
    return forward_request('auth', '/api/prompt')

@app.route('/api/simulation/<path:path>', methods=['GET'])
def simulation_data(path):
    return forward_request('auth', f'/api/simulation/{path}')

@app.route('/api/upload-blueprint', methods=['POST'])
def upload_blueprint():
    return forward_request('auth', '/api/upload-blueprint')

# Planner Agent routes
@app.route('/plan', methods=['POST'])
def plan():
    return forward_request('planner', '/plan')

@app.route('/register-tool', methods=['POST'])
def register_tool():
    return forward_request('planner', '/register-tool')

@app.route('/tools', methods=['GET'])
def tools():
    return forward_request('planner', '/tools')

# Simulation Engine routes
@app.route('/simulate/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def simulate(path):
    return forward_request('simulation', f'/simulate/{path}')

@app.route('/models/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def models(path):
    return forward_request('simulation', f'/models/{path}')

# Document Processor routes
@app.route('/documents/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def documents(path):
    return forward_request('document', f'/documents/{path}')

@app.route('/query', methods=['POST'])
def query():
    return forward_request('document', '/query')

@app.route('/feedback/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def feedback(path):
    return forward_request('document', f'/feedback/{path}')

# Parser service routes
@app.route('/parse/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def parse(path):
    return forward_request('parser', f'/parse/{path}')

# Health check endpoints
@app.route('/health')
def health():
    return forward_request('auth', '/health')

@app.route('/planner-health')
def planner_health():
    return forward_request('planner', '/health')

@app.route('/simulation-health')
def simulation_health():
    return forward_request('simulation', '/health')

@app.route('/document-health')
def document_health():
    return forward_request('document', '/health')

@app.route('/parser-health')
def parser_health():
    return forward_request('parser', '/health')

# Default route
@app.route('/')
def index():
    return jsonify({
        "message": "Agentic City Planner API Gateway",
        "services": list(SERVICE_URLS.keys())
    })

@app.route('/services')
def services():
    return jsonify({
        "services": SERVICE_URLS
    })

if __name__ == '__main__':
    port = int(os.getenv('API_GATEWAY_PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=True)