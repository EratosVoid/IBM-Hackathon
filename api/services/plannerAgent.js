// Planner Agent Logic - Migrated from Python

// Intent classification function
function classifyIntent(userPrompt) {
  const prompt = userPrompt.toLowerCase();
  
  let intentType = "get_recommendations";
  let featureType = "zone";
  let featureSubtype = "mixed_use";
  let geometryType = "polygon";
  let size = "medium";
  let locationPreference = "center";
  let quantity = 1;
  
  // Determine feature type and specifics
  if (prompt.includes('park') || prompt.includes('garden') || prompt.includes('green space') || prompt.includes('playground')) {
    intentType = "add_park";
    featureType = "park";
    featureSubtype = "public";
    geometryType = "polygon";
  } else if (prompt.includes('residential') || prompt.includes('housing') || prompt.includes('homes') || prompt.includes('houses')) {
    intentType = "add_residential_zone";
    featureType = "zone";
    featureSubtype = "residential";
    geometryType = "polygon";
  } else if (prompt.includes('commercial') || prompt.includes('shopping') || prompt.includes('business') || prompt.includes('stores')) {
    intentType = "add_commercial_district";
    featureType = "zone";
    featureSubtype = "commercial";
    geometryType = "polygon";
  } else if (prompt.includes('road') || prompt.includes('street') || prompt.includes('avenue') || prompt.includes('highway')) {
    intentType = "add_road";
    featureType = "road";
    featureSubtype = "local";
    geometryType = "linestring";
  } else if (prompt.includes('building') || prompt.includes('structure') || prompt.includes('tower')) {
    intentType = "add_building";
    featureType = "building";
    featureSubtype = "mixed_use";
    geometryType = "polygon";
  } else if (prompt.includes('water') || prompt.includes('lake') || prompt.includes('river') || prompt.includes('pond')) {
    intentType = "add_water_body";
    featureType = "water_body";
    featureSubtype = "lake";
    geometryType = "polygon";
  }
  
  // Determine size
  if (prompt.includes('large') || prompt.includes('big') || prompt.includes('huge') || prompt.includes('massive')) {
    size = "large";
  } else if (prompt.includes('small') || prompt.includes('tiny') || prompt.includes('little')) {
    size = "small";
  }
  
  // Determine location preference
  if (prompt.includes('center') || prompt.includes('central') || prompt.includes('middle')) {
    locationPreference = "center";
  } else if (prompt.includes('north') || prompt.includes('top')) {
    locationPreference = "north";
  } else if (prompt.includes('south') || prompt.includes('bottom')) {
    locationPreference = "south";
  } else if (prompt.includes('east') || prompt.includes('right')) {
    locationPreference = "east";
  } else if (prompt.includes('west') || prompt.includes('left')) {
    locationPreference = "west";
  }
  
  // Determine quantity
  if (prompt.includes('several') || prompt.includes('multiple') || prompt.includes('some')) {
    quantity = 3;
  } else if (prompt.includes('many') || prompt.includes('lots')) {
    quantity = 5;
  }
  
  return {
    intent: intentType,
    feature_type: featureType,
    feature_subtype: featureSubtype,
    size: size,
    location_preference: locationPreference,
    quantity: quantity,
    geometry_type: geometryType,
    constraints: [],
    priority: "medium"
  };
}

// Helper function to generate base placement coordinates
function getBasePlacement(locationPref, existingFeatures, iteration) {
  // Default city bounds
  const cityBounds = { minX: 0, maxX: 100, minY: 0, maxY: 100 };
  
  let baseX, baseY;
  
  // Base coordinates based on preference
  if (locationPref === "center") {
    baseX = Math.floor(cityBounds.maxX / 2) + Math.floor(Math.random() * 21) - 10; // ±10 range
    baseY = Math.floor(cityBounds.maxY / 2) + Math.floor(Math.random() * 21) - 10;
  } else if (locationPref === "north") {
    baseX = Math.floor(cityBounds.maxX / 2) + Math.floor(Math.random() * 41) - 20; // ±20 range
    baseY = Math.floor(cityBounds.maxY * 0.75) + Math.floor(Math.random() * 11) - 5;
  } else if (locationPref === "south") {
    baseX = Math.floor(cityBounds.maxX / 2) + Math.floor(Math.random() * 41) - 20;
    baseY = Math.floor(cityBounds.maxY * 0.25) + Math.floor(Math.random() * 11) - 5;
  } else if (locationPref === "east") {
    baseX = Math.floor(cityBounds.maxX * 0.75) + Math.floor(Math.random() * 11) - 5;
    baseY = Math.floor(cityBounds.maxY / 2) + Math.floor(Math.random() * 41) - 20;
  } else if (locationPref === "west") {
    baseX = Math.floor(cityBounds.maxX * 0.25) + Math.floor(Math.random() * 11) - 5;
    baseY = Math.floor(cityBounds.maxY / 2) + Math.floor(Math.random() * 41) - 20;
  } else {
    // Random placement
    baseX = Math.floor(Math.random() * (cityBounds.maxX - 20)) + 10;
    baseY = Math.floor(Math.random() * (cityBounds.maxY - 20)) + 10;
  }
  
  // Add offset for multiple features to avoid overlap
  if (iteration > 0) {
    baseX += iteration * 15;
    baseY += Math.floor(Math.random() * 11) - 5; // ±5 range
  }
  
  return [Math.floor(baseX), Math.floor(baseY)];
}

