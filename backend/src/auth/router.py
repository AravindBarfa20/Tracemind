from typing import Annotated
from fastapi import APIRouter, Depends, status
from src.auth.dependencies import get_auth_service, get_current_user
from src.auth.models import User
from src.auth.schemas import (
    TokenRefreshRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from src.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: UserCreate,
    service: Annotated[AuthService, Depends(get_auth_service)],
):
    """Registers a new user profile on the platform."""
    return await service.register(data)

@router.post("/login", response_model=TokenResponse)
async def login(
    data: UserLogin,
    service: Annotated[AuthService, Depends(get_auth_service)],
):
    """Authenticates credentials and issues a set of JSON Web Tokens."""
    return await service.login(data)

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    data: TokenRefreshRequest,
    service: Annotated[AuthService, Depends(get_auth_service)],
):
    """Issues new tokens using a valid refresh token."""
    return await service.refresh_token(data.refresh_token)

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Fetches the profile metadata of the currently authenticated user."""
    return UserResponse.model_validate(current_user)
