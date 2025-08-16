const express = require("express");
const { getProjectById, createFeedback } = require("../services/database");
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
    // Store feedback data in database
    const feedbackData = {
      project_id: projectId,
      author_name: sanitizeInput(name) || "Anonymous",
      category: sanitizeInput(category),
      rating: parseInt(rating),
      comment: sanitizeInput(comment),
      ip_address: req.ip, // For basic spam prevention
    };

    // Simple sentiment analysis based on rating and keywords
    let sentiment = 'neutral';
    if (rating >= 4) {
      sentiment = 'positive';
    } else if (rating <= 2) {
      sentiment = 'negative';
    }

    // Check for positive/negative keywords in comment
    const positiveKeywords = ['great', 'excellent', 'love', 'amazing', 'perfect', 'good', 'wonderful'];
    const negativeKeywords = ['bad', 'terrible', 'hate', 'awful', 'worst', 'poor', 'horrible'];
    
    const commentLower = comment.toLowerCase();
    const hasPositive = positiveKeywords.some(word => commentLower.includes(word));
    const hasNegative = negativeKeywords.some(word => commentLower.includes(word));
    
    if (hasPositive && !hasNegative) sentiment = 'positive';
    if (hasNegative && !hasPositive) sentiment = 'negative';

    // Save to database
    const savedFeedback = await createFeedback(
      projectId,
      feedbackData.author_name,
      feedbackData.category,
      feedbackData.rating,
      feedbackData.comment,
      sentiment,
      feedbackData.ip_address
    );

    console.log("Community Feedback Saved:", savedFeedback);

    res.json({
      success: true,
      message: "Feedback submitted successfully",
      feedback_id: savedFeedback.id,
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
