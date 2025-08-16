const { WatsonXAI } = require("@ibm-cloud/watsonx-ai");
const { IamAuthenticator } = require("ibm-cloud-sdk-core");

class WatsonPlannerService {
  constructor() {
    this.watsonxAI = null;
    this.modelId = "ibm/granite-3-2-8b-instruct";
    this.projectId = process.env.WATSONX_PROJECT_ID;
    this.initialized = false;
  }

  // Spatial Analysis Utility Functions for Collision Detection
  
  /**
   * Calculate bounding box for any geometry type
   */
  calculateFeatureBounds(feature) {
    const coords = this.extractCoordinates(feature.geometry);
    if (coords.length === 0) return null;
    
    const bounds = coords.reduce(
      (acc, coord) => ({
        minX: Math.min(acc.minX, coord.x),
        maxX: Math.max(acc.maxX, coord.x),
        minY: Math.min(acc.minY, coord.y),
        maxY: Math.max(acc.maxY, coord.y),
      }),
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    );
    
    return bounds;
  }

  /**
   * Extract coordinates from geometry (similar to CityPlanUtils but for backend)
   */
  extractCoordinates(geometry) {
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

  /**
   * Calculate buffer zone around a feature based on its type and size
   */
  calculateBufferZone(feature) {
    const bufferSizes = {
      // Zone buffers (larger areas need larger buffers)
      zone: { residential: 10, commercial: 15, industrial: 25, mixed_use: 12, agricultural: 5, recreational: 8 },
      
      // Road buffers (based on road type)
      road: { highway: 20, primary: 15, secondary: 10, local: 5, pedestrian: 2, cycle: 3, rail: 15 },
      
      // Building buffers (minimum distance between buildings)
      building: { residential: 8, commercial: 10, industrial: 15, institutional: 12, mixed_use: 10, infrastructure: 12 },
      
      // Park buffers (smaller for most parks)
      park: { public: 5, private: 3, playground: 8, sports: 10, garden: 3, forest: 2, wetland: 5 },
      
      // Water body buffers (environmental protection)
      water_body: { lake: 15, river: 20, stream: 10, pond: 8, reservoir: 20, canal: 12, fountain: 5 },
      
      // Service buffers (accessibility and safety)
      service: { utility: 15, emergency: 12, education: 10, healthcare: 8, transport: 15, waste: 25, communication: 8 },
      
      // Architecture buffers (monument protection and visibility)
      architecture: { monument: 20, landmark: 15, bridge: 5, tower: 12, historic: 18, cultural: 10, religious: 12 }
    };

    const typeBuffers = bufferSizes[feature.type] || {};
    const buffer = typeBuffers[feature.subtype] || 10; // Default 10-unit buffer
    
    const bounds = this.calculateFeatureBounds(feature);
    if (!bounds) return null;

    return {
      minX: bounds.minX - buffer,
      maxX: bounds.maxX + buffer,
      minY: bounds.minY - buffer,
      maxY: bounds.maxY + buffer,
      bufferSize: buffer
    };
  }

  /**
   * Check if two bounding boxes overlap
   */
  checkBoundsOverlap(bounds1, bounds2) {
    if (!bounds1 || !bounds2) return false;
    
    return !(
      bounds1.maxX < bounds2.minX ||
      bounds2.maxX < bounds1.minX ||
      bounds1.maxY < bounds2.minY ||
      bounds2.maxY < bounds1.minY
    );
  }

  /**
   * Check if a new feature would collide with existing features
   */
  checkFeatureCollision(newFeatureBounds, existingFeatures) {
    const conflicts = [];
    
    for (const existingFeature of existingFeatures) {
      const existingBounds = this.calculateBufferZone(existingFeature);
      
      if (this.checkBoundsOverlap(newFeatureBounds, existingBounds)) {
        conflicts.push({
          feature: existingFeature,
          type: 'overlap',
          bounds: existingBounds
        });
      }
    }
    
    return conflicts;
  }

  /**
   * Find available spaces for feature placement
   */
  findAvailableSpaces(existingFeatures, blueprintDimensions, targetFeatureType) {
    const occupiedAreas = [];
    const exclusionZones = [];
    
    // Calculate all occupied areas with buffers
    existingFeatures.forEach(feature => {
      const bufferedBounds = this.calculateBufferZone(feature);
      if (bufferedBounds) {
        occupiedAreas.push({
          ...bufferedBounds,
          featureId: feature.id,
          featureType: feature.type,
          featureSubtype: feature.subtype
        });
      }
    });

    // Define conflict rules based on feature types
    const conflictRules = this.getConflictRules();
    
    // Add specific exclusions based on conflict rules
    existingFeatures.forEach(feature => {
      const rules = conflictRules[targetFeatureType] || {};
      const avoidTypes = rules.avoid || [];
      
      if (avoidTypes.includes(feature.type)) {
        const extraBuffer = rules.minimumDistance || 20;
        const bounds = this.calculateFeatureBounds(feature);
        if (bounds) {
          exclusionZones.push({
            minX: bounds.minX - extraBuffer,
            maxX: bounds.maxX + extraBuffer,
            minY: bounds.minY - extraBuffer,
            maxY: bounds.maxY + extraBuffer,
            reason: `Avoiding ${feature.type}:${feature.subtype}`,
            featureId: feature.id
          });
        }
      }
    });

    return {
      occupiedAreas,
      exclusionZones,
      availableSpace: this.calculateAvailableSpace(occupiedAreas, exclusionZones, blueprintDimensions)
    };
  }

  /**
   * Get conflict rules for different feature types
   */
  getConflictRules() {
    return {
      building: {
        avoid: ['water_body'],
        minimumDistance: 15,
        preferNear: ['road', 'service']
      },
      road: {
        avoid: ['water_body', 'building'],
        minimumDistance: 5,
        canIntersect: ['road']
      },
      park: {
        avoid: ['industrial_zone', 'water_body'],
        minimumDistance: 10,
        preferNear: ['residential_zone']
      },
      water_body: {
        avoid: ['building', 'road'],
        minimumDistance: 20,
        protectionBuffer: 25
      },
      service: {
        avoid: ['water_body'],
        minimumDistance: 12,
        preferNear: ['road', 'building']
      },
      architecture: {
        avoid: ['water_body'],
        minimumDistance: 15,
        preferNear: ['park', 'road']
      },
      zone: {
        avoid: ['water_body'],
        minimumDistance: 8,
        canOverlap: false
      }
    };
  }

  /**
   * Calculate available space after removing occupied and excluded areas
   */
  calculateAvailableSpace(occupiedAreas, exclusionZones, blueprintDimensions) {
    const totalOccupiedArea = [...occupiedAreas, ...exclusionZones];
    const availableRegions = [];
    
    // Simple grid-based approach for available space detection
    const gridSize = 10;
    const gridWidth = Math.ceil(blueprintDimensions.width / gridSize);
    const gridHeight = Math.ceil(blueprintDimensions.height / gridSize);
    
    for (let i = 0; i < gridWidth; i++) {
      for (let j = 0; j < gridHeight; j++) {
        const cellBounds = {
          minX: i * gridSize,
          maxX: (i + 1) * gridSize,
          minY: j * gridSize,
          maxY: (j + 1) * gridSize
        };
        
        // Check if this cell is free from conflicts
        const isOccupied = totalOccupiedArea.some(occupied => 
          this.checkBoundsOverlap(cellBounds, occupied)
        );
        
        if (!isOccupied) {
          availableRegions.push(cellBounds);
        }
      }
    }
    
    return availableRegions;
  }

  /**
   * Get spatially relevant features for placement context
   */
  getRelevantFeatures(existingFeatures, availableSpaces, intent) {
    if (availableSpaces.length === 0) return existingFeatures.slice(-5);
    
    // Find features near potential placement areas
    const relevantFeatures = [];
    const searchRadius = 50; // Units around available spaces
    
    availableSpaces.slice(0, 3).forEach(space => {
      const spaceBounds = {
        minX: space.minX - searchRadius,
        maxX: space.maxX + searchRadius,
        minY: space.minY - searchRadius,
        maxY: space.maxY + searchRadius
      };
      
      existingFeatures.forEach(feature => {
        const featureBounds = this.calculateFeatureBounds(feature);
        if (featureBounds && this.checkBoundsOverlap(spaceBounds, featureBounds)) {
          if (!relevantFeatures.find(f => f.id === feature.id)) {
            relevantFeatures.push(feature);
          }
        }
      });
    });
    
    return relevantFeatures.length > 0 ? relevantFeatures : existingFeatures.slice(-5);
  }

  /**
   * Generate collision avoidance rules text for AI prompt
   */
  generateCollisionAvoidanceRules(spatialAnalysis, conflictRules, featureType) {
    const rules = [];
    
    rules.push(`- NEVER place ${featureType} features on top of existing structures`);
    rules.push(`- Maintain minimum distances from other features based on their buffer zones`);
    
    if (conflictRules.avoid) {
      rules.push(`- AVOID placing near: ${conflictRules.avoid.join(', ')}`);
    }
    
    if (conflictRules.minimumDistance) {
      rules.push(`- Maintain minimum ${conflictRules.minimumDistance} units distance from conflict types`);
    }
    
    if (conflictRules.preferNear) {
      rules.push(`- PREFER placement near: ${conflictRules.preferNear.join(', ')}`);
    }
    
    rules.push(`- Use ONLY the RECOMMENDED PLACEMENT AREAS listed below`);
    rules.push(`- Verify coordinates do not overlap with OCCUPIED or EXCLUSION zones`);
    
    return rules.join('\n');
  }

  /**
   * Validate and adjust generated features to avoid collisions
   */
  validateAndAdjustFeatures(generatedFeatures, existingFeatures, blueprintDimensions) {
    const validatedFeatures = [];
    
    for (const feature of generatedFeatures) {
      try {
        // Check if feature is within blueprint bounds
        if (!this.isFeatureWithinBounds(feature, blueprintDimensions)) {
          console.warn(`⚠️ Feature ${feature.id} is outside blueprint bounds, adjusting...`);
          const adjustedFeature = this.adjustFeatureToBounds(feature, blueprintDimensions);
          feature.geometry = adjustedFeature.geometry;
          feature.metadata.adjusted = true;
          feature.metadata.adjustmentReason = "Moved within blueprint bounds";
        }
        
        // Check for collisions with existing features
        const featureBounds = this.calculateFeatureBounds(feature);
        const conflicts = this.checkFeatureCollision(featureBounds, existingFeatures);
        
        if (conflicts.length > 0) {
          console.warn(`⚠️ Feature ${feature.id} has ${conflicts.length} conflicts, attempting adjustment...`);
          
          // Try to find alternative placement
          const adjustedFeature = this.findAlternativePlacement(feature, existingFeatures, blueprintDimensions);
          
          if (adjustedFeature) {
            feature.geometry = adjustedFeature.geometry;
            feature.metadata.adjusted = true;
            feature.metadata.adjustmentReason = `Relocated to avoid conflicts with: ${conflicts.map(c => c.feature.id).join(', ')}`;
            feature.metadata.confidence = 'medium'; // Lower confidence for adjusted features
          } else {
            // If no alternative found, mark as problematic but include anyway
            feature.metadata.hasConflicts = true;
            feature.metadata.conflicts = conflicts.map(c => c.feature.id);
            feature.metadata.confidence = 'low';
            console.warn(`⚠️ Could not resolve conflicts for feature ${feature.id}`);
          }
        }
        
        validatedFeatures.push(feature);
        
      } catch (error) {
        console.error(`❌ Error validating feature ${feature.id}:`, error);
        // Include feature anyway but mark as problematic
        feature.metadata.validationError = error.message;
        feature.metadata.confidence = 'low';
        validatedFeatures.push(feature);
      }
    }
    
    console.log(`✅ Validated ${validatedFeatures.length} features, ${validatedFeatures.filter(f => f.metadata.adjusted).length} were adjusted`);
    return validatedFeatures;
  }

  /**
   * Check if feature is within blueprint bounds
   */
  isFeatureWithinBounds(feature, blueprintDimensions) {
    if (!blueprintDimensions) return true;
    
    const bounds = this.calculateFeatureBounds(feature);
    if (!bounds) return false;
    
    return (
      bounds.minX >= 0 &&
      bounds.maxX <= blueprintDimensions.width &&
      bounds.minY >= 0 &&
      bounds.maxY <= blueprintDimensions.height
    );
  }

  /**
   * Adjust feature to fit within blueprint bounds
   */
  adjustFeatureToBounds(feature, blueprintDimensions) {
    const bounds = this.calculateFeatureBounds(feature);
    if (!bounds || !blueprintDimensions) return feature;
    
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    
    // Calculate offset needed to fit within bounds
    let offsetX = 0;
    let offsetY = 0;
    
    if (bounds.minX < 0) offsetX = -bounds.minX + 5; // 5 unit margin
    if (bounds.maxX > blueprintDimensions.width) offsetX = blueprintDimensions.width - bounds.maxX - 5;
    if (bounds.minY < 0) offsetY = -bounds.minY + 5;
    if (bounds.maxY > blueprintDimensions.height) offsetY = blueprintDimensions.height - bounds.maxY - 5;
    
    // Apply offset to all coordinates
    const adjustedFeature = JSON.parse(JSON.stringify(feature)); // Deep copy
    this.offsetFeatureCoordinates(adjustedFeature, offsetX, offsetY);
    
    return adjustedFeature;
  }

  /**
   * Offset all coordinates in a feature by given amounts
   */
  offsetFeatureCoordinates(feature, offsetX, offsetY) {
    switch (feature.geometry.type) {
      case 'point':
        feature.geometry.coordinates.x += offsetX;
        feature.geometry.coordinates.y += offsetY;
        break;
      case 'linestring':
        feature.geometry.coordinates.forEach(coord => {
          coord.x += offsetX;
          coord.y += offsetY;
        });
        break;
      case 'polygon':
        feature.geometry.coordinates.forEach(ring => {
          ring.forEach(coord => {
            coord.x += offsetX;
            coord.y += offsetY;
          });
        });
        break;
    }
  }

  /**
   * Find alternative placement for a feature to avoid conflicts
   */
  findAlternativePlacement(feature, existingFeatures, blueprintDimensions) {
    if (!blueprintDimensions) return null;
    
    const featureBounds = this.calculateFeatureBounds(feature);
    if (!featureBounds) return null;
    
    const featureWidth = featureBounds.maxX - featureBounds.minX;
    const featureHeight = featureBounds.maxY - featureBounds.minY;
    
    // Try different positions in a grid pattern
    const gridSize = 20;
    const maxAttempts = 25;
    let attempts = 0;
    
    for (let x = 10; x <= blueprintDimensions.width - featureWidth - 10 && attempts < maxAttempts; x += gridSize) {
      for (let y = 10; y <= blueprintDimensions.height - featureHeight - 10 && attempts < maxAttempts; y += gridSize) {
        attempts++;
        
        // Create test feature at this position
        const testFeature = JSON.parse(JSON.stringify(feature));
        const offsetX = x - featureBounds.minX;
        const offsetY = y - featureBounds.minY;
        
        this.offsetFeatureCoordinates(testFeature, offsetX, offsetY);
        
        // Check if this position has conflicts
        const testBounds = this.calculateFeatureBounds(testFeature);
        const conflicts = this.checkFeatureCollision(testBounds, existingFeatures);
        
        if (conflicts.length === 0) {
          console.log(`✅ Found alternative placement for feature at (${x}, ${y})`);
          return testFeature;
        }
      }
    }
    
    console.warn(`❌ Could not find alternative placement after ${attempts} attempts`);
    return null;
  }

  async initialize() {
    if (this.initialized) return;

    // Validate required environment variables (IBM SDK standard format)
    if (!process.env.WATSONX_API_KEY) {
      throw new Error("WATSONX_API_KEY environment variable is required");
    }

    if (!process.env.WATSONX_PROJECT_ID) {
      throw new Error("WATSONX_PROJECT_ID environment variable is required");
    }

    // Set IBM SDK expected auth type if not set
    if (!process.env.WATSONX_AI_AUTH_TYPE) {
      process.env.WATSONX_AI_AUTH_TYPE = "iam";
    }

    try {
      // IBM SDK auto-configures authentication from environment variables
      this.watsonxAI = WatsonXAI.newInstance({
        version: "2024-05-31",
        serviceUrl:
          process.env.WATSONX_URL || "https://us-south.ml.cloud.ibm.com",
        apiKey: process.env.WATSONX_API_KEY,
        authenticator: new IamAuthenticator({
          apikey: process.env.WATSONX_API_KEY,
        }),
      });

      this.initialized = true;
      console.log("✅ Watson AI service initialized successfully");
      console.log(`🤖 Using model: ${this.modelId}`);
      console.log(`🏗️ Project ID: ${this.projectId}`);
      console.log(`🔐 Auth Type: ${process.env.WATSONX_AI_AUTH_TYPE}`);

      // Optional: Test connection with a simple request
      try {
        const testParams = {
          input: "Test",
          modelId: this.modelId,

          projectId: this.projectId,
          parameters: {
            max_new_tokens: 5,
            temperature: 0.1,
          },
        };

        const testResponse = await this.watsonxAI.generateText(testParams);
        console.log("🧪 Watson AI connection test successful");
      } catch (testError) {
        console.log(
          "⚠️ Watson AI connection test failed, but service initialized:",
          testError.message
        );
        // Don't throw here - service might still work for actual requests
      }
    } catch (error) {
      console.error("❌ Failed to initialize Watson AI service:", error);
      console.error(
        "💡 Make sure these environment variables are set correctly:"
      );
      console.error("   WATSONX_AI_AUTH_TYPE=iam");
      console.error("   WATSONX_API_KEY=<your_ibm_cloud_api_key>");
      console.error("   WATSONX_PROJECT_ID=<your_watsonx_project_id>");
      throw new Error(`Watson AI initialization failed: ${error.message}`);
    }
  }

  async classifyIntent(
    userPrompt,
    existingFeatures = [],
    projectConstraints = {},
    blueprintDimensions = null
  ) {
    await this.initialize();

    const prompt = `You are an expert urban planner AI assistant. Analyze the user's request and extract urban planning intent.

USER REQUEST: "${userPrompt}"

EXISTING CITY FEATURES: ${JSON.stringify(
      existingFeatures.map((f) => ({
        type: f.type,
        subtype: f.subtype,
        location: f.geometry,
      })),
      null,
      2
    )}

PROJECT CONSTRAINTS: ${JSON.stringify(projectConstraints, null, 2)}

${blueprintDimensions ? `BLUEPRINT BOUNDS: ${blueprintDimensions.width} x ${blueprintDimensions.height} ${blueprintDimensions.unit}
Coordinate Range: X(0 to ${blueprintDimensions.width}), Y(0 to ${blueprintDimensions.height}) - Bottom-left origin (0,0)` : 'No blueprint bounds defined'}

FEATURE TYPE GUIDELINES:
- zone: Large areas for specific land uses (residential, commercial, industrial, mixed_use, agricultural, recreational)
- road: Transportation infrastructure (highway, primary, secondary, local, pedestrian, cycle, rail)
- building: Individual structures (residential, commercial, industrial, institutional, mixed_use, infrastructure)
- park: Recreation and green spaces (public, private, playground, sports, garden, forest, wetland)
- water_body: Water features (lake, river, stream, pond, reservoir, canal, fountain)
- service: Public services and utilities (utility, emergency, education, healthcare, transport, waste, communication)
- architecture: Special structures and landmarks (monument, landmark, bridge, tower, historic, cultural, religious)

INTENT CLASSIFICATION RULES:
- "add_zone" for large area designations (neighborhoods, districts)
- "add_road" for transportation routes (streets, highways, paths)
- "add_building" for individual structures (houses, offices, schools)
- "add_park" for recreational and green spaces
- "add_water_body" for water features and bodies
- "add_service" for public utilities and community services
- "add_architecture" for monuments, landmarks, and special structures
- "modify_existing" for changes to current features
- "remove_feature" for deletion requests
- "get_recommendations" for advice and suggestions
- "analyze_area" for assessment requests

Please analyze the request and respond with a JSON object containing:
{
  "intent": "add_zone|add_road|add_building|add_park|add_water_body|add_service|add_architecture|modify_existing|remove_feature|get_recommendations|analyze_area",
  "feature_type": "zone|road|building|park|water_body|service|architecture",
  "feature_subtype": "residential|commercial|industrial|mixed_use|agricultural|recreational|highway|primary|secondary|local|pedestrian|cycle|rail|institutional|infrastructure|public|private|playground|sports|garden|forest|wetland|lake|river|stream|pond|reservoir|canal|fountain|utility|emergency|education|healthcare|transport|waste|communication|monument|landmark|bridge|tower|historic|cultural|religious",
  "size": "small|medium|large|extra_large",
  "location_preference": "center|north|south|east|west|near_X|avoid_Y|random|optimal",
  "quantity": number,
  "geometry_type": "point|linestring|polygon",
  "constraints": ["sustainability", "accessibility", "cost_effective", "traffic_flow", "environmental_impact", "zoning_compliance", "budget_friendly", "community_benefit"],
  "priority": "low|medium|high|critical",
  "reasoning": "explanation of urban planning decisions and rationale",
  "considerations": ["traffic flow", "environmental impact", "zoning regulations", "accessibility", "sustainability", "community needs", "infrastructure compatibility", "future expansion", "cost implications", "safety requirements"]
}

Focus on urban planning best practices, sustainability, and optimal city development.`;

    try {
      const params = {
        input: prompt,
        modelId: this.modelId,
        projectId: this.projectId,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.3,
          top_p: 0.9,
          repetition_penalty: 1.1,
          stop_sequences: ["\n\n"],
        },
      };

      const response = await this.watsonxAI.generateText(params);
      const generatedText = response.result.results[0].generated_text.trim();

      // Parse JSON response from AI
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const intentData = JSON.parse(jsonMatch[0]);
        console.log("🧠 Watson AI Intent Classification:", intentData);
        return intentData;
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    } catch (error) {
      console.error("❌ Watson intent classification failed:", error);
      // Fallback to basic intent structure
      return this.getFallbackIntent(userPrompt);
    }
  }