// Generate organic polygon for parks
function generateOrganicPolygon(center, size) {
  const points = [];
  const numPoints = Math.floor(Math.random() * 3) + 6; // 6-8 points
  const angleStep = 360 / numPoints;
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (i * angleStep + Math.floor(Math.random() * 41) - 20) * (Math.PI / 180); // ±20 degrees
    const radius = size + Math.floor(Math.random() * (size / 3 * 2 + 1)) - Math.floor(size / 3);
    const x = center[0] + Math.floor(radius * Math.cos(angle));
    const y = center[1] + Math.floor(radius * Math.sin(angle));
    points.push({ x, y });
  }
  
  // Close the polygon
  points.push(points[0]);
  return points;
}

// Generate rectangular polygon for buildings
function generateRectangularPolygon(center, size) {
  const width = size + Math.floor(Math.random() * 5) - 2; // ±2 variation
  const height = size + Math.floor(Math.random() * 5) - 2;
  
  return [
    { x: center[0] - Math.floor(width / 2), y: center[1] - Math.floor(height / 2) },
    { x: center[0] + Math.floor(width / 2), y: center[1] - Math.floor(height / 2) },
    { x: center[0] + Math.floor(width / 2), y: center[1] + Math.floor(height / 2) },
    { x: center[0] - Math.floor(width / 2), y: center[1] + Math.floor(height / 2) },
    { x: center[0] - Math.floor(width / 2), y: center[1] - Math.floor(height / 2) } // Close polygon
  ];
}

// Generate irregular polygon for zones
function generateZonePolygon(center, size) {
  const points = [];
  const numPoints = Math.floor(Math.random() * 3) + 5; // 5-7 points
  const angleStep = 360 / numPoints;
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (i * angleStep + Math.floor(Math.random() * 61) - 30) * (Math.PI / 180); // ±30 degrees
    const radius = size + Math.floor(Math.random() * size) - Math.floor(size / 2);
    const x = center[0] + Math.floor(radius * Math.cos(angle));
    const y = center[1] + Math.floor(radius * Math.sin(angle));
    points.push({ x, y });
  }
  
  // Close the polygon
  points.push(points[0]);
  return points;
}

// Generate water body polygon
function generateWaterPolygon(center, size) {
  const points = [];
  const numPoints = Math.floor(Math.random() * 5) + 8; // 8-12 points for smoother water body
  const angleStep = 360 / numPoints;
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (i * angleStep + Math.floor(Math.random() * 31) - 15) * (Math.PI / 180); // ±15 degrees
    const radius = size + Math.floor(Math.random() * (size / 4 * 2 + 1)) - Math.floor(size / 4);
    const x = center[0] + Math.floor(radius * Math.cos(angle));
    const y = center[1] + Math.floor(radius * Math.sin(angle));
    points.push({ x, y });
  }
  
  // Close the polygon
  points.push(points[0]);
  return points;
}

