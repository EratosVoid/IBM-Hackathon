// server.js  auth 
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('../../node_modules/bcryptjs/umd');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';

// Middleware 
app.use(express.json());
app.use(cors());

// email validators
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// In-memory user store - we will replace this with a database in production i guess redis?
const users = [
  {
    id: 1,
    email: 'planner@city.dev',
    password: '$2a$10$8K1p/a0dRT..vdVOKZ1w.uhKh8xhbtVYzO1Ys5YzPzWcIhF5v3VEa', // password: 'cityplanner123'
    name: 'City Planner'
  },
  {
    id: 2,
    email: 'dev@hackathon.com',
    password: '$2a$10$8K1p/a0dRT..vdVOKZ1w.uhKh8xhbtVYzO1Ys5YzPzWcIhF5v3VEa', // password: 'cityplanner123'
    name: 'Hackathon Dev'
  }
];

// JWT 
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      name: user.name 
    },
    JWT_SECRET,
    { expiresIn: '1hr' } 
  );
};

// Middleware for --->JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          error: 'Token expired' 
        });
      }
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid token' 
      });
    }
    req.user = user;
    next();
  });
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'City Planner API',
    timestamp: new Date().toISOString() 
  });
});

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Input validation
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email, password, and name are required' 
      });
    }

    // Email validation
    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    // Password strength check
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return res.status(409).json({ 
        success: false, 
        error: 'User already exists with this email' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = {
      id: users.length + 1,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim()
    };

    users.push(newUser);

    // Generate token
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during registration' 
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    // Email validation
    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    // Find user
    const user = users.find(u => u.email === email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during login' 
    });
  }
});

// Get current user profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name
    }
  });
});

// Logout (simplified - just for consistency)
app.post('/api/auth/logout', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
});

 // protected routes  yaha se

// Initialize city project (aligns with hackathon plan)
app.post('/api/init-city', authenticateToken, (req, res) => {
  const { name, description, cityType, constraints } = req.body;

  // Input validation
  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'City project name is required'
    });
  }

  // Create new city project
  const cityProject = {
    id: Date.now(), //  ID generation  city project ka  unique 
    name: name.trim(),
    description: description?.trim() || '',
    cityType: cityType || 'new', // 'new' or 'existing'
    constraints: constraints || {},
    status: 'initialized',
    created_by: req.user.id,
    created_at: new Date().toISOString(),
    last_modified: new Date().toISOString(),
    // Initial city data structure
    cityData: {
      zones: [],
      infrastructure: [],
      population: 0,
      area: constraints?.area || 1000,
      budget: constraints?.budget || 5000000
    }
  };

  // In a real app, save to database
  console.log('New city project created:', cityProject);

  res.status(201).json({
    success: true,
    message: 'City project initialized successfully',
    project: cityProject
  });
});

// AI Agent prompt endpoint (integrates with Dev A's Planner Agent)
app.post('/api/prompt', authenticateToken, (req, res) => {
  const { message, projectId, context } = req.body;

  // Input validation
  if (!message || !projectId) {
    return res.status(400).json({
      success: false,
      error: 'Message and projectId are required'
    });
  }

  // Mock AI agent response (Dev A will integrate actual agent here)
  const agentResponse = {
    id: Date.now(),
    user_prompt: message,
    project_id: projectId,
    agent_response: `AI Agent processing: "${message}"`,
    reasoning: "Analyzing urban planning requirements and constraints...",
    suggested_actions: [
      "update_zoning_layout",
      "recalculate_traffic_patterns", 
      "adjust_green_space_distribution"
    ],
    modifications: {
      zones_added: Math.floor(Math.random() * 3) + 1,
      cost_impact: Math.floor(Math.random() * 100000) + 50000,
      timeline_days: Math.floor(Math.random() * 30) + 7
    },
    status: 'processing',
    timestamp: new Date().toISOString(),
    processed_by: req.user.id
  };

  // Log for Dev A integration
  console.log('Agent prompt received:', {
    user: req.user.email,
    prompt: message,
    project: projectId,
    context
  });

  res.json({
    success: true,
    message: 'Prompt sent to AI agent successfully',
    response: agentResponse
  });
});

// Get city projects for current user
app.get('/api/projects', authenticateToken, (req, res) => {
  // Mock projects data - replace with database query
  const mockProjects = [
    {
      id: 1,
      name: 'Downtown Revitalization',
      description: 'Modern urban renewal project',
      status: 'in_progress',
      created_by: req.user.id,
      created_at: '2024-01-15T10:30:00Z',
      last_modified: '2024-01-16T14:22:00Z'
    },
    {
      id: 2,
      name: 'Green Belt Expansion',
      description: 'Sustainable urban development',
      status: 'planning',
      created_by: req.user.id,
      created_at: '2024-01-14T09:15:00Z',
      last_modified: '2024-01-14T09:15:00Z'
    }
  ];

  res.json({ 
    success: true, 
    projects: mockProjects 
  });
});

// Get simulation data (integrates with Dev B's simulation engine)
app.get('/api/simulation/:projectId', authenticateToken, (req, res) => {
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
      walkability_score: Math.floor(Math.random() * 30) + 60 // 60-90
    },
    last_updated: new Date().toISOString(),
    simulation_version: '1.0'
  };

  console.log(`Simulation data requested for project ${projectId} by ${req.user.email}`);

  res.json({
    success: true,
    simulation: simulationData
  });
});

// Upload city blueprint (integrates with Dev C's data ingestion)
app.post('/api/upload-blueprint', authenticateToken, (req, res) => {
  const { projectId, blueprintData, fileType } = req.body;

  if (!projectId || !blueprintData) {
    return res.status(400).json({
      success: false,
      error: 'Project ID and blueprint data are required'
    });
  }

  // Mock blueprint processing - Dev C will implement actual parsing
  const processedBlueprint = {
    id: Date.now(),
    project_id: projectId,
    file_type: fileType || 'json',
    status: 'processed',
    parsed_zones: Math.floor(Math.random() * 10) + 5,
    parsed_roads: Math.floor(Math.random() * 20) + 10,
    parsed_buildings: Math.floor(Math.random() * 50) + 25,
    uploaded_by: req.user.id,
    uploaded_at: new Date().toISOString()
  };

  console.log(`Blueprint uploaded for project ${projectId} by ${req.user.email}`);  //upload done hone pe to reflect

  res.json({
    success: true,
    message: 'Blueprint uploaded and processed successfully',
    blueprint: processedBlueprint
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Something went wrong on the server' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(` City Planner API server running on port ${PORT}`);
  console.log(` Demo credentials:`);
  console.log(`planner@city.dev / cityplanner123`);
  console.log(` dev@hackathon.com / cityplanner123`);
  console.log(`Protected routes:`);
  console.log(`POST /api/init-city (create city project)`);
  console.log(`POST /api/prompt (AI agent communication)`);
  console.log(`GET  /api/simulation/:projectId (get simulation data)`);
});

module.exports = app;