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

// Utility functions for categorical feature organization
const FEATURE_CATEGORIES = ['zones', 'roads', 'buildings', 'parks', 'water_bodies', 'services', 'architectures'];

/**
 * Organize features into categorical structure for storage
 */
function organizeFeaturesIntoCategories(features) {
  const categorizedData = {};
  
  // Initialize all categories as empty arrays
  FEATURE_CATEGORIES.forEach(category => {
    categorizedData[category] = [];
  });
  
  // Organize features by their type
  features.forEach(feature => {
    const categoryName = getCategoryNameFromFeatureType(feature.type);
    if (categorizedData[categoryName]) {
      categorizedData[categoryName].push(feature);
    } else {
      console.warn(`Unknown feature type: ${feature.type}, adding to architectures`);
      categorizedData.architectures.push(feature);
    }
  });
  
  return categorizedData;
}

/**
 * Convert feature type to category name (adds 's' suffix for pluralization)
 */
function getCategoryNameFromFeatureType(featureType) {
  switch (featureType) {
    case 'zone': return 'zones';
    case 'road': return 'roads';
    case 'building': return 'buildings';
    case 'park': return 'parks';
    case 'water_body': return 'water_bodies';
    case 'service': return 'services';
    case 'architecture': return 'architectures';
    default: return 'architectures'; // fallback
  }
}

/**
 * Extract all features from categorical structure into flat array
 */
function extractFeaturesFromCategories(cityData) {
  const allFeatures = [];
  
  FEATURE_CATEGORIES.forEach(category => {
    const categoryFeatures = cityData[category] || [];
    allFeatures.push(...categoryFeatures);
  });
  
  // Also handle legacy 'features' array for backward compatibility
  if (cityData.features && Array.isArray(cityData.features)) {
    allFeatures.push(...cityData.features);
  }
  
  return allFeatures;
}

