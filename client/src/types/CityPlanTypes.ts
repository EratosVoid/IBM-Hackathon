// Core coordinate and geometry types
export interface Coordinate {
  x: number;
  y: number;
}

export interface GeometryPolygon {
  type: 'polygon';
  coordinates: Coordinate[][];  // Array of rings [outer ring, ...hole rings]
}

export interface GeometryLineString {
  type: 'linestring';
  coordinates: Coordinate[];
}

export interface GeometryPoint {
  type: 'point';
  coordinates: Coordinate;
}

export type Geometry = GeometryPolygon | GeometryLineString | GeometryPoint;

// Styling for visual rendering
export interface FeatureStyle {
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  dashArray?: number[];
  iconUrl?: string;
  iconSize?: [number, number];
}

// Feature types and subtypes
export type FeatureType = 'zone' | 'road' | 'building' | 'park' | 'water_body' | 'service' | 'architecture';

export interface FeatureSubtypes {
  zone: 'residential' | 'commercial' | 'industrial' | 'mixed_use' | 'agricultural' | 'recreational';
  road: 'highway' | 'primary' | 'secondary' | 'local' | 'pedestrian' | 'cycle' | 'rail';
  building: 'residential' | 'commercial' | 'industrial' | 'institutional' | 'mixed_use' | 'infrastructure';
  park: 'public' | 'private' | 'playground' | 'sports' | 'garden' | 'forest' | 'wetland';
  water_body: 'lake' | 'river' | 'stream' | 'pond' | 'reservoir' | 'canal' | 'fountain';
  service: 'utility' | 'emergency' | 'education' | 'healthcare' | 'transport' | 'waste' | 'communication';
  architecture: 'monument' | 'landmark' | 'bridge' | 'tower' | 'historic' | 'cultural' | 'religious';
}

// Main city feature interface
export interface CityFeature {
  id: string;
  type: FeatureType;
  subtype?: string;
  name: string;
  description?: string;
  geometry: Geometry;
  style?: FeatureStyle;
  metadata: {
    area?: number;
    length?: number;
    height?: number;
    capacity?: number;
    cost?: number;
    yearBuilt?: number;
    status?: 'planned' | 'under_construction' | 'completed' | 'demolished';
    zoneCode?: string;
    population?: number;
    confidence?: 'low' | 'medium' | 'high';
    detectionMethod?: string;
    [key: string]: any;
  };
}

// Layer organization for rendering control
export interface CityLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  featureIds: string[];
  style?: FeatureStyle; // Default style for layer
  zIndex: number;
}

// Bounds for coordinate system (bottom-left origin, all positive coordinates)
export interface CityBounds {
  minX: number; // Minimum X coordinate (typically 0)
  maxX: number; // Maximum X coordinate (blueprint width)
  minY: number; // Minimum Y coordinate (typically 0)
  maxY: number; // Maximum Y coordinate (blueprint height)
}

// Blueprint dimensions for city planning
export interface BlueprintDimensions {
  width: number;
  height: number;
  unit: 'meters' | 'feet' | 'kilometers';
}

// Main city plan data structure
export interface CityPlanData {
  id: string;
  name: string;
  description?: string;
  coordinateSystem: {
    type: 'cartesian' | 'geographic';
    unit: 'meters' | 'feet' | 'degrees';
    origin?: Coordinate; // Default: bottom-left origin (0,0) with all positive coordinates
  };
  bounds: CityBounds;
  blueprint?: BlueprintDimensions;
  features: CityFeature[];
  layers: { [layerId: string]: CityLayer };
  metadata: {
    scale?: number;
    projection?: string;
    lastModified: string;
    version: string;
    [key: string]: any;
  };
}

// Default styles for different feature types
export const DEFAULT_FEATURE_STYLES: { [K in FeatureType]: FeatureStyle } = {
  zone: {
    fillColor: '#E3F2FD',
    strokeColor: '#1976D2',
    strokeWidth: 2,
    opacity: 0.7
  },
  road: {
    strokeColor: '#424242',
    strokeWidth: 3,
    opacity: 1.0
  },
  building: {
    fillColor: '#FFF3E0',
    strokeColor: '#F57C00',
    strokeWidth: 1,
    opacity: 0.9
  },
  park: {
    fillColor: '#E8F5E8',
    strokeColor: '#4CAF50',
    strokeWidth: 1,
    opacity: 0.8
  },
  water_body: {
    fillColor: '#E1F5FE',
    strokeColor: '#0288D1',
    strokeWidth: 1,
    opacity: 0.8
  },
  service: {
    fillColor: '#FCE4EC',
    strokeColor: '#C2185B',
    strokeWidth: 1,
    opacity: 0.7
  },
  architecture: {
    fillColor: '#F3E5F5',
    strokeColor: '#7B1FA2',
    strokeWidth: 2,
    opacity: 0.9
  }
};

