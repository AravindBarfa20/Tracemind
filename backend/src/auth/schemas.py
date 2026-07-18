import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class UserCreate(BaseModel):
    """Schema for registering a new user."""
    email: EmailStr = Field(..., description="Unique email address of the user")
    full_name: str = Field(..., min_length=1, max_length=255, description="Full name of the user")
    password: str = Field(..., min_length=8, description="Password with minimum 8 characters")


class UserLogin(BaseModel):
    """Schema for user login credentials."""
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")


class UserResponse(BaseModel):
    """Standardized response schema containing user profile details."""
    id: uuid.UUID
    email: EmailStr
    full_name: str
    is_active: bool
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """Response containing access and refresh JWT tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefreshRequest(BaseModel):
    """Payload to refresh an expired access token."""
    refresh_token: str
