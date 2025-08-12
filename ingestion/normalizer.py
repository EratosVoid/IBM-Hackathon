# normalizer.py
"""
Converts raw GIS/blueprint data into a normalized schema:
- zones
- roads
- services
- buildings
- architectures
- parks
- water_bodies
- other_features
"""

def normalize_data(raw_data):
    """
    Converts raw GIS/blueprint data into a normalized dictionary with keys:
    - zones
    - roads
    - services
    - buildings
    - architectures
    - parks
    - water_bodies
    - other_features
    """
    normalized = {
        "zones": [],
        "roads": [],
        "services": [],
        "buildings": [],
        "architectures": [],
        "parks": [],
        "water_bodies": [],
        "other_features": []
    }
    # Handle GeoDataFrame (GeoJSON, shapefile, etc.)
    if hasattr(raw_data, 'iterrows'):
        for _, row in raw_data.iterrows():
            props = row.get('properties', row)
            geom = row.get('geometry', row.geometry)
            ftype = props.get('feature_type', '').lower()
            if ftype == 'zone':
                normalized['zones'].append({"name": props.get('name'), "geometry": geom, "metadata": props})
            elif ftype == 'road':
                normalized['roads'].append({"name": props.get('name'), "geometry": geom, "metadata": props})
            elif ftype == 'service':
                normalized['services'].append({"name": props.get('name'), "geometry": geom, "metadata": props})
            elif ftype == 'building':
                normalized['buildings'].append({"name": props.get('name'), "geometry": geom, "metadata": props})
            elif ftype == 'architecture':
                normalized['architectures'].append({"name": props.get('name'), "geometry": geom, "metadata": props})
            elif ftype == 'park':
                normalized['parks'].append({"name": props.get('name'), "geometry": geom, "metadata": props})
            elif ftype == 'water_body':
                normalized['water_bodies'].append({"name": props.get('name'), "geometry": geom, "metadata": props})
            else:
                normalized['other_features'].append({"name": props.get('name'), "geometry": geom, "metadata": props})
    # TODO: Add DXF and other format support as needed
    return normalized

def normalize_detected_features(detected_features):
    """
    Converts detected features from image/blueprint into the normalized schema.
    """
    normalized = {
        "zones": [],
        "roads": [],
        "services": [],
        "buildings": [],
        "architectures": [],
        "parks": [],
        "water_bodies": [],
        "other_features": []
    }
    for feature in detected_features:
        ftype = feature.get('type')
        if ftype == 'zone':
            normalized['zones'].append(feature)
        elif ftype == 'road':
            normalized['roads'].append(feature)
        elif ftype == 'service':
            normalized['services'].append(feature)
        elif ftype == 'building':
            normalized['buildings'].append(feature)
        elif ftype == 'architecture':
            normalized['architectures'].append(feature)
        elif ftype == 'park':
            normalized['parks'].append(feature)
        elif ftype == 'water_body':
            normalized['water_bodies'].append(feature)
        else:
            normalized['other_features'].append(feature)
    return normalized
