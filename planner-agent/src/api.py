"""
FastAPI server for Planner Agent
Provides REST endpoints for team integration
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from planner_agent import PlannerAgent, PlannerRequest, PlannerResponse

# Initialize FastAPI app
app = FastAPI(
    title="Planner Agent API",
    description="Central reasoning brain for Agentic City Planner",
    version="1.0.0"
)

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize planner agent
planner = PlannerAgent()

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Planner Agent API is running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return planner.health_check()

@app.post("/plan", response_model=PlannerResponse)
async def process_planning_request(request: PlannerRequest):
    """
    Main endpoint for processing city planning requests
    
    Expected input from Dev E (Frontend):
    - user_prompt: Natural language request
    - context: Optional context from previous interactions
    - session_id: Optional session identifier
    
    Returns:
    - tool_invocations: List of tools to invoke
    - rationale: Explanation of decisions
    - layout_changes: Specific change instructions
    """
    try:
        response = await planner.process_request(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/register-tool")
async def register_external_tool(tool_name: str, endpoint_url: str):
    """
    Register external tool for orchestration
    Used by other team members (Dev B, C, D) to register their services
    """
    try:
        # In real implementation, this would create HTTP client for the tool
        # For hackathon, we'll simulate tool registration
        planner.tools[tool_name] = {
            "endpoint": endpoint_url,
            "status": "registered"
        }
        return {"message": f"Tool {tool_name} registered successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/tools")
async def list_registered_tools():
    """List all registered tools"""
    return {"tools": list(planner.tools.keys())}

@app.get("/sessions/{session_id}/history")
async def get_session_history(session_id: str):
    """Get conversation history for a session"""
    if session_id in planner.sessions:
        memory = planner.sessions[session_id]
        messages = memory.chat_memory.messages
        return {
            "session_id": session_id,
            "messages": [{"type": type(msg).__name__, "content": msg.content} for msg in messages]
        }
    else:
        raise HTTPException(status_code=404, detail="Session not found")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("src.api:app", host="0.0.0.0", port=port, reload=True)