// Subtype-specific style overrides
export const SUBTYPE_STYLES: { [key: string]: Partial<FeatureStyle> } = {
  // Zone subtypes
  'zone:residential': { fillColor: '#E8F5E8', strokeColor: '#4CAF50' },
  'zone:commercial': { fillColor: '#FFF3E0', strokeColor: '#FF9800' },
  'zone:industrial': { fillColor: '#FAFAFA', strokeColor: '#616161' },
  'zone:mixed_use': { fillColor: '#F3E5F5', strokeColor: '#9C27B0' },
  'zone:agricultural': { fillColor: '#F1F8E9', strokeColor: '#689F38' },
  'zone:recreational': { fillColor: '#E0F2F1', strokeColor: '#26A69A' },
  
  // Road subtypes
  'road:highway': { strokeColor: '#D32F2F', strokeWidth: 6 },
  'road:primary': { strokeColor: '#F57C00', strokeWidth: 4 },
  'road:secondary': { strokeColor: '#388E3C', strokeWidth: 3 },
  'road:local': { strokeColor: '#616161', strokeWidth: 2 },
  'road:pedestrian': { strokeColor: '#795548', strokeWidth: 2, dashArray: [5, 5] },
  'road:cycle': { strokeColor: '#4CAF50', strokeWidth: 2, dashArray: [3, 3] },
  'road:rail': { strokeColor: '#424242', strokeWidth: 4, dashArray: [8, 4] },
  
  // Building subtypes
  'building:residential': { fillColor: '#E8F5E8', strokeColor: '#4CAF50' },
  'building:commercial': { fillColor: '#FFF3E0', strokeColor: '#FF9800' },
  'building:industrial': { fillColor: '#ECEFF1', strokeColor: '#607D8B' },
  'building:institutional': { fillColor: '#E3F2FD', strokeColor: '#1976D2' },
  'building:mixed_use': { fillColor: '#F3E5F5', strokeColor: '#9C27B0' },
  'building:infrastructure': { fillColor: '#EFEBE9', strokeColor: '#5D4037' },
  
  // Park subtypes
  'park:public': { fillColor: '#E8F5E8', strokeColor: '#4CAF50' },
  'park:private': { fillColor: '#F1F8E9', strokeColor: '#689F38' },
  'park:playground': { fillColor: '#FFF9C4', strokeColor: '#FBC02D' },
  'park:sports': { fillColor: '#E3F2FD', strokeColor: '#1976D2' },
  'park:garden': { fillColor: '#E0F2F1', strokeColor: '#26A69A' },
  'park:forest': { fillColor: '#2E7D32', strokeColor: '#1B5E20' },
  'park:wetland': { fillColor: '#B2DFDB', strokeColor: '#00695C' },
  
  // Water body subtypes
  'water_body:lake': { fillColor: '#E1F5FE', strokeColor: '#0277BD' },
  'water_body:river': { fillColor: '#B3E5FC', strokeColor: '#0288D1', strokeWidth: 3 },
  'water_body:stream': { fillColor: '#B3E5FC', strokeColor: '#0288D1', strokeWidth: 1 },
  'water_body:pond': { fillColor: '#E0F7FA', strokeColor: '#00ACC1' },
  'water_body:reservoir': { fillColor: '#E1F5FE', strokeColor: '#0277BD', strokeWidth: 2 },
  'water_body:canal': { fillColor: '#B2EBF2', strokeColor: '#0097A7', strokeWidth: 2 },
  'water_body:fountain': { fillColor: '#E0F7FA', strokeColor: '#00BCD4' },
  
  // Service subtypes
  'service:utility': { fillColor: '#FFF8E1', strokeColor: '#FFA000' },
  'service:emergency': { fillColor: '#FFEBEE', strokeColor: '#D32F2F' },
  'service:education': { fillColor: '#E3F2FD', strokeColor: '#1976D2' },
  'service:healthcare': { fillColor: '#E8F5E8', strokeColor: '#4CAF50' },
  'service:transport': { fillColor: '#F3E5F5', strokeColor: '#7B1FA2' },
  'service:waste': { fillColor: '#EFEBE9', strokeColor: '#5D4037' },
  'service:communication': { fillColor: '#E8EAF6', strokeColor: '#303F9F' },
  
  // Architecture subtypes
  'architecture:monument': { fillColor: '#FFF3E0', strokeColor: '#E65100' },
  'architecture:landmark': { fillColor: '#F3E5F5', strokeColor: '#4A148C' },
  'architecture:bridge': { fillColor: '#ECEFF1', strokeColor: '#37474F' },
  'architecture:tower': { fillColor: '#E8EAF6', strokeColor: '#283593' },
  'architecture:historic': { fillColor: '#EFEBE9', strokeColor: '#3E2723' },
  'architecture:cultural': { fillColor: '#FCE4EC', strokeColor: '#AD1457' },
  'architecture:religious': { fillColor: '#FFF9C4', strokeColor: '#F57F17' }
};

