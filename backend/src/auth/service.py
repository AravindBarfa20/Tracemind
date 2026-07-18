import uuid
from src.auth.repository import UserRepository
from src.auth.schemas import UserCreate, UserLogin, UserResponse, TokenResponse
from src.core.exceptions import ConflictException, UnauthorizedException, NotFoundException
from src.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token
)

class AuthService:
    """Orchestrates authentication workflow and enforces domain business rules."""

    def __init__(self, repository: UserRepository):
        self.repository = repository

    async def register(self, data: UserCreate) -> UserResponse:
        """Registers a new user, ensuring email uniqueness and hashing passwords."""
        existing_user = await self.repository.get_by_email(data.email)
        if existing_user:
            raise ConflictException(f"User with email '{data.email}' already exists")

        hashed = hash_password(data.password)
        user_dict = {
            "email": data.email,
            "full_name": data.full_name,
            "hashed_password": hashed,
            "role": "engineer",  # default role
        }
        
        user = await self.repository.create(user_dict)
        return UserResponse.model_validate(user)

    async def login(self, data: UserLogin) -> TokenResponse:
        """Validates credentials and returns fresh access + refresh token pairs."""
        user = await self.repository.get_by_email(data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise UnauthorizedException("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedException("User account has been deactivated")

        payload = {"sub": str(user.id), "email": user.email, "role": user.role}
        access = create_access_token(payload)
        refresh = create_refresh_token(payload)

        return TokenResponse(
            access_token=access,
            refresh_token=refresh,
        )

    async def refresh_token(self, refresh_token: str) -> TokenResponse:
        """Decodes refresh token and generates a new access token if valid."""
        payload = verify_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid or expired refresh token")

        user_id_str = payload.get("sub")
        if not user_id_str:
            raise UnauthorizedException("Invalid token payload")

        user_id = uuid.UUID(user_id_str)
        user = await self.repository.get_by_id(user_id)
        if not user or not user.is_active:
            raise UnauthorizedException("User session is inactive or invalid")

        new_payload = {"sub": str(user.id), "email": user.email, "role": user.role}
        new_access = create_access_token(new_payload)
        new_refresh = create_refresh_token(new_payload)  # Rotate refresh token

        return TokenResponse(
            access_token=new_access,
            refresh_token=new_refresh,
        )

    async def get_profile(self, user_id: uuid.UUID) -> UserResponse:
        """Returns the profile information of a user."""
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise NotFoundException("User profile not found")
        return UserResponse.model_validate(user)