// AI Agent prompt endpoint - integrated planner agent logic
router.post("/prompt", async (req, res) => {
  const { message, projectId, context } = req.body;

  console.log("Message", message);
  console.log("Context", context);

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

      // Extract features from categorical structure (new format) or legacy features array
      existingFeatures = extractFeaturesFromCategories(cityData);
      
      console.log(`📊 Extracted ${existingFeatures.length} existing features from project ${projectId}`);
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
      unit: project.blueprint_unit || "meters",
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
          minX: 0,
          maxX: blueprintDimensions.width,
          minY: 0,
          maxY: blueprintDimensions.height,
        },
        existing_feature_count: existingFeatures.length,
        project_type: project.city_type,
        constraints: projectConstraints,
        blueprint: blueprintDimensions,
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

    // Step 4: Save features with preview flag for easy management
    let previewSessionId = null;
    let previewData = null;
    if (generatedFeatures.length > 0) {
      // Generate unique preview session ID
      previewSessionId = `preview_${Date.now()}_${req.user.id}`;
      
      // Mark all generated features as preview
      const previewFeatures = generatedFeatures.map(feature => ({
        ...feature,
        metadata: {
          ...feature.metadata,
          preview: true,
          preview_session_id: previewSessionId,
          created_at: new Date().toISOString()
        }
      }));

      // Organize all features (existing + new preview) into categorical structure
      const allFeatures = [...existingFeatures, ...previewFeatures];
      const categorizedFeatures = organizeFeaturesIntoCategories(allFeatures);
      
      // Update city data with categorical structure including preview features
      const updatedCityData = {
        ...cityData,
        ...categorizedFeatures, // Spread the categorized features (zones, roads, buildings, etc.)
        // Remove legacy features array if it exists
        features: undefined
      };
      
      // Clean up undefined values
      Object.keys(updatedCityData).forEach(key => {
        if (updatedCityData[key] === undefined) {
          delete updatedCityData[key];
        }
      });

      // Save updated city data with preview features to database
      await updateProjectCityData(projectId, req.user.id, updatedCityData);

      // Prepare preview data for response
      const previewCategorizedFeatures = organizeFeaturesIntoCategories(previewFeatures);
      previewData = {
        categorized_features: previewCategorizedFeatures,
        feature_summary: {},
        total_count: previewFeatures.length,
        preview_session_id: previewSessionId
      };
      
      // Create feature summary by category for preview UI
      FEATURE_CATEGORIES.forEach(category => {
        const count = previewCategorizedFeatures[category].length;
        if (count > 0) {
          previewData.feature_summary[category] = count;
        }
      });

      console.log(
        `🔍 Generated and saved ${generatedFeatures.length} features as preview (session: ${previewSessionId}):`
      );
      
      // Log feature distribution by category
      Object.entries(previewData.feature_summary).forEach(([category, count]) => {
        console.log(`   - ${category}: ${count} features`);
      });
    }

    // Format response for frontend with preview mode
    const agentResponse = {
      id: Date.now(),
      user_prompt: message,
      project_id: parseInt(projectId),
      agent_response: rationale,
      reasoning: rationale,
      generated_features: generatedFeatures,
      features_added: generatedFeatures.length, // Features are saved to DB with preview flag
      preview_mode: true,
      preview_data: previewData,
      preview_session_id: previewSessionId,
      status: "preview_saved",
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
      features_generated: generatedFeatures.length,
      preview_mode: true,
      intent: intent.intent,
      feature_type: intent.feature_type,
    });

    res.json({
      success: true,
      message: "AI agent generated and saved preview features",
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
    let fallbackPreviewData = null;
    let fallbackPreviewSessionId = null;
    try {
      const watsonService = require("../services/watsonService");
      const basicIntent = watsonService.getFallbackIntent(message);
      fallbackFeatures = watsonService.getFallbackFeatures(
        basicIntent,
        existingFeatures
      );
      
      // Save fallback features with preview flag too
      if (fallbackFeatures.length > 0) {
        fallbackPreviewSessionId = `preview_fallback_${Date.now()}_${req.user.id}`;
        
        // Mark fallback features as preview
        const previewFallbackFeatures = fallbackFeatures.map(feature => ({
          ...feature,
          metadata: {
            ...feature.metadata,
            preview: true,
            preview_session_id: fallbackPreviewSessionId,
            created_at: new Date().toISOString(),
            fallback: true
          }
        }));

        // Save fallback features to database
        const allFeatures = [...existingFeatures, ...previewFallbackFeatures];
        const categorizedFeatures = organizeFeaturesIntoCategories(allFeatures);
        
        const updatedCityData = {
          ...cityData,
          ...categorizedFeatures,
          features: undefined
        };
        
        Object.keys(updatedCityData).forEach(key => {
          if (updatedCityData[key] === undefined) {
            delete updatedCityData[key];
          }
        });

        await updateProjectCityData(projectId, req.user.id, updatedCityData);

        // Create preview data for fallback features
        const fallbackCategorizedFeatures = organizeFeaturesIntoCategories(previewFallbackFeatures);
        fallbackPreviewData = {
          categorized_features: fallbackCategorizedFeatures,
          feature_summary: {},
          total_count: previewFallbackFeatures.length,
          preview_session_id: fallbackPreviewSessionId
        };
        
        FEATURE_CATEGORIES.forEach(category => {
          const count = fallbackCategorizedFeatures[category].length;
          if (count > 0) {
            fallbackPreviewData.feature_summary[category] = count;
          }
        });
      }
      
      userMessage =
        "I used basic planning logic to help with your request. " + userMessage;
    } catch (fallbackError) {
      console.error("🚨 Fallback service also failed:", fallbackError);
    }

    // Enhanced fallback response with preview mode
    const fallbackResponse = {
      id: Date.now(),
      user_prompt: message,
      project_id: parseInt(projectId),
      agent_response: userMessage,
      reasoning: `Error during AI processing (${errorType}). Fallback response provided.`,
      generated_features: fallbackFeatures,
      features_added: fallbackFeatures.length, // Fallback features saved to DB with preview flag
      preview_mode: true,
      preview_data: fallbackPreviewData,
      preview_session_id: fallbackPreviewSessionId,
      status: "preview_saved",
      timestamp: new Date().toISOString(),
      processed_by: req.user.id,
      error_type: errorType,
      fallback_used: true,
    };

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
          ? "Request processed with fallback method - preview ready"
          : "AI agent processing failed",
      response: fallbackResponse,
    });
  }
});