  async generateFeatureLayout(intent, cityContext, existingFeatures = [], blueprintDimensions = null) {
    await this.initialize();

    // Perform spatial analysis for collision detection
    const spatialAnalysis = this.findAvailableSpaces(existingFeatures, blueprintDimensions, intent.feature_type);
    const conflictRules = this.getConflictRules()[intent.feature_type] || {};
    
    console.log(`🔍 Spatial Analysis for ${intent.feature_type}:`);
    console.log(`   - Found ${spatialAnalysis.occupiedAreas.length} occupied areas`);
    console.log(`   - Found ${spatialAnalysis.exclusionZones.length} exclusion zones`);
    console.log(`   - Found ${spatialAnalysis.availableSpace.length} available placement areas`);
    
    // Get spatially relevant features (not just last 10)
    const relevantFeatures = this.getRelevantFeatures(existingFeatures, spatialAnalysis.availableSpace, intent);
    console.log(`   - ${relevantFeatures.length} spatially relevant features identified`);

    const prompt = `You are an expert urban planner AI. Generate optimal coordinates and layout for city features.

INTENT: ${JSON.stringify(intent, null, 2)}

CITY CONTEXT: ${JSON.stringify(cityContext, null, 2)}

SPATIALLY RELEVANT FEATURES: ${JSON.stringify(relevantFeatures, null, 2)}

${blueprintDimensions ? `BLUEPRINT CONSTRAINTS:
- Width: ${blueprintDimensions.width} ${blueprintDimensions.unit}
- Height: ${blueprintDimensions.height} ${blueprintDimensions.unit}
- X coordinate range: 0 to ${blueprintDimensions.width}
- Y coordinate range: 0 to ${blueprintDimensions.height}
- Bottom-left origin at (0,0), all coordinates are positive
- ALL coordinates MUST be within these bounds` : 'No blueprint constraints defined'}

COLLISION AVOIDANCE - CRITICAL REQUIREMENTS:
${this.generateCollisionAvoidanceRules(spatialAnalysis, conflictRules, intent.feature_type)}

OCCUPIED AREAS - DO NOT PLACE FEATURES IN THESE ZONES:
${spatialAnalysis.occupiedAreas.length > 0 
  ? spatialAnalysis.occupiedAreas.map(area => 
      `- OCCUPIED: X(${area.minX.toFixed(1)} to ${area.maxX.toFixed(1)}), Y(${area.minY.toFixed(1)} to ${area.maxY.toFixed(1)}) - ${area.featureType}:${area.featureSubtype}`
    ).join('\n')
  : '- No occupied areas identified (empty city plan)'}

EXCLUSION ZONES - AVOID THESE AREAS:
${spatialAnalysis.exclusionZones.length > 0
  ? spatialAnalysis.exclusionZones.map(zone => 
      `- AVOID: X(${zone.minX.toFixed(1)} to ${zone.maxX.toFixed(1)}), Y(${zone.minY.toFixed(1)} to ${zone.maxY.toFixed(1)}) - ${zone.reason}`
    ).join('\n')
  : '- No exclusion zones identified'}

RECOMMENDED PLACEMENT AREAS:
${spatialAnalysis.availableSpace.length > 0
  ? spatialAnalysis.availableSpace.slice(0, 10).map(area => 
      `- AVAILABLE: X(${area.minX.toFixed(1)} to ${area.maxX.toFixed(1)}), Y(${area.minY.toFixed(1)} to ${area.maxY.toFixed(1)})`
    ).join('\n')
  : `- ENTIRE BLUEPRINT AVAILABLE: X(0 to ${blueprintDimensions?.width || 100}), Y(0 to ${blueprintDimensions?.height || 100})`}

COORDINATE SYSTEM: Bottom-left origin (0,0) with all positive coordinates within blueprint bounds

Generate ${
      intent.quantity || 1
    } feature(s) following urban planning principles. Consider:
- Optimal placement based on existing infrastructure
- Traffic flow and accessibility
- Environmental impact and sustainability
- Zoning regulations and land use efficiency
- Proximity to complementary features
- Avoiding conflicts with existing structures

Respond with a JSON array of features:
[
  {
    "id": "unique_id",
    "type": "${intent.feature_type}",
    "subtype": "${intent.feature_subtype}",
    "name": "descriptive name",
    "description": "AI reasoning for this placement",
    "geometry": {
      "type": "${intent.geometry_type}",
      "coordinates": coordinate_data_based_on_geometry_type
    },
    "metadata": {
      "ai_generated": true,
      "confidence": "high|medium|low",
      "detection_method": "watsonx_ai",
      "size": "${intent.size}",
      "location_preference": "${intent.location_preference}",
      "urban_planning_score": number_0_to_100,
      "reasoning": "detailed placement reasoning"
    }
  }
]

For geometry coordinates:
- point: {"x": number, "y": number}
- linestring: [{"x": number, "y": number}, ...]
- polygon: [[{"x": number, "y": number}, ...]] (array of rings)

Ensure realistic sizes and shapes appropriate for the feature type.`;

    try {
      const params = {
        input: prompt,
        modelId: this.modelId,
        projectId: this.projectId,
        parameters: {
          max_new_tokens: 1000,
          temperature: 0.4,
          top_p: 0.9,
          repetition_penalty: 1.1,
        },
      };

      console.log("🤖 Watson AI Feature Generation:", params);

      const response = await this.watsonxAI.generateText(params);
      const generatedText = response.result.results[0].generated_text.trim();

      console.log("🤖 Watson AI Feature Generation Response:", response);
      // Parse JSON response from AI
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const features = JSON.parse(jsonMatch[0]);
        console.log(`🏗️ Watson AI Generated ${features.length} features`);
        
        // Post-generation validation for collision detection
        const validatedFeatures = this.validateAndAdjustFeatures(features, existingFeatures, blueprintDimensions);
        
        return validatedFeatures;
      } else {
        throw new Error("Failed to parse AI response as JSON array");
      }
    } catch (error) {
      console.error("❌ Watson feature generation failed:", error);
      // Fallback to basic feature generation
      return this.getFallbackFeatures(intent);
    }
  }

  async generateRationale(intent, generatedFeatures, cityContext) {
    await this.initialize();

    // Extract key placement info for concise rationale
    const featureCount = generatedFeatures.length;
    const featureType = intent.feature_type;
    const featureSubtype = intent.feature_subtype;
    
    const prompt = `You are an urban planner. Give a brief justification for this placement decision.

FEATURE: ${featureCount} ${featureSubtype} ${featureType}(s)
LOCATION: ${generatedFeatures.map(f => {
      if (f.geometry.type === 'point') {
        return `(${f.geometry.coordinates.x}, ${f.geometry.coordinates.y})`;
      } else if (f.geometry.type === 'polygon') {
        const coords = f.geometry.coordinates[0];
        const centerX = coords.reduce((sum, c) => sum + c.x, 0) / coords.length;
        const centerY = coords.reduce((sum, c) => sum + c.y, 0) / coords.length;
        return `(${centerX.toFixed(0)}, ${centerY.toFixed(0)})`;
      }
      return 'area';
    }).join(', ')}

Respond with ONE short sentence explaining why this placement makes sense.
Format: "Placed [feature] [location] for [simple reason]."
Keep it under 15 words. Focus on ONE key benefit: accessibility, safety, proximity, or efficiency.`;

    try {
      const params = {
        input: prompt,
        modelId: this.modelId,
        projectId: this.projectId,
        parameters: {
          max_new_tokens: 50, // Reduced from 300 to force brevity
          temperature: 0.3,   // Lower temperature for more predictable, concise responses
          top_p: 0.8,
          stop_sequences: ["."], // Stop after first sentence
        },
      };

      const response = await this.watsonxAI.generateText(params);
      let rationale = response.result.results[0].generated_text.trim();

      // Clean up the response to ensure it's concise
      rationale = rationale.split('.')[0] + '.'; // Take only first sentence
      rationale = rationale.replace(/^\s*-\s*/, ''); // Remove bullet points
      rationale = rationale.replace(/^.*?:/,'').trim(); // Remove any prefix labels
      
      // Ensure it starts with a capital letter
      if (rationale.length > 0) {
        rationale = rationale.charAt(0).toUpperCase() + rationale.slice(1);
      }

      console.log("📝 Watson AI Generated Rationale:", rationale);
      return rationale;
    } catch (error) {
      console.error("❌ Watson rationale generation failed:", error);
      return this.getFallbackRationale(intent, generatedFeatures);
    }
  }

  // Fallback methods for when Watson AI fails
  getFallbackIntent(userPrompt) {
    const prompt = userPrompt.toLowerCase();

    let intent = "get_recommendations";
    let feature_type = "zone";
    let feature_subtype = "mixed_use";

    // Zone classification
    if (prompt.includes("residential") || prompt.includes("housing") || prompt.includes("homes")) {
      intent = "add_zone";
      feature_type = "zone";
      feature_subtype = "residential";
    } else if (prompt.includes("commercial") || prompt.includes("business") || prompt.includes("shop")) {
      intent = "add_zone";
      feature_type = "zone";
      feature_subtype = "commercial";
    } else if (prompt.includes("industrial") || prompt.includes("factory") || prompt.includes("manufacturing")) {
      intent = "add_zone";
      feature_type = "zone";
      feature_subtype = "industrial";
    } else if (prompt.includes("mixed") || prompt.includes("mixed use")) {
      intent = "add_zone";
      feature_type = "zone";
      feature_subtype = "mixed_use";
    }
    
    // Road classification
    else if (prompt.includes("highway") || prompt.includes("freeway")) {
      intent = "add_road";
      feature_type = "road";
      feature_subtype = "highway";
    } else if (prompt.includes("road") || prompt.includes("street") || prompt.includes("avenue")) {
      intent = "add_road";
      feature_type = "road";
      feature_subtype = "local";
    } else if (prompt.includes("pedestrian") || prompt.includes("walking") || prompt.includes("sidewalk")) {
      intent = "add_road";
      feature_type = "road";
      feature_subtype = "pedestrian";
    }
    
    // Building classification
    else if (prompt.includes("building") || prompt.includes("house") || prompt.includes("office")) {
      intent = "add_building";
      feature_type = "building";
      feature_subtype = prompt.includes("house") ? "residential" : 
                       prompt.includes("office") ? "commercial" : "institutional";
    }
    
    // Park classification
    else if (prompt.includes("park") || prompt.includes("green") || prompt.includes("garden")) {
      intent = "add_park";
      feature_type = "park";
      feature_subtype = prompt.includes("sports") ? "sports" : 
                       prompt.includes("playground") ? "playground" : "public";
    }
    
    // Water body classification
    else if (prompt.includes("lake") || prompt.includes("pond") || prompt.includes("water")) {
      intent = "add_water_body";
      feature_type = "water_body";
      feature_subtype = prompt.includes("lake") ? "lake" : 
                       prompt.includes("river") ? "river" : "pond";
    }
    
    // Service classification
    else if (prompt.includes("hospital") || prompt.includes("clinic") || prompt.includes("healthcare")) {
      intent = "add_service";
      feature_type = "service";
      feature_subtype = "healthcare";
    } else if (prompt.includes("school") || prompt.includes("university") || prompt.includes("education")) {
      intent = "add_service";
      feature_type = "service";
      feature_subtype = "education";
    } else if (prompt.includes("police") || prompt.includes("fire") || prompt.includes("emergency")) {
      intent = "add_service";
      feature_type = "service";
      feature_subtype = "emergency";
    } else if (prompt.includes("utility") || prompt.includes("power") || prompt.includes("water")) {
      intent = "add_service";
      feature_type = "service";
      feature_subtype = "utility";
    }
    
    // Architecture classification
    else if (prompt.includes("monument") || prompt.includes("statue") || prompt.includes("memorial")) {
      intent = "add_architecture";
      feature_type = "architecture";
      feature_subtype = "monument";
    } else if (prompt.includes("bridge") || prompt.includes("overpass")) {
      intent = "add_architecture";
      feature_type = "architecture";
      feature_subtype = "bridge";
    } else if (prompt.includes("landmark") || prompt.includes("tower")) {
      intent = "add_architecture";
      feature_type = "architecture";
      feature_subtype = "landmark";
    } else if (prompt.includes("historic") || prompt.includes("heritage")) {
      intent = "add_architecture";
      feature_type = "architecture";
      feature_subtype = "historic";
    }

    return {
      intent,
      feature_type,
      feature_subtype,
      size: prompt.includes("large") ? "large" : "medium",
      location_preference: "center",
      quantity: 1,
      geometry_type: feature_type === "road" ? "linestring" : "polygon",
      constraints: [],
      priority: "medium",
      reasoning: "Fallback classification due to AI service unavailability",
    };
  }

  getFallbackFeatures(intent) {
    // Determine appropriate geometry type based on feature type
    let geometryType = intent.geometry_type;
    if (!geometryType) {
      switch (intent.feature_type) {
        case 'road':
          geometryType = 'linestring';
          break;
        case 'service':
        case 'architecture':
          geometryType = intent.feature_subtype === 'bridge' ? 'linestring' : 'point';
          break;
        default:
          geometryType = 'polygon';
      }
    }

    // Generate appropriate coordinates based on geometry type
    let coordinates;
    switch (geometryType) {
      case 'point':
        coordinates = { x: 50, y: 50 };
        break;
      case 'linestring':
        coordinates = [
          { x: 30, y: 50 },
          { x: 70, y: 50 }
        ];
        break;
      case 'polygon':
      default:
        coordinates = [
          [
            { x: 25, y: 25 },
            { x: 75, y: 25 },
            { x: 75, y: 75 },
            { x: 25, y: 75 },
            { x: 25, y: 25 },
          ]
        ];
    }

    const feature = {
      id: `${intent.feature_type}_${Date.now()}_fallback`,
      type: intent.feature_type,
      subtype: intent.feature_subtype,
      name: `${intent.feature_subtype} ${intent.feature_type}`,
      description: "Fallback feature generated due to AI service unavailability",
      geometry: {
        type: geometryType,
        coordinates,
      },
      metadata: {
        ai_generated: false,
        confidence: "low",
        detection_method: "fallback",
        size: intent.size,
        reasoning: "Generated using fallback method due to AI service unavailability",
      },
    };

    return [feature];
  }

  getFallbackRationale(intent, generatedFeatures) {
    // Generate simple, concise fallback rationale
    const count = generatedFeatures.length;
    const type = intent.feature_subtype || intent.feature_type;
    
    const reasons = [
      'for optimal city layout',
      'near existing infrastructure', 
      'for easy accessibility',
      'in available space',
      'for efficient placement'
    ];
    
    const randomReason = reasons[Math.floor(Math.random() * reasons.length)];
    return `Added ${count} ${type}${count > 1 ? 's' : ''} ${randomReason}.`;
  }
}

module.exports = new WatsonPlannerService();
