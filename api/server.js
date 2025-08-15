// server.js  api
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs-extra");
const path = require("path");
require("dotenv").config();
const { pool, initializeDatabase } = require("./database");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 5010;
const JWT_SECRET = process.env.JWT_SECRET || "secret-key";

// Initialize Supabase client for storage (needs service role for uploads)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(express.json());
app.use(cors());

// Configure multer for file uploads (memory storage for Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "application/pdf",
      "application/json",
      "application/octet-stream", // For .geojson and .dxf files
      "text/plain", // For some .json files
    ];

    const allowedExtensions = [
      ".png",
      ".jpg",
      ".jpeg",
      ".pdf",
      ".json",
      ".geojson",
      ".dxf",
    ];
    const fileExt = path.extname(file.originalname).toLowerCase();

    if (
      allowedTypes.includes(file.mimetype) ||
      allowedExtensions.includes(fileExt)
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported file type: ${
            file.mimetype
          }. Supported: ${allowedExtensions.join(", ")}`
        ),
        false
      );
    }
  },
});

// Parser service configuration - HTTP calls to parser server
const PARSER_SERVICE_URL = process.env.PARSER_SERVICE_URL || "http://localhost:8003";

// ========== PLANNER AGENT LOGIC - MIGRATED FROM PYTHON ==========

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

// Helper function to call parser service via HTTP using Supabase URL
async function callParserService(supabaseFilePath) {
  try {
    // Get public URL from Supabase
    const { data: urlData } = supabase.storage
      .from("temporary-storage")
      .getPublicUrl(supabaseFilePath);

    if (!urlData.publicUrl) {
      throw new Error("Failed to get public URL from Supabase");
    }

    // Extract original filename from supabase path
    const originalFilename = path.basename(supabaseFilePath);
    
    // Prepare request payload
    const requestPayload = {
      file_url: urlData.publicUrl,
      filename: originalFilename
    };

    // Make HTTP request to parser service
    const fetch = require('node-fetch');
    const response = await fetch(`${PARSER_SERVICE_URL}/parse/url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Parser service error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    
    // Return in the expected format
    return {
      success: result.success,
      parsed_data: result.parsed_data,
      filename: result.filename,
      file_size: result.file_size,
      file_type: result.file_type
    };

  } catch (error) {
    console.error("Error calling parser service:", error);
    throw error;
  }
}

// email validators
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Database functions
const getUserByEmail = async (email) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return result.rows[0];
};

const createUser = async (email, password, name) => {
  const result = await pool.query(
    "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING *",
    [email, password, name]
  );
  return result.rows[0];
};

const createProject = async (
  name,
  description,
  cityType,
  constraints,
  userId,
  cityData
) => {
  const result = await pool.query(
    "INSERT INTO projects (name, description, city_type, constraints, created_by, city_data) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [
      name,
      description,
      cityType,
      JSON.stringify(constraints),
      userId,
      JSON.stringify(cityData),
    ]
  );
  return result.rows[0];
};

const getUserProjects = async (userId) => {
  const result = await pool.query(
    "SELECT * FROM projects WHERE created_by = $1 ORDER BY created_at DESC",
    [userId]
  );
  return result.rows;
};

const deleteProject = async (projectId, userId) => {
  const result = await pool.query(
    "DELETE FROM projects WHERE id = $1 AND created_by = $2 RETURNING *",
    [projectId, userId]
  );
  return result.rows[0];
};

// JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: "1hr" }
  );
};

// Middleware for --->JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Access token required",
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          error: "Token expired",
        });
      }
      return res.status(403).json({
        success: false,
        error: "Invalid token",
      });
    }
    req.user = user;
    next();
  });
};

// Routes

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "City Planner API",
    timestamp: new Date().toISOString(),
  });
});

// Register new user
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Input validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: "Email, password, and name are required",
      });
    }

    // Email validation
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    // Password strength check
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long",
      });
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email.toLowerCase().trim());
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "User already exists with this email",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database
    const newUser = await createUser(
      email.toLowerCase().trim(),
      hashedPassword,
      name.trim()
    );

    // Generate token
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during registration",
    });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Email validation
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    // Find user in database
    const user = await getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during login",
    });
  }
});

// Get current user profile
app.get("/api/auth/profile", authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
    },
  });
});

