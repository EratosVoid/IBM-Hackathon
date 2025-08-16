const express = require("express");
const { getProjectById } = require("../services/database");
const { sanitizeInput } = require("../utils/validation");

const router = express.Router();

// Public endpoint to get project data for feedback form (no auth required)
router.get("/:projectId", async (req, res) => {
  console.log("Public project route hit");
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
      created_at: project.created_at,
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
router.post("/:projectId/feedback", async (req, res) => {
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

  if (
    !category ||
    !["Planning", "Infrastructure", "Environment", "Community"].includes(
      category
    )
  ) {
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
    // Store feedback data
    const feedbackData = {
      project_id: projectId,
      author_name: sanitizeInput(name) || "Anonymous",
      category: sanitizeInput(category),
      rating: parseInt(rating),
      comment: sanitizeInput(comment),
      submitted_at: new Date().toISOString(),
      ip_address: req.ip, // For basic spam prevention
    };

    // TODO: Store in database table for community feedback
    console.log("Community Feedback Received:", feedbackData);

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

module.exports = router;
