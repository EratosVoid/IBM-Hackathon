from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os

# Secret key for JWT token generation (in production, this should be stored securely)
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# Initialize HTTP Bearer security scheme
security = HTTPBearer()

class SecurityManager:
    """
    Security Manager for handling authentication and authorization.
    
    This class manages JWT token validation, role-based access control,
    and other security features for the Simulation Engine API.
    """
    
    def __init__(self):
        """Initialize the security manager"""
        self.secret_key = SECRET_KEY
        self.algorithm = ALGORITHM
        self.access_token_expire_minutes = ACCESS_TOKEN_EXPIRE_MINUTES
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """
        Create a JWT access token.
        
        Args:
            data: Data to encode in the token
            expires_delta: Token expiration time
            
        Returns:
            JWT access token string
        """
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
            
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verify a JWT token and return the payload.
        
        Args:
            token: JWT token to verify
            
        Returns:
            Decoded token payload
            
        Raises:
            HTTPException: If token is invalid or expired
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt.JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    def get_current_user(self, credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
        """
        Get the current user from the JWT token.
        
        Args:
            credentials: HTTP authorization credentials containing the token
            
        Returns:
            User information from the token
            
        Raises:
            HTTPException: If token is invalid or expired
        """
        token = credentials.credentials
        payload = self.verify_token(token)
        return payload
    
    def check_role_access(self, user: Dict[str, Any], required_role: str) -> bool:
        """
        Check if a user has the required role for access.
        
        Args:
            user: User information from the token
            required_role: Role required for access
            
        Returns:
            True if user has required role, False otherwise
        """
        user_role = user.get("role", "")
        
        # For simplicity, we'll implement a basic role hierarchy
        # In a real implementation, this would be more complex
        role_hierarchy = {
            "admin": ["admin", "user", "viewer"],
            "user": ["user", "viewer"],
            "viewer": ["viewer"]
        }
        
        return required_role in role_hierarchy.get(user_role, [])
    
    def require_role(self, required_role: str):
        """
        Dependency for requiring a specific role.
        
        Args:
            required_role: Role required for access
            
        Returns:
            Dependency function for FastAPI
        """
        def role_checker(current_user: Dict[str, Any] = Depends(self.get_current_user)):
            if not self.check_role_access(current_user, required_role):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. {required_role} role required."
                )
            return current_user
        
        return role_checker

# Global security manager instance
security_manager = SecurityManager()

# Convenience functions for common security checks
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    return security_manager.get_current_user(credentials)

def require_admin(current_user: Dict[str, Any] = Depends(security_manager.require_role("admin"))):
    """Require admin role for access"""
    return current_user

def require_user(current_user: Dict[str, Any] = Depends(security_manager.require_role("user"))):
    """Require user role for access"""
    return current_user

def require_viewer(current_user: Dict[str, Any] = Depends(security_manager.require_role("viewer"))):
    """Require viewer role for access"""
    return current_user

# Example usage
if __name__ == "__main__":
    # Example of how to use the security manager
    manager = SecurityManager()
    
    # Create a sample token
    sample_data = {
        "user_id": "12345",
        "username": "testuser",
        "role": "user"
    }
    
    token = manager.create_access_token(sample_data)
    print(f"Generated token: {token}")
    
    # Verify the token
    try:
        payload = manager.verify_token(token)
        print(f"Token payload: {payload}")
    except HTTPException as e:
        print(f"Token verification failed: {e.detail}")