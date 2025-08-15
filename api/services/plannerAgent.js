// AI-Powered Planner Agent Logic using IBM Watson granite-3-2-8b-instruct
const watsonService = require("./watsonService");

// AI-powered intent classification function
async function classifyIntent(
  userPrompt,
  existingFeatures = [],
  projectConstraints = {}
) {
  try {
    console.log("🧠 Using Watson AI for intent classification...");
    const aiIntent = await watsonService.classifyIntent(
      userPrompt,
      existingFeatures,
      projectConstraints
    );
    return aiIntent;
  } catch (error) {
    console.error(
      "⚠️ Watson AI classification failed, using fallback:",
      error.message
    );
    return watsonService.getFallbackIntent(userPrompt);
  }
}

// Legacy helper functions removed - now handled by Watson AI
// Fallback functions are implemented in watsonService.js

// AI-powered coordinate generation function
async function generateCoordinates(
  intent,
  existingFeatures = [],
  cityContext = {}
) {
  try {
    console.log("🏗️ Using Watson AI for feature layout generation...");
    const aiFeatures = await watsonService.generateFeatureLayout(
      intent,
      cityContext,
      existingFeatures
    );

    // Ensure features have required IDs and timestamps
    return aiFeatures.map((feature, index) => ({
      ...feature,
      id: feature.id || `${intent.feature_type}_${Date.now()}_${index}`,
      metadata: {
        ...feature.metadata,
        ai_generated: true,
        detection_method: "watsonx_ai",
        timestamp: new Date().toISOString(),
      },
    }));
  } catch (error) {
    console.error(
      "⚠️ Watson AI coordinate generation failed, using fallback:",
      error.message
    );
    return watsonService.getFallbackFeatures(intent, existingFeatures);
  }
}

// AI-powered rationale generation
async function generateRationale(intent, generatedFeatures, cityContext = {}) {
  try {
    console.log("📝 Using Watson AI for rationale generation...");
    const aiRationale = await watsonService.generateRationale(
      intent,
      generatedFeatures,
      cityContext
    );
    return aiRationale;
  } catch (error) {
    console.error(
      "⚠️ Watson AI rationale generation failed, using fallback:",
      error.message
    );
    return watsonService.getFallbackRationale(intent, generatedFeatures);
  }
}

module.exports = {
  classifyIntent,
  generateCoordinates,
  generateRationale,
};