// Logout (simplified - just for consistency)
app.post("/api/auth/logout", (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

// protected routes  yaha se

// Initialize city project (aligns with hackathon plan)
app.post("/api/init-city", authenticateToken, async (req, res) => {
  const { name, description, cityType, constraints } = req.body;

  // Input validation
  if (!name) {
    return res.status(400).json({
      success: false,
      error: "City project name is required",
    });
  }

  // Initial city data structure
  const cityData = {
    zones: [],
    infrastructure: [],
    population: 0,
    area: constraints?.area || 1000,
    budget: constraints?.budget || 5000000,
  };

  // Create new city project in database
  const cityProject = await createProject(
    name.trim(),
    description?.trim() || "",
    cityType || "new",
    constraints || {},
    req.user.id,
    cityData
  );

  console.log("New city project created:", cityProject);

  res.status(201).json({
    success: true,
    message: "City project initialized successfully",
    project: cityProject,
  });
});

// AI Agent prompt endpoint - integrated planner agent logic
app.post("/api/prompt", authenticateToken, async (req, res) => {
  const { message, projectId, context } = req.body;

  // Input validation
  if (!message || !projectId) {
    return res.status(400).json({
      success: false,
      error: "Message and projectId are required",
    });
  }

  try {
    // Get current project data to provide context to planner agent
    const projectResult = await pool.query(
      "SELECT * FROM projects WHERE id = $1 AND created_by = $2",
      [parseInt(projectId), req.user.id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found or access denied",
      });
    }

    const project = projectResult.rows[0];
    
    // Parse existing city_data to extract features for context
    let existingFeatures = [];
    let cityData = {};
    try {
      cityData = typeof project.city_data === 'string' 
        ? JSON.parse(project.city_data || '{}') 
        : project.city_data || {};
      
      // Extract features from city data if they exist
      if (cityData.features) {
        existingFeatures = cityData.features;
      }
    } catch (e) {
      console.log("Could not parse existing city data:", e.message);
      cityData = {};
    }

    // ========== DIRECT PLANNER AGENT PROCESSING ==========
    
    // Step 1: Classify user intent
    const intent = classifyIntent(message);
    console.log(`Classified intent:`, intent);
    
    // Step 2: Generate actual city features with coordinates
    let generatedFeatures = [];
    if (intent.intent !== "unknown" && intent.intent !== "get_recommendations") {
      generatedFeatures = generateCoordinates(intent, existingFeatures);
      console.log(`Generated ${generatedFeatures.length} features`);
    }
    
    // Step 3: Generate rationale for the AI decisions
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

    // Step 4: Update project with new features if generated
    if (generatedFeatures.length > 0) {
      const updatedCityData = {
        ...cityData,
        features: [...existingFeatures, ...generatedFeatures]
      };

      // Save updated city data back to database
      await pool.query(
        "UPDATE projects SET city_data = $1 WHERE id = $2 AND created_by = $3",
        [JSON.stringify(updatedCityData), parseInt(projectId), req.user.id]
      );

      console.log(`Added ${generatedFeatures.length} new features to project ${projectId}`);
    }

    // Format response for frontend
    const agentResponse = {
      id: Date.now(),
      user_prompt: message,
      project_id: parseInt(projectId),
      agent_response: rationale,
      reasoning: rationale,
      generated_features: generatedFeatures,
      features_added: generatedFeatures.length,
      status: "completed",
      timestamp: new Date().toISOString(),
      processed_by: req.user.id,
      session_id: `user_${req.user.id}_project_${projectId}`,
      intent_classified: intent
    };

    // Log for monitoring
    console.log("AI Agent request processed:", {
      user: req.user.email,
      prompt: message,
      project: projectId,
      features_generated: agentResponse.features_added,
      intent: intent.intent,
      feature_type: intent.feature_type
    });

    res.json({
      success: true,
      message: "AI agent processed request successfully",
      response: agentResponse,
    });

  } catch (error) {
    console.error("AI Agent processing error:", error);
    
    // Fallback response if processing fails
    const fallbackResponse = {
      id: Date.now(),
      user_prompt: message,
      project_id: parseInt(projectId),
      agent_response: "I apologize, but I encountered an issue processing your request. Please try again.",
      reasoning: "An error occurred during feature generation.",
      generated_features: [],
      features_added: 0,
      status: "error",
      timestamp: new Date().toISOString(),
      processed_by: req.user.id,
      error: error.message
    };

    res.status(500).json({
      success: false,
      message: "AI agent processing failed",
      response: fallbackResponse,
    });
  }
});

// Get city projects for current user
app.get("/api/projects", authenticateToken, async (req, res) => {
  try {
    const projects = await getUserProjects(req.user.id);

    res.json({
      success: true,
      projects: projects,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch projects",
    });
  }
});

// Delete a project
app.delete("/api/projects/:projectId", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: "Project ID is required",
      });
    }

    const deletedProject = await deleteProject(parseInt(projectId), req.user.id);

    if (!deletedProject) {
      return res.status(404).json({
        success: false,
        error: "Project not found or you don't have permission to delete it",
      });
    }

    console.log(`Project ${projectId} deleted by ${req.user.email}`);

    res.json({
      success: true,
      message: "Project deleted successfully",
      deleted_project: deletedProject,
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete project",
    });
  }
});

// Get a specific project by ID
app.get("/api/projects/:projectId", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: "Project ID is required",
      });
    }

    // Get project from database
    const result = await pool.query(
      "SELECT * FROM projects WHERE id = $1 AND created_by = $2",
      [parseInt(projectId), req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found or you don't have permission to access it",
      });
    }

    const project = result.rows[0];
    
    // Parse JSON fields safely (handle both string and object cases)
    try {
      project.constraints = typeof project.constraints === 'string' 
        ? JSON.parse(project.constraints || '{}') 
        : project.constraints || {};
    } catch (e) {
      project.constraints = {};
    }
    
    try {
      project.city_data = typeof project.city_data === 'string' 
        ? JSON.parse(project.city_data || '{}') 
        : project.city_data || {};
    } catch (e) {
      project.city_data = {};
    }

    console.log(`Project ${projectId} requested by ${req.user.email}`);

    res.json({
      success: true,
      project: project,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch project",
    });
  }
});

