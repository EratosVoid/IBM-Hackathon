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
from .normalizer import normalize_data, normalize_detected_features

# Add image processing imports
import cv2
# from yolov5 import YOLOv5  # Example if using YOLOv5, or use any other model


def detect_features_from_image(image_path):
    """
    Detects objects/features from an image or blueprint using computer vision/AI.
    Returns a list of detected features with type, geometry, and metadata.
    """
    # Placeholder: Load image and run detection model
    image = cv2.imread(image_path)
    # TODO: Run detection model (e.g., YOLO, custom model) and extract features
    detected_features = []
    # Example: detected_features.append({'type': 'building', 'geometry': ..., 'metadata': {...}})
    return detected_features


def parse_file(file_path):
    """
    Parses a blueprint file and returns normalized data.
    Supports GeoJSON, DXF, JSON, ZIP, and image files (PNG, JPG, JPEG, BMP, TIFF, PDF).
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