// Utility functions for working with city plan data
export class CityPlanUtils {
  static getFeatureStyle(feature: CityFeature): FeatureStyle {
    const subtypeKey = `${feature.type}:${feature.subtype}`;
    const subtypeStyle = SUBTYPE_STYLES[subtypeKey] || {};
    const defaultStyle = DEFAULT_FEATURE_STYLES[feature.type];
    const customStyle = feature.style || {};
    
    return { ...defaultStyle, ...subtypeStyle, ...customStyle };
  }
  
  static calculateBounds(features: CityFeature[]): CityBounds {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    features.forEach(feature => {
      const coords = this.extractCoordinates(feature.geometry);
      coords.forEach(coord => {
        minX = Math.min(minX, coord.x);
        maxX = Math.max(maxX, coord.x);
        minY = Math.min(minY, coord.y);
        maxY = Math.max(maxY, coord.y);
      });
    });
    
    return { minX, maxX, minY, maxY };
  }
  
  static extractCoordinates(geometry: Geometry): Coordinate[] {
    switch (geometry.type) {
      case 'point':
        return [geometry.coordinates];
      case 'linestring':
        return geometry.coordinates;
      case 'polygon':
        return geometry.coordinates.flat();
      default:
        return [];
    }
  }
  
  static createDefaultLayers(features: CityFeature[]): { [layerId: string]: CityLayer } {
    const layers: { [layerId: string]: CityLayer } = {};
    const featuresByType = features.reduce((acc, feature) => {
      if (!acc[feature.type]) acc[feature.type] = [];
      acc[feature.type].push(feature.id);
      return acc;
    }, {} as { [type: string]: string[] });
    
    Object.entries(featuresByType).forEach(([type, featureIds], index) => {
      layers[type] = {
        id: type,
        name: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
        visible: true,
        opacity: 1.0,
        featureIds,
        zIndex: index
      };
    });
    
    return layers;
  }
  
  static transformParsedData(parsedData: any): CityPlanData {
    const features: CityFeature[] = [];
    
    // Transform each category from parser output
    const categories = ['zones', 'roads', 'buildings', 'parks', 'water_bodies', 'services', 'architectures'];
    
    categories.forEach(category => {
      const items = parsedData[category] || [];
      const featureType = category.slice(0, -1) as FeatureType; // Remove 's' suffix
      
      items.forEach((item: any, index: number) => {
        const feature: CityFeature = {
          id: `${featureType}_${index}`,
          type: featureType,
          subtype: item.subtype || item[`${featureType}_type`] || 'unknown',
          name: item.name || `${featureType} ${index + 1}`,
          description: item.description,
          geometry: this.parseGeometry(item.geometry),
          metadata: {
            ...item.metadata,
            confidence: item.metadata?.confidence || 'medium',
            detectionMethod: item.metadata?.detection_method || 'unknown'
          }
        };
        
        features.push(feature);
      });
    });
    
    const bounds = this.calculateBounds(features);
    const layers = this.createDefaultLayers(features);
    
    return {
      id: 'city_plan_' + Date.now(),
      name: 'City Plan',
      coordinateSystem: {
        type: 'cartesian',
        unit: 'meters'
      },
      bounds,
      features,
      layers,
      metadata: {
        lastModified: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  }
  
  private static parseGeometry(geometryString: string): Geometry {
    // Parse geometry from string format like "0,0 10,0 12,1"
    if (!geometryString || typeof geometryString !== 'string') {
      return {
        type: 'point',
        coordinates: { x: 0, y: 0 }
      };
    }
    
    const coordPairs = geometryString.trim().split(/\s+/);
    const coordinates = coordPairs.map(pair => {
      const [x, y] = pair.split(',').map(Number);
      return { x: x || 0, y: y || 0 };
    });
    
    if (coordinates.length === 1) {
      return {
        type: 'point',
        coordinates: coordinates[0]
      };
    } else if (coordinates.length === 2) {
      return {
        type: 'linestring',
        coordinates
      };
    } else {
      // Close the polygon if not already closed
      const lastCoord = coordinates[coordinates.length - 1];
      const firstCoord = coordinates[0];
      if (lastCoord.x !== firstCoord.x || lastCoord.y !== firstCoord.y) {
        coordinates.push(firstCoord);
      }
      
      return {
        type: 'polygon',
        coordinates: [coordinates]
      };
    }
  }
}