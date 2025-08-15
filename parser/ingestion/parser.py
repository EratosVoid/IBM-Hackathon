# Blueprint & Data Ingestion Layer
# Owner: Dev C

"""
Parses uploaded GIS, JSON, or blueprint files into normalized format.
Handles zoning metadata, road graphs, and service layers.
Populates the simulation backend and agent context store.
Input: Uploaded blueprint files (GeoJSON, DXF, JSON, ZIP)
Output: Parsed normalized schema (zones, roads, services)
"""

import geopandas as gpd
import ezdxf
import json
import zipfile
import os
import base64
import logging
from typing import List, Dict, Any
from .normalizer import normalize_data, normalize_detected_features

# Add image processing imports
from dotenv import load_dotenv
from ibm_watsonx_ai import APIClient, Credentials
from ibm_watsonx_ai.foundation_models import ModelInference

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def detect_features_from_image(image_path: str) -> List[Dict[str, Any]]:
    """
    Detects objects/features from an image or blueprint using IBM watsonx.ai models.
    Returns a list of detected features with type, geometry, and metadata.
    """
    try:
        # Initialize IBM watsonx.ai client
        api_key = os.getenv('IBM_WATSONX_API_KEY')
        base_url = os.getenv('IBM_WATSONX_URL', 'https://us-south.ml.cloud.ibm.com')
        project_id = os.getenv('IBM_WATSONX_PROJECT_ID')
        
        if not all([api_key, project_id]):
            logger.error("IBM watsonx.ai credentials not found")
            raise ValueError("IBM watsonx.ai credentials required for image processing")
        
        # Set up credentials and client
        credentials = Credentials(url=base_url, api_key=api_key)
        client = APIClient(credentials)
        client.set.default_project(project_id)
        
        # Use vision model with proper chat format (based on reference)
        model_id = "meta-llama/llama-3-2-11b-vision-instruct"
        
        logger.info(f"Using vision model: {model_id}")
        
        # Convert image to base64 for API
        with open(image_path, "rb") as image_file:
            image_b64 = base64.b64encode(image_file.read()).decode('utf-8')
        
        # Initialize model with parameters
        from ibm_watsonx_ai.foundation_models.schema import TextChatParameters
        
        parameters = TextChatParameters(
            max_tokens=800,
            temperature=0.1
        )
        
        model = ModelInference(
            model_id=model_id,
            credentials=credentials,
            project_id=project_id,
            params=parameters
        )
        
        # Create messages with detailed system prompt and minimal user request
        system_prompt = """You are a specialized urban planning AI that analyzes city planning blueprints and satellite images.

TASK: Analyze the provided image and detect urban planning features.

INSTRUCTIONS:
1. Identify ALL visible urban features from these categories
2. Provide detailed, specific information for each feature
3. Return ONLY valid JSON - no explanation or additional text

FEATURE CATEGORIES TO DETECT:
- ZONES: residential, commercial, industrial, mixed-use areas
- ROADS: streets, highways, intersections, bridges
- BUILDINGS: houses, apartments, offices, retail, schools, hospitals
- SERVICES: utilities, fire stations, police, schools, hospitals
- PARKS: playgrounds, green spaces, recreational facilities  
- WATER_BODIES: lakes, rivers, ponds, fountains
- ARCHITECTURES: landmarks, monuments, special structures

REQUIRED JSON FORMAT:
{
  "detected_features": [
    {
      "type": "zone",
      "zone_type": "residential", 
      "name": "North Residential District",
      "location": "northern section",
      "area_size": "large",
      "geometry": "polygon covering coordinates...",
      "metadata": {"density": "medium", "confidence": "high"}
    },
    {
      "type": "road",
      "road_type": "primary",
      "name": "Main Street", 
      "location": "running north-south through center",
      "length": "long",
      "geometry": "linestring connecting...",
      "metadata": {"lanes": "4", "confidence": "high"}
    },
    {
      "type": "building",
      "building_type": "residential",
      "name": "Apartment Complex A",
      "location": "southwest corner", 
      "size": "large",
      "geometry": "rectangular polygon...",
      "metadata": {"stories": "3", "confidence": "medium"}
    },
    {
      "type": "park",
      "park_type": "public",
      "name": "Central Park",
      "location": "city center",
      "size": "medium", 
      "geometry": "irregular polygon...",
      "metadata": {"features": "playground,trees", "confidence": "high"}
    },
    {
      "type": "service",
      "service_type": "school",
      "name": "Elementary School",
      "location": "residential area", 
      "size": "medium",
      "geometry": "rectangular complex...",
      "metadata": {"type": "educational", "confidence": "medium"}
    },
    {
      "type": "water_body", 
      "water_type": "lake",
      "name": "City Lake",
      "location": "eastern edge",
      "size": "large",
      "geometry": "natural polygon shape...",
      "metadata": {"natural": true, "confidence": "high"}
    }
  ]
}

RESPOND WITH JSON ONLY - NO OTHER TEXT."""

        messages = [
            {
                "role": "system", 
                "content": system_prompt
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Analyze this urban planning image and detect all city planning features and give JSON results."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_b64}"
                        }
                    }
                ]
            }
        ]
        
        # Generate response using chat method
        response = model.chat(messages=messages)
        
        # Extract content from response (following reference pattern)
        response_content = response['choices'][0]['message']['content']
        logger.info(f"Model response: {response_content}")
        
        # Parse the JSON response with improved extraction
        try:
            # Clean the response aggressively to extract JSON
            response_text = response_content.strip()
            
            # Remove common prefixes/suffixes that might appear
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            # Find JSON boundaries more robustly
            json_start = response_text.find('{')
            if json_start == -1:
                raise json.JSONDecodeError("No JSON object found", response_text, 0)
                
            # Find the matching closing brace
            brace_count = 0
            json_end = json_start
            for i, char in enumerate(response_text[json_start:], json_start):
                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        json_end = i + 1
                        break
            
            response_text = response_text[json_start:json_end]
            
            analysis_result = json.loads(response_text)
            detected_features = analysis_result.get("detected_features", [])
            
            # Validate and enhance features to match our schema
            enhanced_features = []
            for feature in detected_features:
                # Ensure all required fields exist
                enhanced_feature = {
                    "type": feature.get("type", "other_features"),
                    "name": feature.get("name", f"Unnamed {feature.get('type', 'feature')}"),
                    "location": feature.get("location", "unknown"),
                    "size": feature.get("size", "medium"),
                    "geometry": feature.get("geometry", "polygon placeholder"),
                    "metadata": {
                        "detection_method": "vision_analysis",
                        "confidence": feature.get("metadata", {}).get("confidence", "medium"),
                        **feature.get("metadata", {})
                    }
                }
                
                # Add type-specific fields based on schema
                if feature.get("type") == "zone":
                    enhanced_feature["zone_type"] = feature.get("zone_type", "mixed_use")
                elif feature.get("type") == "road": 
                    enhanced_feature["road_type"] = feature.get("road_type", "secondary")
                elif feature.get("type") == "building":
                    enhanced_feature["building_type"] = feature.get("building_type", "residential")
                elif feature.get("type") == "service":
                    enhanced_feature["service_type"] = feature.get("service_type", "utility")
                elif feature.get("type") == "park":
                    enhanced_feature["park_type"] = feature.get("park_type", "public")
                elif feature.get("type") == "water_body":
                    enhanced_feature["water_type"] = feature.get("water_type", "pond")
                elif feature.get("type") == "architecture":
                    enhanced_feature["style"] = feature.get("style", "modern")
                
                enhanced_features.append(enhanced_feature)
            
            logger.info(f"IBM watsonx.ai detected {len(enhanced_features)} features using {model_id}")
            logger.info(f"Feature types: {[f['type'] for f in enhanced_features]}")
            
            return enhanced_features
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.error(f"Raw response: {response_content}")
            
            # Return more realistic fallback features matching our schema
            return [
                {
                    "type": "zone",
                    "zone_type": "mixed_use", 
                    "name": "Detected Urban Area",
                    "location": "center of image",
                    "size": "large",
                    "geometry": "polygon boundary",
                    "metadata": {
                        "detection_method": "fallback",
                        "source_file": os.path.basename(image_path),
                        "error": "JSON parsing failed",
                        "confidence": "low"
                    }
                },
                {
                    "type": "road",
                    "road_type": "secondary",
                    "name": "Main Transportation Route", 
                    "location": "running through area",
                    "size": "medium",
                    "geometry": "linestring path",
                    "metadata": {
                        "detection_method": "fallback",
                        "confidence": "low"
                    }
                }
            ]
        
    except Exception as e:
        logger.error(f"IBM watsonx.ai vision detection failed: {e}")
        raise




