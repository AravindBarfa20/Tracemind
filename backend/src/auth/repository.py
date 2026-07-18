import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.auth.models import User

class UserRepository:
    """Handles low-level database operations for the User entity."""
    
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        """Fetches a single user by their primary UUID."""
        query = select(User).where(User.id == user_id)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_by_email(self, email: str) -> Optional[User]:
        """Fetches a single user by their unique email."""
        # Lowercase email for case-insensitive matches
        query = select(User).where(User.email == email.lower())
        result = await self.session.execute(query)
        return result.scalars().first()

    async def create(self, user_data: dict) -> User:
        """Saves a new user instance to the session registry."""
        # Ensure email is lowercased
        if "email" in user_data:
            user_data["email"] = user_data["email"].lower()
            
        user = User(**user_data)
        self.session.add(user)
        await self.session.flush()
        return user

    async def update(self, user_id: uuid.UUID, data: dict) -> Optional[User]:
        """Applies updates to an existing user."""
        user = await self.get_by_id(user_id)
        if not user:
            return None
            
        for key, value in data.items():
            if key == "email" and value:
                value = value.lower()
            setattr(user, key, value)
            
        self.session.add(user)
        await self.session.flush()
        return user

    async def list_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Retrieves a paginated list of users."""
        query = select(User).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())
