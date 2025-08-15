const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const {
  createProject,
  getUserProjects,
  getProjectById,
  deleteProject,
} = require("../services/database");
const { sanitizeInput } = require("../utils/validation");

const router = express.Router();

// Initialize city project (aligns with hackathon plan)
router.post("/init-city", async (req, res) => {
  const { name, description, cityType, constraints } = req.body;

  // Input validation
  if (!name) {
    return res.status(400).json({
      success: false,
      error: "City project name is required",
    });
  }

  try {
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
      sanitizeInput(name),
      sanitizeInput(description) || "",
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
    const project = await getProjectById(projectId, req.user.id);

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

module.exports = router;