// Confirm and save previewed features endpoint
router.post("/confirm-features", async (req, res) => {
  const { projectId, features, context } = req.body;

  console.log("Confirming features for project:", projectId);

  // Input validation
  if (!projectId || !features || !Array.isArray(features)) {
    return res.status(400).json({
      success: false,
      error: "Project ID and features array are required",
    });
  }

  try {
    // Get current project data
    const project = await getProjectById(projectId, req.user.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found or access denied",
      });
    }

    // Parse existing city_data
    let existingFeatures = [];
    let cityData = {};
    try {
      cityData =
        typeof project.city_data === "string"
          ? JSON.parse(project.city_data || "{}")
          : project.city_data || {};

      // Extract existing features from categorical structure
      existingFeatures = extractFeaturesFromCategories(cityData);
      
      console.log(`📊 Current project has ${existingFeatures.length} existing features`);
    } catch (e) {
      console.log("Could not parse existing city data:", e.message);
      cityData = {};
    }

    // Organize all features (existing + confirmed new) into categorical structure
    const allFeatures = [...existingFeatures, ...features];
    const categorizedFeatures = organizeFeaturesIntoCategories(allFeatures);
    
    // Update city data with categorical structure
    const updatedCityData = {
      ...cityData,
      ...categorizedFeatures, // Spread the categorized features (zones, roads, buildings, etc.)
      // Remove legacy features array if it exists
      features: undefined
    };
    
    // Clean up undefined values
    Object.keys(updatedCityData).forEach(key => {
      if (updatedCityData[key] === undefined) {
        delete updatedCityData[key];
      }
    });

    // Save updated city data back to database
    await updateProjectCityData(projectId, req.user.id, updatedCityData);

    console.log(
      `✅ Confirmed and saved ${features.length} new features to project ${projectId}:`
    );
    
    // Log feature distribution by category
    const addedFeatureSummary = {};
    const addedCategorizedFeatures = organizeFeaturesIntoCategories(features);
    FEATURE_CATEGORIES.forEach(category => {
      const count = addedCategorizedFeatures[category].length;
      if (count > 0) {
        addedFeatureSummary[category] = count;
        console.log(`   - ${category}: ${count} features`);
      }
    });

    // Format successful response
    const confirmResponse = {
      id: Date.now(),
      project_id: parseInt(projectId),
      features_confirmed: features.length,
      features_added: features.length,
      added_feature_summary: addedFeatureSummary,
      total_features: allFeatures.length,
      status: "confirmed_and_saved",
      timestamp: new Date().toISOString(),
      processed_by: req.user.id,
    };

    // Log for monitoring
    console.log("Features confirmed and saved:", {
      user: req.user.email,
      project: projectId,
      features_confirmed: features.length,
      total_features_now: allFeatures.length,
    });

    res.json({
      success: true,
      message: `Successfully confirmed and saved ${features.length} features`,
      response: confirmResponse,
    });
  } catch (error) {
    console.error("🚨 Feature confirmation error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to confirm and save features",
      message: "An error occurred while saving the confirmed features. Please try again.",
    });
  }
});

