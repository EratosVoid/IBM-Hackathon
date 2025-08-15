# IBM Watson AI Integration for Urban Planning

## Overview

The city planner API now integrates with IBM Watson's `granite-3-2-8b-instruct` model to provide intelligent urban planning capabilities. This replaces the previous rule-based approach with AI-driven decision making.

## Features Implemented

### 🧠 AI-Powered Intent Classification

- Natural language understanding for complex urban planning requests
- Context-aware analysis considering existing city features
- Support for nuanced requirements (sustainability, accessibility, etc.)

### 🏗️ Intelligent Coordinate Generation

- AI-driven spatial reasoning for optimal feature placement
- Urban planning best practices built into decision making
- Context-aware sizing and positioning based on surrounding elements

### 📝 Smart Rationale Generation

- Professional explanations of urban planning decisions
- Client-ready descriptions of placement reasoning
- Integration with city context and project constraints

## Configuration

### Environment Variables Required

```bash
# IBM watsonx.ai Configuration (IBM SDK Standard Format)
WATSONX_AI_AUTH_TYPE="iam"
WATSONX_API_KEY="your_ibm_cloud_api_key"
WATSONX_PROJECT_ID="your_watsonx_project_id"
WATSONX_URL="https://us-south.ml.cloud.ibm.com"
```

### Setup Steps

1. Copy `.env.example` to `.env`
2. Obtain IBM Cloud API key from IBM Cloud Console
3. Create a watsonx.ai project and get the project ID
4. Fill in the environment variables
5. Restart the server

## Architecture

### File Structure

```
api/
├── services/
│   ├── watsonService.js      # Watson AI integration service
│   └── plannerAgent.js       # AI-powered planner logic
├── routes/
│   └── planner.js           # Enhanced with async AI calls
└── .env.example             # Environment configuration template
```

### Service Flow

1. **User Request** → `/api/planner/prompt`
2. **Intent Classification** → Watson AI analyzes request
3. **Feature Generation** → AI determines optimal placement
4. **Rationale Generation** → AI explains decisions
5. **Database Update** → Features saved to project
6. **Response** → Frontend receives structured data

## API Usage

### Request Format

```javascript
POST /api/planner/prompt
{
  "message": "Add a large park in the center with playground facilities",
  "projectId": 123,
  "context": {}
}
```

### Enhanced Response Format

```javascript
{
  "success": true,
  "message": "AI agent processed request successfully",
  "response": {
    "id": 1734267890123,
    "user_prompt": "Add a large park in the center with playground facilities",
    "project_id": 123,
    "agent_response": "I've designed a large central park with playground facilities...",
    "reasoning": "Detailed AI explanation of placement decisions",
    "generated_features": [
      {
        "id": "park_1734267890123_0",
        "type": "park",
        "subtype": "public",
        "name": "Central Community Park",
        "description": "AI-generated public park with playground facilities",
        "geometry": {
          "type": "polygon",
          "coordinates": [[...]]
        },
        "metadata": {
          "ai_generated": true,
          "detection_method": "watsonx_ai",
          "urban_planning_score": 95,
          "reasoning": "Optimal placement for community access...",
          "timestamp": "2024-12-15T10:30:00.000Z"
        }
      }
    ],
    "features_added": 1,
    "status": "completed",
    "intent_classified": {
      "intent": "add_park",
      "feature_type": "park",
      "size": "large",
      "location_preference": "center",
      "constraints": ["playground", "accessibility"]
    }
  }
}
```

## Error Handling & Fallbacks

### Robust Error Management

- **Watson AI Service Unavailable**: Falls back to rule-based logic
- **Authentication Errors**: Clear error messages with setup guidance
- **Partial Failures**: Attempts to provide reduced functionality
- **Database Issues**: Graceful degradation with error logging

### Fallback Mechanisms

1. **Primary**: Watson AI `granite-3-2-8b-instruct` model
2. **Secondary**: Rule-based intent classification
3. **Tertiary**: Basic geometric placement algorithms

### Error Types Handled

- `watson_ai_service`: AI service connectivity issues
- `authentication_error`: API key or project ID problems
- `database_error`: Data persistence failures
- `unknown`: General application errors

## Benefits

### For Users

- **Natural Language Interface**: "Add sustainable housing near the park"
- **Intelligent Placement**: AI considers traffic, zoning, accessibility
- **Professional Explanations**: Clear rationale for all decisions
- **Context Awareness**: Decisions based on existing city features

### For Developers

- **Modular Architecture**: Clean separation of AI logic
- **Graceful Degradation**: Always provides some level of service
- **Easy Configuration**: Environment-based setup
- **Comprehensive Logging**: Detailed error tracking and performance monitoring

## Model Capabilities

### IBM Granite 3.2 8B Instruct

- **Model Type**: Large Language Model optimized for instruction following
- **Strengths**: Reasoning, planning, structured output generation
- **Urban Planning Context**: Trained on diverse text including planning principles
- **Output Format**: Structured JSON responses for seamless integration

### Prompt Engineering

- **Intent Classification**: Structured prompts for urban planning understanding
- **Coordinate Generation**: Spatial reasoning with planning constraints
- **Rationale Generation**: Professional explanations with urban planning expertise

## Monitoring & Debugging

### Logging Levels

- `🧠` Watson AI Intent Classification
- `🏗️` Feature Generation with coordinates
- `📝` Rationale generation
- `💾` Database operations
- `🚨` Error conditions and fallbacks
- `✅` Successful operations

### Performance Metrics

- Response times for AI calls
- Fallback usage rates
- Feature generation success rates
- User satisfaction with AI-generated features

## Future Enhancements

### Planned Features

1. **Multi-Step Planning**: Complex requests requiring multiple features
2. **Policy Integration**: Zoning regulations and compliance checking
3. **Environmental Analysis**: Sustainability and impact assessment
4. **Cost Estimation**: Budget-aware feature recommendations
5. **Learning from Feedback**: Continuous improvement based on user interactions

### Integration Opportunities

- **Dev B**: Simulation Engine integration for planning validation
- **Dev C**: Blueprint analysis for context-aware decisions
- **Dev D**: Policy document retrieval for compliance checking
- **Dev E**: Enhanced UI feedback and visualization

## Troubleshooting

### Common Issues

#### Watson AI Not Responding

```bash
# Check environment variables (IBM SDK format)
echo $WATSONX_AI_AUTH_TYPE
echo $WATSONX_API_KEY
echo $WATSONX_PROJECT_ID

# Verify network connectivity
curl -H "Authorization: Bearer $WATSONX_API_KEY" \
  https://us-south.ml.cloud.ibm.com/ml/v1/foundation_model_specs
```

#### Fallback Mode Always Active

- Verify IBM Cloud API key permissions
- Check project ID exists and is accessible
- Review server logs for detailed error messages

#### Features Not Saving

- Check database connection
- Verify user authentication
- Review project permissions

For additional support, check server logs and IBM Cloud Console for detailed error information.