def parse_file(file_path):
    """
    Parses a blueprint file and returns normalized data.
    Supports GeoJSON, DXF, JSON and image files (PNG, JPG, JPEG, BMP, TIFF, PDF).
    """
    if file_path.endswith(('.geojson', '.json')):
        data = gpd.read_file(file_path)
        return normalize_data(data)
    elif file_path.endswith('.dxf'):
        doc = ezdxf.readfile(file_path)
        # Extract entities as features
        features = []
        for entity in doc.modelspace():
            feature = {
                'type': entity.dxftype().lower(),
                'geometry': entity.dxf.__dict__,
                'metadata': {k: getattr(entity.dxf, k) for k in dir(entity.dxf) if not k.startswith('_') and not callable(getattr(entity.dxf, k))}
            }
            features.append(feature)
        return normalize_detected_features(features)
    elif file_path.endswith('.def'):
        # Parse .def as lines, treat each line as a feature (placeholder logic)
        features = []
        with open(file_path, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f):
                features.append({
                    'type': 'def_feature',
                    'geometry': None,
                    'metadata': {'line': line.strip(), 'index': i}
                })
        return normalize_detected_features(features)
    elif file_path.endswith('.zip'):
        import os
        import glob
        extract_dir = "temp_extracted"
        with zipfile.ZipFile(file_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
        all_features = []
        for ext in ['*.geojson', '*.json', '*.dxf', '*.def', '*.png', '*.jpg', '*.jpeg', '*.bmp', '*.tiff', '*.pdf']:
            for f in glob.glob(os.path.join(extract_dir, '**', ext), recursive=True):
                try:
                    result = parse_file(f)
                    # Merge features from normalized dicts
                    for k in ['zones','roads','services','buildings','architectures','parks','water_bodies','other_features']:
                        all_features.extend(result.get(k, []))
                except Exception as e:
                    all_features.append({'type': 'error', 'metadata': {'file': f, 'error': str(e)}})
        return normalize_detected_features(all_features)
    elif file_path.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.pdf')):
        detected_features = detect_features_from_image(file_path)
        return normalize_detected_features(detected_features)
    else:
        raise ValueError("Unsupported file type. Supported: .geojson, .json, .dxf, .def, .zip, .png, .jpg, .jpeg, .bmp, .tiff, .pdf")