// Confirm preview features endpoint (remove preview flag)
router.post("/confirm-preview", async (req, res) => {
  const { projectId, previewSessionId } = req.body;

  console.log("Confirming preview features for session:", previewSessionId);

  // Input validation
  if (!projectId || !previewSessionId) {
    return res.status(400).json({
      success: false,
      error: "Project ID and preview session ID are required",
    });
  }

  try {
    // Get current project data
    const project = await getProjectById(projectId, req.user.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found or access denied",
      });
    }

    // Parse existing city_data
    let cityData = {};
    try {
      cityData =
        typeof project.city_data === "string"
          ? JSON.parse(project.city_data || "{}")
          : project.city_data || {};
    } catch (e) {
      console.log("Could not parse existing city data:", e.message);
      cityData = {};
    }

    // Extract all features and remove preview flag from matching session
    const allFeatures = extractFeaturesFromCategories(cityData);
    let confirmedCount = 0;
    
    const confirmedFeatures = allFeatures.map(feature => {
      if (feature.metadata?.preview && feature.metadata?.preview_session_id === previewSessionId) {
        confirmedCount++;
        return {
          ...feature,
          metadata: {
            ...feature.metadata,
            preview: false, // Remove preview flag
            confirmed_at: new Date().toISOString()
          }
        };
      }
      return feature;
    });

    // Reorganize confirmed features into categorical structure
    const categorizedFeatures = organizeFeaturesIntoCategories(confirmedFeatures);
    
    // Update city data
    const updatedCityData = {
      ...cityData,
      ...categorizedFeatures,
      features: undefined
    };
    
    // Clean up undefined values
    Object.keys(updatedCityData).forEach(key => {
      if (updatedCityData[key] === undefined) {
        delete updatedCityData[key];
      }
    });

    // Save updated city data back to database
    await updateProjectCityData(projectId, req.user.id, updatedCityData);

    console.log(
      `✅ Confirmed ${confirmedCount} preview features for session ${previewSessionId}`
    );

    // Format successful response
    const confirmResponse = {
      id: Date.now(),
      project_id: parseInt(projectId),
      preview_session_id: previewSessionId,
      features_confirmed: confirmedCount,
      status: "confirmed",
      timestamp: new Date().toISOString(),
      processed_by: req.user.id,
    };

    // Log for monitoring
    console.log("Preview features confirmed:", {
      user: req.user.email,
      project: projectId,
      session: previewSessionId,
      features_confirmed: confirmedCount,
    });

    res.json({
      success: true,
      message: `Successfully confirmed ${confirmedCount} preview features`,
      response: confirmResponse,
    });
  } catch (error) {
    console.error("🚨 Preview confirmation error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to confirm preview features",
      message: "An error occurred while confirming the preview features. Please try again.",
    });
  }
});

// Cancel preview features endpoint (delete preview features)
router.post("/cancel-preview", async (req, res) => {
  const { projectId, previewSessionId } = req.body;

  console.log("Canceling preview features for session:", previewSessionId);

  // Input validation
  if (!projectId || !previewSessionId) {
    return res.status(400).json({
      success: false,
      error: "Project ID and preview session ID are required",
    });
  }

  try {
    // Get current project data
    const project = await getProjectById(projectId, req.user.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found or access denied",
      });
    }

    // Parse existing city_data
    let cityData = {};
    try {
      cityData =
        typeof project.city_data === "string"
          ? JSON.parse(project.city_data || "{}")
          : project.city_data || {};
    } catch (e) {
      console.log("Could not parse existing city data:", e.message);
      cityData = {};
    }

    // Extract all features and filter out preview features from matching session
    const allFeatures = extractFeaturesFromCategories(cityData);
    let canceledCount = 0;
    
    const remainingFeatures = allFeatures.filter(feature => {
      if (feature.metadata?.preview && feature.metadata?.preview_session_id === previewSessionId) {
        canceledCount++;
        return false; // Remove this feature
      }
      return true; // Keep this feature
    });

    // Reorganize remaining features into categorical structure
    const categorizedFeatures = organizeFeaturesIntoCategories(remainingFeatures);
    
    // Update city data
    const updatedCityData = {
      ...cityData,
      ...categorizedFeatures,
      features: undefined
    };
    
    // Clean up undefined values
    Object.keys(updatedCityData).forEach(key => {
      if (updatedCityData[key] === undefined) {
        delete updatedCityData[key];
      }
    });

    // Save updated city data back to database
    await updateProjectCityData(projectId, req.user.id, updatedCityData);

    console.log(
      `🗑️ Canceled and removed ${canceledCount} preview features for session ${previewSessionId}`
    );

    // Format successful response
    const cancelResponse = {
      id: Date.now(),
      project_id: parseInt(projectId),
      preview_session_id: previewSessionId,
      features_canceled: canceledCount,
      status: "canceled",
      timestamp: new Date().toISOString(),
      processed_by: req.user.id,
    };

    // Log for monitoring
    console.log("Preview features canceled:", {
      user: req.user.email,
      project: projectId,
      session: previewSessionId,
      features_canceled: canceledCount,
    });

    res.json({
      success: true,
      message: `Successfully canceled and removed ${canceledCount} preview features`,
      response: cancelResponse,
    });
  } catch (error) {
    console.error("🚨 Preview cancellation error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to cancel preview features",
      message: "An error occurred while canceling the preview features. Please try again.",
    });
  }
});

module.exports = router;
