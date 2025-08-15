const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { getProjectById, updateProjectCityData } = require("../services/database");
const { classifyIntent, generateCoordinates, generateRationale } = require("../services/plannerAgent");

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
    const rationale = generateRationale(intent, generatedFeatures);

    // Step 4: Update project with new features if generated
    if (generatedFeatures.length > 0) {
      const updatedCityData = {
        ...cityData,
        features: [...existingFeatures, ...generatedFeatures]
      };

      // Save updated city data back to database
      await updateProjectCityData(projectId, req.user.id, updatedCityData);

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

module.exports = router;