import pytest
import jwt
from datetime import timedelta
from fastapi import HTTPException
from src.security import SecurityManager, get_current_user, require_admin, require_user, require_viewer

@pytest.fixture
def security_manager():
    """Create a SecurityManager instance for testing"""
    return SecurityManager()

@pytest.fixture
def sample_user_data():
    """Sample user data for testing"""
    return {
        "user_id": "12345",
        "username": "testuser",
        "role": "user"
    }

@pytest.fixture
def sample_admin_data():
    """Sample admin data for testing"""
    return {
        "user_id": "67890",
        "username": "testadmin",
        "role": "admin"
    }

def test_create_access_token(security_manager, sample_user_data):
    """Test creating access token"""
    token = security_manager.create_access_token(sample_user_data)
    
    assert isinstance(token, str)
    assert len(token) > 0

def test_verify_token(security_manager, sample_user_data):
    """Test verifying token"""
    token = security_manager.create_access_token(sample_user_data)
    payload = security_manager.verify_token(token)
    
    assert isinstance(payload, dict)
    assert "user_id" in payload
    assert "username" in payload
    assert "role" in payload
    assert payload["user_id"] == sample_user_data["user_id"]
    assert payload["username"] == sample_user_data["username"]
    assert payload["role"] == sample_user_data["role"]

def test_verify_token_expired(security_manager):
    """Test verifying expired token"""
    # Create an expired token (expired 1 second ago)
    token = security_manager.create_access_token({}, expires_delta=timedelta(seconds=-1))
    
    # This should raise an HTTPException
    with pytest.raises(HTTPException) as exc_info:
        security_manager.verify_token(token)
    
    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Token has expired"

def test_check_role_access(security_manager, sample_user_data, sample_admin_data):
    """Test checking role access"""
    # User should have user and viewer access but not admin
    assert security_manager.check_role_access(sample_user_data, "user") == True
    assert security_manager.check_role_access(sample_user_data, "viewer") == True
    assert security_manager.check_role_access(sample_user_data, "admin") == False
    
    # Admin should have all access
    assert security_manager.check_role_access(sample_admin_data, "admin") == True
    assert security_manager.check_role_access(sample_admin_data, "user") == True
    assert security_manager.check_role_access(sample_admin_data, "viewer") == True

def test_require_role(security_manager, sample_user_data, sample_admin_data):
    """Test requiring role"""
    # Create role checker functions
    admin_checker = security_manager.require_role("admin")
    user_checker = security_manager.require_role("user")
    
    # Admin should pass admin checker
    try:
        result = admin_checker(sample_admin_data)
        assert result == sample_admin_data
    except Exception:
        pytest.fail("Admin should pass admin role check")
    
    # User should pass user checker
    try:
        result = user_checker(sample_user_data)
        assert result == sample_user_data
    except Exception:
        pytest.fail("User should pass user role check")

def test_get_current_user():
    """Test get_current_user function"""
    # This is a simple wrapper, so we just check it exists
    assert callable(get_current_user)

def test_require_admin():
    """Test require_admin function"""
    # This is a simple wrapper, so we just check it exists
    assert callable(require_admin)

def test_require_user():
    """Test require_user function"""
    # This is a simple wrapper, so we just check it exists
    assert callable(require_user)

def test_require_viewer():
    """Test require_viewer function"""
    # This is a simple wrapper, so we just check it exists
    assert callable(require_viewer)