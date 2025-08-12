# schemas.py
"""
Defines the normalized schema for blueprint ingestion.
"""

from typing import List, Dict

class Zone:
    def __init__(self, id: str, name: str, geometry, metadata: Dict):
        self.id = id
        self.name = name
        self.geometry = geometry
        self.metadata = metadata

class Road:
    def __init__(self, id: str, name: str, geometry, road_type: str):
        self.id = id
        self.name = name
        self.geometry = geometry
        self.road_type = road_type

class Service:
    def __init__(self, id: str, name: str, geometry, service_type: str):
        self.id = id
        self.name = name
        self.geometry = geometry
        self.service_type = service_type

class Building:
    def __init__(self, id: str, name: str, geometry, building_type: str, metadata: Dict):
        self.id = id
        self.name = name
        self.geometry = geometry
        self.building_type = building_type
        self.metadata = metadata

class Architecture:
    def __init__(self, id: str, name: str, geometry, style: str, metadata: Dict):
        self.id = id
        self.name = name
        self.geometry = geometry
        self.style = style
        self.metadata = metadata

class Park:
    def __init__(self, id: str, name: str, geometry, park_type: str, metadata: Dict):
        self.id = id
        self.name = name
        self.geometry = geometry
        self.park_type = park_type
        self.metadata = metadata

class WaterBody:
    def __init__(self, id: str, name: str, geometry, water_type: str, metadata: Dict):
        self.id = id
        self.name = name
        self.geometry = geometry
        self.water_type = water_type
        self.metadata = metadata

class OtherFeature:
    def __init__(self, id: str, name: str, geometry, feature_type: str, metadata: Dict):
        self.id = id
        self.name = name
        self.geometry = geometry
        self.feature_type = feature_type
        self.metadata = metadata
