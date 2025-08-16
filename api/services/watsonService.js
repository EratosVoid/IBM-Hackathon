const { WatsonXAI } = require("@ibm-cloud/watsonx-ai");
const { IamAuthenticator } = require("ibm-cloud-sdk-core");

class WatsonPlannerService {
  constructor() {
    this.watsonxAI = null;
    this.modelId = "ibm/granite-3-2-8b-instruct";
    this.projectId = process.env.WATSONX_PROJECT_ID;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    // Validate required environment variables (IBM SDK standard format)
    if (!process.env.WATSONX_API_KEY) {
      throw new Error("WATSONX_API_KEY environment variable is required");
    }

    if (!process.env.WATSONX_PROJECT_ID) {
      throw new Error("WATSONX_PROJECT_ID environment variable is required");
    }

    // Set IBM SDK expected auth type if not set
    if (!process.env.WATSONX_AI_AUTH_TYPE) {
      process.env.WATSONX_AI_AUTH_TYPE = "iam";
    }

    try {
      // IBM SDK auto-configures authentication from environment variables
      this.watsonxAI = WatsonXAI.newInstance({
        version: "2024-05-31",
        serviceUrl:
          process.env.WATSONX_URL || "https://us-south.ml.cloud.ibm.com",
        apiKey: process.env.WATSONX_API_KEY,
        authenticator: new IamAuthenticator({
          apikey: process.env.WATSONX_API_KEY,
        }),
      });

      this.initialized = true;
      console.log("✅ Watson AI service initialized successfully");
      console.log(`🤖 Using model: ${this.modelId}`);
      console.log(`🏗️ Project ID: ${this.projectId}`);
      console.log(`🔐 Auth Type: ${process.env.WATSONX_AI_AUTH_TYPE}`);

      // Optional: Test connection with a simple request
      try {
        const testParams = {
          input: "Test",
          modelId: this.modelId,

          projectId: this.projectId,
          parameters: {
            max_new_tokens: 5,
            temperature: 0.1,
          },
        };

        const testResponse = await this.watsonxAI.generateText(testParams);
        console.log("🧪 Watson AI connection test successful");
      } catch (testError) {
        console.log(
          "⚠️ Watson AI connection test failed, but service initialized:",
          testError.message
        );
        // Don't throw here - service might still work for actual requests
      }
    } catch (error) {
      console.error("❌ Failed to initialize Watson AI service:", error);
      console.error(
        "💡 Make sure these environment variables are set correctly:"
      );
      console.error("   WATSONX_AI_AUTH_TYPE=iam");
      console.error("   WATSONX_API_KEY=<your_ibm_cloud_api_key>");
      console.error("   WATSONX_PROJECT_ID=<your_watsonx_project_id>");
      throw new Error(`Watson AI initialization failed: ${error.message}`);
    }
  }

