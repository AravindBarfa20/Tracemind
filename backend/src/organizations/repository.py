import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.organizations.models import Organization

class OrganizationRepository:
    """Handles low-level database operations for the Organization entity."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, org_id: uuid.UUID) -> Optional[Organization]:
        """Fetches a single organization by its primary UUID."""
        query = select(Organization).where(Organization.id == org_id)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_by_slug(self, slug: str) -> Optional[Organization]:
        """Fetches a single organization by its slug."""
        query = select(Organization).where(Organization.slug == slug)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def create(self, data: dict) -> Organization:
        """Saves a new organization instance to the DB."""
        org = Organization(**data)
        self.session.add(org)
        await self.session.flush()
        return org

    async def update(self, org_id: uuid.UUID, data: dict) -> Optional[Organization]:
        """Applies updates to an existing organization."""
        org = await self.get_by_id(org_id)
        if not org:
            return None
            
        for key, value in data.items():
            setattr(org, key, value)
            
        self.session.add(org)
        await self.session.flush()
        return org

    async def list_all(self, skip: int = 0, limit: int = 100) -> List[Organization]:
        """Retrieves a paginated list of all organizations."""
        query = select(Organization).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())
