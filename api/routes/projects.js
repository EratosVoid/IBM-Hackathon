const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const {
  createProject,
  getUserProjects,
  getProjectById,
  getProjectByIdForUser,
  updateProjectBlueprint,
  deleteProject,
  getProjectFeedback,
  getFeedbackStats,
} = require("../services/database");
const { sanitizeInput } = require("../utils/validation");

const router = express.Router();

// Public endpoint to get project data for feedback form (no auth required)
router.get("/public/:projectId", async (req, res) => {
  const projectId = parseInt(req.params.projectId);

  if (!projectId || isNaN(projectId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid project ID",
    });
  }

  try {
    // Get project without authentication for public viewing
    const project = await getProjectById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    // Return only public-safe project data
    const publicData = {
      id: project.id,
      name: project.name,
      description: project.description,
      city_type: project.city_type,
      blueprint_width: project.blueprint_width,
      blueprint_height: project.blueprint_height,
      blueprint_unit: project.blueprint_unit,
      city_data: project.city_data, // Contains the features to display
      created_at: project.created_at
    };

    res.json({
      success: true,
      project: publicData,
    });
  } catch (error) {
    console.error("Error fetching public project:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Public endpoint to submit community feedback (no auth required)
router.post("/public/:projectId/feedback", async (req, res) => {
  const projectId = parseInt(req.params.projectId);
  const { name, category, rating, comment } = req.body;

  if (!projectId || isNaN(projectId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid project ID",
    });
  }

  // Validate feedback data
  if (!comment || !comment.trim()) {
    return res.status(400).json({
      success: false,
      error: "Comment is required",
    });
  }

  if (!category || !['Planning', 'Infrastructure', 'Environment', 'Community'].includes(category)) {
    return res.status(400).json({
      success: false,
      error: "Valid category is required",
    });
  }

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      error: "Rating must be between 1 and 5",
    });
  }

  try {
    // For now, we'll log the feedback - later we can store it in the database
    const feedbackData = {
      project_id: projectId,
      author_name: sanitizeInput(name) || 'Anonymous',
      category: sanitizeInput(category),
      rating: parseInt(rating),
      comment: sanitizeInput(comment),
      submitted_at: new Date().toISOString(),
      ip_address: req.ip, // For basic spam prevention
    };

    // TODO: Store in database table for community feedback
    console.log('Community Feedback Received:', feedbackData);

    res.json({
      success: true,
      message: "Feedback submitted successfully",
      feedback_id: Date.now(), // Temporary ID
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit feedback",
    });
  }
});

// Initialize city project (aligns with hackathon plan)
router.post("/init-city", async (req, res) => {
  const { 
    name, 
    description, 
    cityType, 
    constraints,
    blueprint
  } = req.body;

  // Input validation
  if (!name) {
    return res.status(400).json({
      success: false,
      error: "City project name is required",
    });
  }

  try {
    // Extract blueprint dimensions with defaults
    const blueprintWidth = blueprint?.width || 100;
    const blueprintHeight = blueprint?.height || 100;
    const blueprintUnit = blueprint?.unit || 'meters';

    // Validate blueprint dimensions
    if (blueprintWidth <= 0 || blueprintHeight <= 0) {
      return res.status(400).json({
        success: false,
        error: "Blueprint dimensions must be positive numbers",
      });
    }

    // Initial city data structure with blueprint bounds and categorical feature arrays
    const cityData = {
      // Feature categories (aligned with frontend expectations)
      zones: [],
      roads: [],
      buildings: [],
      parks: [],
      water_bodies: [],
      services: [],
      architectures: [],
      
      // Project metadata
      population: 0,
      area: constraints?.area || 1000,
      budget: constraints?.budget || 5000000,
      blueprint: {
        width: blueprintWidth,
        height: blueprintHeight,
        unit: blueprintUnit
      },
      bounds: {
        minX: 0, // Updated to bottom-left origin
        maxX: blueprintWidth,
        minY: 0,
        maxY: blueprintHeight
      }
    };

    // Create new city project in database with blueprint dimensions
    const cityProject = await createProject(
      sanitizeInput(name),
      sanitizeInput(description) || "",
      cityType || "new",
      constraints || {},
      req.user.id,
      cityData,
      blueprintWidth,
      blueprintHeight,
      blueprintUnit
    );

    console.log("New city project created with blueprint:", {
      project: cityProject.name,
      dimensions: `${blueprintWidth}x${blueprintHeight} ${blueprintUnit}`
    });

    res.status(201).json({
      success: true,
      message: "City project initialized successfully",
      project: cityProject,
    });
  } catch (error) {
    console.error("Error creating city project:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create city project",
    });
  }
});

// Get city projects for current user
router.get("/", async (req, res) => {
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

// Get a specific project by ID
router.get("/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: "Project ID is required",
      });
    }

    // Get project from database
    const project = await getProjectByIdForUser(projectId, req.user.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found or you don't have permission to access it",
      });
    }
    
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

// Update project blueprint dimensions
router.put("/:projectId/blueprint", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { width, height, unit } = req.body;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: "Project ID is required",
      });
    }

    // Validate blueprint dimensions
    if (!width || !height || width <= 0 || height <= 0) {
      return res.status(400).json({
        success: false,
        error: "Valid width and height are required (positive numbers)",
      });
    }

    if (!['meters', 'feet', 'kilometers'].includes(unit)) {
      return res.status(400).json({
        success: false,
        error: "Unit must be 'meters', 'feet', or 'kilometers'",
      });
    }

    const updatedProject = await updateProjectBlueprint(
      projectId, 
      req.user.id, 
      width, 
      height, 
      unit
    );

    if (!updatedProject) {
      return res.status(404).json({
        success: false,
        error: "Project not found or you don't have permission to update it",
      });
    }

    console.log(`Blueprint updated for project ${projectId}: ${width}x${height} ${unit}`);

    res.json({
      success: true,
      message: "Blueprint dimensions updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error updating blueprint:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update blueprint dimensions",
    });
  }
});

// Delete a project
router.delete("/:projectId", async (req, res) => {
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

// Get feedback for a project (authenticated)
router.get("/:projectId/feedback", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: "Project ID is required",
      });
    }

    // Check if user owns the project
    const project = await getProjectByIdForUser(parseInt(projectId), req.user.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found or you don't have permission to view it",
      });
    }

    // Get feedback and stats
    const [feedback, stats] = await Promise.all([
      getProjectFeedback(parseInt(projectId)),
      getFeedbackStats(parseInt(projectId))
    ]);

    // Format feedback data for frontend
    const formattedFeedback = feedback.map(fb => ({
      id: fb.id,
      author: fb.author_name,
      category: fb.category,
      rating: fb.rating,
      comment: fb.comment,
      sentiment: fb.sentiment,
      timestamp: formatTimeAgo(fb.submitted_at)
    }));

    res.json({
      success: true,
      feedback: formattedFeedback,
      stats: {
        total: parseInt(stats.total) || 0,
        avgRating: parseFloat(stats.avg_rating) || 0,
        positive: parseInt(stats.positive_count) || 0,
        negative: parseInt(stats.negative_count) || 0,
        neutral: parseInt(stats.neutral_count) || 0
      }
    });
  } catch (error) {
    console.error("Error fetching project feedback:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch feedback",
    });
  }
});

// Helper function to format timestamps
function formatTimeAgo(timestamp) {
  const now = new Date();
  const submitted = new Date(timestamp);
  const diffMs = now - submitted;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }
}

module.exports = router;