  async classifyIntent(
    userPrompt,
    existingFeatures = [],
    projectConstraints = {},
    blueprintDimensions = null
  ) {
    await this.initialize();

    const prompt = `You are an expert urban planner AI assistant. Analyze the user's request and extract urban planning intent.

USER REQUEST: "${userPrompt}"

EXISTING CITY FEATURES: ${JSON.stringify(
      existingFeatures.map((f) => ({
        type: f.type,
        subtype: f.subtype,
        location: f.geometry,
      })),
      null,
      2
    )}

PROJECT CONSTRAINTS: ${JSON.stringify(projectConstraints, null, 2)}

${blueprintDimensions ? `BLUEPRINT BOUNDS: ${blueprintDimensions.width} x ${blueprintDimensions.height} ${blueprintDimensions.unit}
Coordinate Range: X(-${blueprintDimensions.width/2} to ${blueprintDimensions.width/2}), Y(-${blueprintDimensions.height/2} to ${blueprintDimensions.height/2})` : 'No blueprint bounds defined'}

Please analyze the request and respond with a JSON object containing:
{
  "intent": "add_park|add_residential_zone|add_commercial_district|add_road|add_building|add_water_body|get_recommendations",
  "feature_type": "park|zone|road|building|water_body|service",
  "feature_subtype": "public|residential|commercial|mixed_use|local|highway|lake|river|etc",
  "size": "small|medium|large|extra_large",
  "location_preference": "center|north|south|east|west|near_X|avoid_Y",
  "quantity": number,
  "geometry_type": "point|linestring|polygon",
  "constraints": ["sustainability", "accessibility", "cost_effective", etc],
  "priority": "low|medium|high",
  "reasoning": "explanation of urban planning decisions",
  "considerations": ["traffic flow", "environmental impact", "zoning", etc]
}

Focus on urban planning best practices, sustainability, and optimal city development.`;

    try {
      const params = {
        input: prompt,
        modelId: this.modelId,
        projectId: this.projectId,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.3,
          top_p: 0.9,
          repetition_penalty: 1.1,
          stop_sequences: ["\n\n"],
        },
      };

      const response = await this.watsonxAI.generateText(params);
      const generatedText = response.result.results[0].generated_text.trim();

      // Parse JSON response from AI
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const intentData = JSON.parse(jsonMatch[0]);
        console.log("🧠 Watson AI Intent Classification:", intentData);
        return intentData;
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    } catch (error) {
      console.error("❌ Watson intent classification failed:", error);
      // Fallback to basic intent structure
      return this.getFallbackIntent(userPrompt);
    }
  }

  async generateFeatureLayout(intent, cityContext, existingFeatures = [], blueprintDimensions = null) {
    await this.initialize();

    const prompt = `You are an expert urban planner AI. Generate optimal coordinates and layout for city features.

INTENT: ${JSON.stringify(intent, null, 2)}

CITY CONTEXT: ${JSON.stringify(cityContext, null, 2)}

EXISTING FEATURES: ${JSON.stringify(
      existingFeatures.slice(-10),
      null,
      2
    )} // Last 10 features for context

${blueprintDimensions ? `BLUEPRINT CONSTRAINTS:
- Width: ${blueprintDimensions.width} ${blueprintDimensions.unit}
- Height: ${blueprintDimensions.height} ${blueprintDimensions.unit}
- X coordinate range: ${-blueprintDimensions.width/2} to ${blueprintDimensions.width/2}
- Y coordinate range: ${-blueprintDimensions.height/2} to ${blueprintDimensions.height/2}
- ALL coordinates MUST be within these bounds
- Consider optimal placement within the blueprint area` : 'No blueprint constraints defined'}

CITY BOUNDS: {"minX": 0, "maxX": 100, "minY": 0, "maxY": 100}

Generate ${
      intent.quantity || 1
    } feature(s) following urban planning principles. Consider:
- Optimal placement based on existing infrastructure
- Traffic flow and accessibility
- Environmental impact and sustainability
- Zoning regulations and land use efficiency
- Proximity to complementary features
- Avoiding conflicts with existing structures

Respond with a JSON array of features:
[
  {
    "id": "unique_id",
    "type": "${intent.feature_type}",
    "subtype": "${intent.feature_subtype}",
    "name": "descriptive name",
    "description": "AI reasoning for this placement",
    "geometry": {
      "type": "${intent.geometry_type}",
      "coordinates": coordinate_data_based_on_geometry_type
    },
    "metadata": {
      "ai_generated": true,
      "confidence": "high|medium|low",
      "detection_method": "watsonx_ai",
      "size": "${intent.size}",
      "location_preference": "${intent.location_preference}",
      "urban_planning_score": number_0_to_100,
      "reasoning": "detailed placement reasoning"
    }
  }
]

For geometry coordinates:
- point: {"x": number, "y": number}
- linestring: [{"x": number, "y": number}, ...]
- polygon: [[{"x": number, "y": number}, ...]] (array of rings)

Ensure realistic sizes and shapes appropriate for the feature type.`;

    try {
      const params = {
        input: prompt,
        modelId: this.modelId,
        projectId: this.projectId,
        parameters: {
          max_new_tokens: 1000,
          temperature: 0.4,
          top_p: 0.9,
          repetition_penalty: 1.1,
        },
      };

      console.log("🤖 Watson AI Feature Generation:", params);

      const response = await this.watsonxAI.generateText(params);
      const generatedText = response.result.results[0].generated_text.trim();

      console.log("🤖 Watson AI Feature Generation Response:", response);
      // Parse JSON response from AI
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const features = JSON.parse(jsonMatch[0]);
        console.log(`🏗️ Watson AI Generated ${features.length} features`);
        return features;
      } else {
        throw new Error("Failed to parse AI response as JSON array");
      }
    } catch (error) {
      console.error("❌ Watson feature generation failed:", error);
      // Fallback to basic feature generation
      return this.getFallbackFeatures(intent, existingFeatures);
    }
  }

  async generateRationale(intent, generatedFeatures, cityContext) {
    await this.initialize();

    const prompt = `You are an expert urban planner. Explain the reasoning behind these urban planning decisions.

INTENT: ${JSON.stringify(intent, null, 2)}
GENERATED FEATURES: ${JSON.stringify(generatedFeatures, null, 2)}
CITY CONTEXT: ${JSON.stringify(cityContext, null, 2)}

Provide a clear, professional explanation of:
1. Why these features were placed in these locations
2. How they align with urban planning best practices
3. Benefits for the city's development
4. Any considerations for future expansion

Keep the response conversational but informative, as if speaking to a city planning client.`;

    try {
      const params = {
        input: prompt,
        modelId: this.modelId,
        projectId: this.projectId,
        parameters: {
          max_new_tokens: 300,
          temperature: 0.5,
          top_p: 0.9,
        },
      };

      const response = await this.watsonxAI.generateText(params);
      const rationale = response.result.results[0].generated_text.trim();

      console.log("📝 Watson AI Generated Rationale");
      return rationale;
    } catch (error) {
      console.error("❌ Watson rationale generation failed:", error);
      return this.getFallbackRationale(intent, generatedFeatures);
    }
  }

  // Fallback methods for when Watson AI fails
  getFallbackIntent(userPrompt) {
    const prompt = userPrompt.toLowerCase();

    let intent = "get_recommendations";
    let feature_type = "zone";
    let feature_subtype = "mixed_use";

    if (prompt.includes("park") || prompt.includes("green")) {
      intent = "add_park";
      feature_type = "park";
      feature_subtype = "public";
    } else if (prompt.includes("residential") || prompt.includes("housing")) {
      intent = "add_residential_zone";
      feature_type = "zone";
      feature_subtype = "residential";
    } else if (prompt.includes("commercial") || prompt.includes("business")) {
      intent = "add_commercial_district";
      feature_type = "zone";
      feature_subtype = "commercial";
    } else if (prompt.includes("road") || prompt.includes("street")) {
      intent = "add_road";
      feature_type = "road";
      feature_subtype = "local";
    }

    return {
      intent,
      feature_type,
      feature_subtype,
      size: prompt.includes("large") ? "large" : "medium",
      location_preference: "center",
      quantity: 1,
      geometry_type: feature_type === "road" ? "linestring" : "polygon",
      constraints: [],
      priority: "medium",
      reasoning: "Fallback classification due to AI service unavailability",
    };
  }

  getFallbackFeatures(intent, existingFeatures) {
    // Simple fallback feature generation
    const feature = {
      id: `${intent.feature_type}_${Date.now()}_fallback`,
      type: intent.feature_type,
      subtype: intent.feature_subtype,
      name: `${intent.feature_subtype} ${intent.feature_type}`,
      description:
        "Fallback feature generated due to AI service unavailability",
      geometry: {
        type: intent.geometry_type || "polygon",
        coordinates:
          intent.geometry_type === "polygon"
            ? [
                [
                  { x: 45, y: 45 },
                  { x: 55, y: 45 },
                  { x: 55, y: 55 },
                  { x: 45, y: 55 },
                  { x: 45, y: 45 },
                ],
              ]
            : [{ x: 50, y: 50 }],
      },
      metadata: {
        ai_generated: false,
        confidence: "low",
        detection_method: "fallback",
        size: intent.size,
        reasoning: "Generated using fallback method",
      },
    };

    return [feature];
  }

  getFallbackRationale(intent, generatedFeatures) {
    return `Generated ${generatedFeatures.length} ${intent.feature_type}(s) based on your request. Due to AI service unavailability, basic placement logic was used. The features follow standard urban planning principles for optimal city development.`;
  }
}

module.exports = new WatsonPlannerService();