// Get simulation data (integrates with Dev B's simulation engine)
app.get("/api/simulation/:projectId", authenticateToken, (req, res) => {
  const { projectId } = req.params;

  // Mock simulation data - Dev B will replace with actual simulation
  const simulationData = {
    project_id: parseInt(projectId),
    metrics: {
      traffic_flow_efficiency: Math.floor(Math.random() * 40) + 60, // 60-100%
      cost_estimate: Math.floor(Math.random() * 2000000) + 1000000, // 1M-3M
      pollution_index: Math.floor(Math.random() * 50) + 20, // 20-70
      green_space_ratio: (Math.random() * 0.3 + 0.1).toFixed(2), // 10-40%
      population_density: Math.floor(Math.random() * 2000) + 2000, // 2000-4000 per km²
      walkability_score: Math.floor(Math.random() * 30) + 60, // 60-90
    },
    last_updated: new Date().toISOString(),
    simulation_version: "1.0",
  };

  console.log(
    `Simulation data requested for project ${projectId} by ${req.user.email}`
  );

  res.json({
    success: true,
    simulation: simulationData,
  });
});

// Upload city blueprint with Supabase storage and parser integration
app.post(
  "/api/upload-blueprint",
  authenticateToken,
  upload.single("blueprint"),
  async (req, res) => {
    try {
      const { projectId } = req.body;
      const uploadedFile = req.file;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          error: "Project ID is required",
        });
      }

      if (!uploadedFile) {
        return res.status(400).json({
          success: false,
          error: "Blueprint file is required",
        });
      }

      console.log(
        `Blueprint upload started for project ${projectId} by ${req.user.email}: ${uploadedFile.originalname}`
      );

      // Generate unique filename for Supabase storage
      const timestamp = Date.now();
      const fileExt = path.extname(uploadedFile.originalname);
      const fileName = path.basename(uploadedFile.originalname, fileExt);
      const supabaseFilePath = `project_${projectId}/${fileName}_${timestamp}${fileExt}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("temporary-storage")
        .upload(supabaseFilePath, uploadedFile.buffer, {
          contentType: uploadedFile.mimetype,
          duplex: "half",
          upsert: true,
        });

      if (uploadError) {
        console.error("Supabase upload error details:", uploadError);
        throw new Error(`Supabase upload failed: ${uploadError.message}`);
      }

      console.log(`File uploaded to Supabase: ${supabaseFilePath}`);

      // Call parser service to normalize the uploaded file
      let normalizedData = null;
      let parsingStatus = "pending";
      let parsingError = null;

      try {
        console.log("Calling parser service for file:", supabaseFilePath);
        const parserResult = await callParserService(supabaseFilePath);

        if (parserResult.success) {
          normalizedData = parserResult.parsed_data;
          parsingStatus = "completed";
          console.log("Parsing completed successfully");
        } else {
          throw new Error("Parser service returned unsuccessful result");
        }
      } catch (error) {
        console.error("Parsing failed:", error.message);
        parsingStatus = "failed";
        parsingError = error.message;
        // Continue without failing the upload - store file even if parsing fails
      }

      // Create blueprint record
      const processedBlueprint = {
        id: Date.now(),
        project_id: parseInt(projectId),
        original_filename: uploadedFile.originalname,
        file_path: supabaseFilePath,
        supabase_path: uploadData.path,
        file_size: uploadedFile.size,
        file_type: path.extname(uploadedFile.originalname).toLowerCase(),
        mime_type: uploadedFile.mimetype,
        parsing_status: parsingStatus,
        parsing_error: parsingError,
        normalized_data: normalizedData,
        uploaded_by: req.user.id,
        uploaded_at: new Date().toISOString(),
      };

      // TODO: Store blueprint record in database when schema is ready
      // await pool.query("INSERT INTO blueprints (...) VALUES (...)", [...]);
      console.log(processedBlueprint);

      res.json({
        success: true,
        message: "Blueprint uploaded and processed successfully",
        blueprint: processedBlueprint,
        parsing_status: parsingStatus,
        ...(parsingError && { parsing_error: parsingError }),
      });
    } catch (error) {
      console.error("Blueprint upload error:", error);

      res.status(500).json({
        success: false,
        error: `Upload failed: ${error.message}`,
      });
    }
  }
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    success: false,
    error: "Something went wrong on the server",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(` City Planner API server running on port ${PORT}`);
      console.log(` Database: Connected to Supabase PostgreSQL`);
      console.log(` Demo credentials:`);
      console.log(`planner@city.dev / cityplanner123`);
      console.log(` dev@hackathon.com / cityplanner123`);
      console.log(`Protected routes:`);
      console.log(`POST /api/init-city (create city project)`);
      console.log(`POST /api/prompt (AI agent communication)`);
      console.log(`GET  /api/simulation/:projectId (get simulation data)`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
