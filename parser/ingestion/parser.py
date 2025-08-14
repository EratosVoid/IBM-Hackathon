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
import cv2
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
            logger.warning("IBM watsonx.ai credentials not found, falling back to basic CV")
            return _fallback_cv_detection(image_path)
        
        # Set up credentials and client
        credentials = Credentials(url=base_url, api_key=api_key)
        client = APIClient(credentials)
        client.set.default_project(project_id)
        
        # Initialize model for vision tasks
        model = ModelInference(
            model_id="meta-llama/llama-3-2-90b-vision-instruct",
            credentials=credentials,
            project_id=project_id,
            params={
                "decoding_method": "greedy",
                "max_new_tokens": 1000,
                "temperature": 0.1
            }
        )
        
        # Convert image to base64 for API
        with open(image_path, "rb") as image_file:
            image_b64 = base64.b64encode(image_file.read()).decode('utf-8')
        
        # Create prompt for urban planning feature detection
        vision_prompt = """
        Analyze this city planning blueprint or satellite image and identify the following urban features:
        
        1. Zoning areas (residential, commercial, industrial, green spaces)
        2. Transportation infrastructure (roads, railways, airports)
        3. Utilities (power lines, water systems)
        4. Buildings and structures
        5. Natural features (rivers, parks, forests)
        
        For each feature detected, provide:
        - Feature type (building, road, park, etc.)
        - Approximate location/coordinates if visible
        - Size category (small, medium, large)
        - Zoning classification
        
        Format your response as JSON with this structure:
        {
          "detected_features": [
            {
              "type": "feature_type",
              "zoning": "zone_category", 
              "location": "description",
              "size": "small/medium/large",
              "metadata": {"additional_info": "value"}
            }
          ]
        }
        """
        
        # Generate analysis using watsonx.ai vision model
        response = model.generate_text(
            prompt=[
                {
                    "type": "text",
                    "text": vision_prompt
                },
                {
                    "type": "image_url", 
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_b64}"
                    }
                }
            ],
            guardrails=False
        )
        
        # Parse the JSON response
        import json
        try:
            analysis_result = json.loads(response)
            detected_features = analysis_result.get("detected_features", [])
            
            logger.info(f"IBM watsonx.ai detected {len(detected_features)} features in image")
            return detected_features
            
        except json.JSONDecodeError:
            logger.error("Failed to parse watsonx.ai JSON response, using fallback")
            return _fallback_cv_detection(image_path)
        
    except Exception as e:
        logger.error(f"IBM watsonx.ai vision detection failed: {e}")
        return _fallback_cv_detection(image_path)


def _fallback_cv_detection(image_path: str) -> List[Dict[str, Any]]:
    """
    Fallback computer vision detection using OpenCV when watsonx.ai is unavailable.
    """
    try:
        image = cv2.imread(image_path)
        if image is None:
            return []
        
        detected_features = []
        
        # Basic computer vision analysis
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        height, width = gray.shape
        
        # Detect large rectangular structures (buildings)
        contours, _ = cv2.findContours(gray, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 1000:  # Filter small noise
                x, y, w, h = cv2.boundingRect(contour)
                
                # Classify based on shape and size
                aspect_ratio = w / h
                relative_size = area / (width * height)
                
                if aspect_ratio > 3 or aspect_ratio < 0.3:
                    feature_type = "infrastructure" if relative_size > 0.01 else "road"
                    zoning = "transportation"
                elif relative_size > 0.05:
                    feature_type = "building"
                    zoning = "commercial" if aspect_ratio > 1.5 else "residential"
                else:
                    feature_type = "structure"
                    zoning = "mixed_use"
                
                detected_features.append({
                    "type": feature_type,
                    "zoning": zoning,
                    "location": f"x:{x}, y:{y}",
                    "size": "large" if relative_size > 0.1 else "medium" if relative_size > 0.02 else "small",
                    "metadata": {
                        "area": int(area),
                        "aspect_ratio": round(aspect_ratio, 2),
                        "detection_method": "opencv_fallback"
                    }
                })
        
        logger.info(f"Fallback CV detection found {len(detected_features)} features")
        return detected_features
        
    except Exception as e:
        logger.error(f"Fallback CV detection failed: {e}")
        return []


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
