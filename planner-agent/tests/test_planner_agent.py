"""
Test suite for Planner Agent
Basic tests for hackathon validation
"""

import pytest
import asyncio
import os
from unittest.mock import Mock, patch
from src.planner_agent import PlannerAgent, PlannerRequest

@pytest.fixture
def mock_env_vars():
    """Mock environment variables for testing"""
    with patch.dict(os.environ, {
        'IBM_WATSONX_API_KEY': 'test_key',
        'IBM_WATSONX_URL': 'https://test.ml.cloud.ibm.com',
        'IBM_WATSONX_PROJECT_ID': 'test-project-id',
        'MODEL_NAME': 'ibm/granite-3-2-8b-instruct'
    }):
        yield

@pytest.fixture
def planner_agent(mock_env_vars):
    """Create a mock planner agent for testing"""
    with patch('src.planner_agent.APIClient'), \
         patch('src.planner_agent.ModelInference') as mock_model:
        
        mock_model.return_value.generate_text.return_value = "Test response"
        agent = PlannerAgent()
        return agent

class TestPlannerAgent:
    """Test cases for PlannerAgent"""
    
    def test_initialization(self, planner_agent):
        """Test agent initializes correctly"""
        assert planner_agent.model_name == 'ibm/granite-3-2-8b-instruct'
        assert planner_agent.api_key == 'test_key'
        assert planner_agent.project_id == 'test-project-id'
        assert isinstance(planner_agent.tools, dict)
        assert isinstance(planner_agent.sessions, dict)
    
    def test_session_management(self, planner_agent):
        """Test session creation and retrieval"""
        session_id = "test_session"
        
        # Create new session
        memory1 = planner_agent.get_or_create_session(session_id)
        assert session_id in planner_agent.sessions
        
        # Retrieve existing session
        memory2 = planner_agent.get_or_create_session(session_id)
        assert memory1 is memory2
    
    def test_tool_registration(self, planner_agent):
        """Test tool registration functionality"""
        def mock_tool(data):
            return {"result": "test"}
        
        planner_agent.register_tool("test_tool", mock_tool)
        assert "test_tool" in planner_agent.tools
        assert planner_agent.tools["test_tool"] == mock_tool
    
    def test_intent_classification(self, planner_agent):
        """Test user intent classification"""
        user_prompt = "Add a green space in the downtown area"
        
        intent = planner_agent.classify_intent(user_prompt)
        
        assert isinstance(intent, dict)
        assert "intent" in intent
        assert "priority" in intent
    
    def test_layout_changes_generation(self, planner_agent):
        """Test layout change generation"""
        intent = {
            "intent": "add_zone",
            "zone_type": "green_space",
            "location": "downtown",
            "priority": "high"
        }
        
        changes = planner_agent.plan_layout_changes(intent)
        
        assert isinstance(changes, list)
        assert len(changes) > 0
        assert changes[0]["action"] == "add"
        assert changes[0]["type"] == "green_space"
    
    @pytest.mark.asyncio
    async def test_process_request(self, planner_agent):
        """Test main request processing pipeline"""
        request = PlannerRequest(
            user_prompt="Add residential area near the park",
            session_id="test_session"
        )
        
        response = await planner_agent.process_request(request)
        
        assert response.session_id == "test_session"
        assert isinstance(response.tool_invocations, list)
        assert isinstance(response.rationale, str)
        assert isinstance(response.layout_changes, list)
    
    def test_health_check(self, planner_agent):
        """Test health check functionality"""
        health = planner_agent.health_check()
        
        assert "status" in health
        assert "model" in health
        assert health["model"] == "ibm/granite-3-2-8b-instruct"

if __name__ == "__main__":
    pytest.main([__file__])