// Main coordinate generation function
function generateCoordinates(intent, existingFeatures = []) {
  const features = [];
  const quantity = intent.quantity || 1;
  
  // Size multipliers
  const sizeMultipliers = {
    "small": 0.5,
    "medium": 1.0,
    "large": 1.5,
    "extra_large": 2.0
  };
  const multiplier = sizeMultipliers[intent.size] || 1.0;
  
  for (let i = 0; i < quantity; i++) {
    const featureId = `${intent.feature_type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const featureType = intent.feature_type || "zone";
    const featureSubtype = intent.feature_subtype || "mixed_use";
    const geometryType = intent.geometry_type || "polygon";
    const size = intent.size || "medium";
    const locationPref = intent.location_preference || "center";
    
    // Base placement logic
    const baseCoords = getBasePlacement(locationPref, existingFeatures, i);
    
    let geometry;
    
    // Generate geometry based on type
    if (geometryType === "point") {
      geometry = {
        type: "point",
        coordinates: { x: baseCoords[0], y: baseCoords[1] }
      };
    } else if (geometryType === "linestring") {
      // Generate road/path coordinates
      const length = Math.floor(20 * multiplier);
      let coords;
      
      if (featureType === "road") {
        // Roads are typically straight or curved lines
        if (locationPref === "north" || locationPref === "south") {
          // Horizontal road
          coords = [
            { x: baseCoords[0] - Math.floor(length / 2), y: baseCoords[1] },
            { x: baseCoords[0] + Math.floor(length / 2), y: baseCoords[1] }
          ];
        } else {
          // Vertical road
          coords = [
            { x: baseCoords[0], y: baseCoords[1] - Math.floor(length / 2) },
            { x: baseCoords[0], y: baseCoords[1] + Math.floor(length / 2) }
          ];
        }
      } else {
        // Generic linestring
        coords = [
          { x: baseCoords[0], y: baseCoords[1] },
          { x: baseCoords[0] + length, y: baseCoords[1] + Math.floor(Math.random() * 11) - 5 }
        ];
      }
      
      geometry = {
        type: "linestring",
        coordinates: coords
      };
    } else { // polygon
      let coords;
      const sizeFactor = Math.floor(15 * multiplier);
      
      // Generate polygon coordinates based on feature type
      if (featureType === "park") {
        // Parks tend to be organic/rounded shapes
        coords = generateOrganicPolygon(baseCoords, sizeFactor);
      } else if (featureType === "building") {
        // Buildings are rectangular
        const buildingSizeFactor = Math.floor(8 * multiplier);
        coords = generateRectangularPolygon(baseCoords, buildingSizeFactor);
      } else if (featureType === "zone") {
        // Zones are larger irregular areas
        const zoneSizeFactor = Math.floor(25 * multiplier);
        coords = generateZonePolygon(baseCoords, zoneSizeFactor);
      } else if (featureType === "water_body") {
        // Water bodies are organic like parks but different shape
        const waterSizeFactor = Math.floor(20 * multiplier);
        coords = generateWaterPolygon(baseCoords, waterSizeFactor);
      } else {
        // Default rectangular polygon
        const defaultSizeFactor = Math.floor(12 * multiplier);
        coords = generateRectangularPolygon(baseCoords, defaultSizeFactor);
      }
      
      geometry = {
        type: "polygon",
        coordinates: [coords] // Array of rings
      };
    }
    
    // Create feature object compatible with CityPlanTypes
    const feature = {
      id: featureId,
      type: featureType,
      subtype: featureSubtype,
      name: `${featureSubtype.charAt(0).toUpperCase() + featureSubtype.slice(1)} ${featureType.charAt(0).toUpperCase() + featureType.slice(1)} ${i + 1}`,
      description: `AI-generated ${featureSubtype} ${featureType}`,
      geometry: geometry,
      metadata: {
        ai_generated: true,
        confidence: "high",
        detection_method: "api_planner_agent",
        size: size,
        location_preference: locationPref
      }
    };
    
    features.push(feature);
    // Add to existing features for next iteration placement
    existingFeatures.push(feature);
  }
  
  return features;
}

// Generate rationale for AI decisions
function generateRationale(intent, generatedFeatures) {
  let rationale = `Generated a ${intent.feature_subtype} ${intent.feature_type} based on your request. `;
  
  if (generatedFeatures.length > 1) {
    rationale = `Generated ${generatedFeatures.length} ${intent.feature_subtype} ${intent.feature_type}s based on your request. `;
  }
  
  if (intent.size === "large") {
    rationale += "Made it large as requested. ";
  } else if (intent.size === "small") {
    rationale += "Made it small as requested. ";
  }
  
  if (intent.location_preference !== "center") {
    rationale += `Placed in the ${intent.location_preference} area as specified. `;
  }
  
  rationale += "The placement follows urban planning principles for optimal city development.";
  
  return rationale;
}

module.exports = {
  classifyIntent,
  generateCoordinates,
  generateRationale,
};