const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const {
  getProjectById,
  updateProjectCityData,
} = require("../services/database");
const {
  classifyIntent,
  generateCoordinates,
  generateRationale,
} = require("../services/plannerAgent");

const router = express.Router();

// AI Agent prompt endpoint - integrated planner agent logic
router.post("/prompt", async (req, res) => {
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
    const project = await getProjectById(projectId, req.user.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found or access denied",
      });
    }

    // Parse existing city_data to extract features for context
    let existingFeatures = [];
    let cityData = {};
    try {
      cityData =
        typeof project.city_data === "string"
          ? JSON.parse(project.city_data || "{}")
          : project.city_data || {};

      // Extract features from city data if they exist
      if (cityData.features) {
        existingFeatures = cityData.features;
      }
    } catch (e) {
      console.log("Could not parse existing city data:", e.message);
      cityData = {};
    }

    // ========== AI-POWERED PLANNER AGENT PROCESSING ==========

    // Parse project constraints for AI context
    const projectConstraints = project.constraints || {};
    
    // Extract blueprint dimensions for AI context
    const blueprintDimensions = {
      width: project.blueprint_width || 100,
      height: project.blueprint_height || 100,
      unit: project.blueprint_unit || 'meters'
    };

    // Step 1: AI-powered intent classification
    const intent = await classifyIntent(
      message,
      existingFeatures,
      projectConstraints,
      blueprintDimensions
    );
    console.log(`🧠 Watson AI Classified intent:`, intent);

    // Step 2: AI-powered feature generation with coordinates
    let generatedFeatures = [];
    if (
      intent.intent !== "unknown" &&
      intent.intent !== "get_recommendations"
    ) {
      const cityContext = {
        bounds: {
          minX: -blueprintDimensions.width / 2,
          maxX: blueprintDimensions.width / 2,
          minY: -blueprintDimensions.height / 2,
          maxY: blueprintDimensions.height / 2
        },
        existing_feature_count: existingFeatures.length,
        project_type: project.city_type,
        constraints: projectConstraints,
        blueprint: blueprintDimensions
      };

      generatedFeatures = await generateCoordinates(
        intent,
        existingFeatures,
        cityContext,
        blueprintDimensions
      );
      console.log(
        `🏗️ Watson AI Generated ${generatedFeatures.length} features`
      );
    }

    // Step 3: AI-powered rationale generation
    const cityContext = {
      project_name: project.name,
      city_type: project.city_type,
      existing_features: existingFeatures.length,
      constraints: projectConstraints,
    };
    const rationale = await generateRationale(
      intent,
      generatedFeatures,
      cityContext
    );

    // Step 4: Update project with new features if generated
    if (generatedFeatures.length > 0) {
      const updatedCityData = {
        ...cityData,
        features: [...existingFeatures, ...generatedFeatures],
      };

      // Save updated city data back to database
      await updateProjectCityData(projectId, req.user.id, updatedCityData);

      console.log(
        `Added ${generatedFeatures.length} new features to project ${projectId}`
      );
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
      intent_classified: intent,
    };

    // Log for monitoring
    console.log("AI Agent request processed:", {
      user: req.user.email,
      prompt: message,
      project: projectId,
      features_generated: agentResponse.features_added,
      intent: intent.intent,
      feature_type: intent.feature_type,
    });

    res.json({
      success: true,
      message: "AI agent processed request successfully",
      response: agentResponse,
    });
  } catch (error) {
    console.error("🚨 AI Agent processing error:", error);

    // Enhanced error categorization
    let errorType = "unknown";
    let userMessage =
      "I apologize, but I encountered an issue processing your request. Please try again.";

    if (
      error.message?.includes("Watson") ||
      error.message?.includes("watsonx")
    ) {
      errorType = "watson_ai_service";
      userMessage =
        "I'm having trouble connecting to the AI service. Using basic urban planning logic instead.";
    } else if (
      error.message?.includes("database") ||
      error.message?.includes("SQL")
    ) {
      errorType = "database_error";
      userMessage = "There was an issue saving your request. Please try again.";
    } else if (
      error.message?.includes("authentication") ||
      error.message?.includes("API key")
    ) {
      errorType = "authentication_error";
      userMessage = "AI service authentication failed. Please contact support.";
    }

    // Try to provide partial service using fallbacks
    let fallbackFeatures = [];
    try {
      const watsonService = require("../services/watsonService");
      const basicIntent = watsonService.getFallbackIntent(message);
      fallbackFeatures = watsonService.getFallbackFeatures(
        basicIntent,
        existingFeatures
      );
      userMessage =
        "I used basic planning logic to help with your request. " + userMessage;
    } catch (fallbackError) {
      console.error("🚨 Fallback service also failed:", fallbackError);
    }

    // Enhanced fallback response
    const fallbackResponse = {
      id: Date.now(),
      user_prompt: message,
      project_id: parseInt(projectId),
      agent_response: userMessage,
      reasoning: `Error during AI processing (${errorType}). Fallback response provided.`,
      generated_features: fallbackFeatures,
      features_added: fallbackFeatures.length,
      status: "partial_success",
      timestamp: new Date().toISOString(),
      processed_by: req.user.id,
      error_type: errorType,
      fallback_used: true,
    };

    // Still try to save fallback features if any were generated
    if (fallbackFeatures.length > 0) {
      try {
        const updatedCityData = {
          ...cityData,
          features: [...existingFeatures, ...fallbackFeatures],
        };
        await updateProjectCityData(projectId, req.user.id, updatedCityData);
        console.log(
          `💾 Saved ${fallbackFeatures.length} fallback features to project ${projectId}`
        );
      } catch (saveError) {
        console.error("🚨 Failed to save fallback features:", saveError);
      }
    }

    // Return appropriate status code
    const statusCode =
      errorType === "authentication_error"
        ? 401
        : errorType === "watson_ai_service"
        ? 503
        : 500;

    res.status(statusCode).json({
      success: fallbackFeatures.length > 0, // Success if we provided fallback features
      message:
        fallbackFeatures.length > 0
          ? "Request processed with fallback method"
          : "AI agent processing failed",
      response: fallbackResponse,
    });
  }
});

module.exports = router;
