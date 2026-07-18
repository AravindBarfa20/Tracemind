import uuid
from typing import List, Optional, Tuple
from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from src.services_registry.models import Service

class ServiceRepository:
    """Handles low-level CRUD operations for Service entities."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, service_id: uuid.UUID) -> Optional[Service]:
        """Fetches a service by its primary UUID."""
        query = select(Service).where(Service.id == service_id)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_by_slug(self, project_id: uuid.UUID, slug: str) -> Optional[Service]:
        """Fetches a service within a project by its slug."""
        query = select(Service).where(
            Service.project_id == project_id,
            Service.slug == slug
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def create(self, data: dict) -> Service:
        """Saves a new service registration to the DB."""
        # Map metadata to metadata_ internally
        if "metadata" in data:
            data["metadata_"] = data.pop("metadata")
            
        service = Service(**data)
        self.session.add(service)
        await self.session.flush()
        return service

    async def update(self, service_id: uuid.UUID, data: dict) -> Optional[Service]:
        """Applies updates to an existing service profile."""
        service = await self.get_by_id(service_id)
        if not service:
            return None
            
        if "metadata" in data:
            data["metadata_"] = data.pop("metadata")

        for key, value in data.items():
            setattr(service, key, value)
            
        self.session.add(service)
        await self.session.flush()
        return service

    async def delete(self, service_id: uuid.UUID) -> bool:
        """Removes a service record completely (hard delete)."""
        service = await self.get_by_id(service_id)
        if not service:
            return False
        await self.session.delete(service)
        await self.session.flush()
        return True

    async def list_services(
        self,
        project_id: uuid.UUID,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None,
        team: Optional[str] = None,
        environment: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Service], int]:
        """Retrieves a paginated list of services filtered by team, environment, status, or search query.

        Returns a tuple of (items, total_count).
        """
        # Base query
        query = select(Service).where(Service.project_id == project_id)
        count_query = select(func.count(Service.id)).where(Service.project_id == project_id)

        # Filters
        if status:
            query = query.where(Service.status == status)
            count_query = count_query.where(Service.status == status)
        if team:
            query = query.where(Service.team == team)
            count_query = count_query.where(Service.team == team)
        if environment:
            query = query.where(Service.environment == environment)
            count_query = count_query.where(Service.environment == environment)
        if search:
            search_filter = or_(
                Service.name.ilike(f"%{search}%"),
                Service.slug.ilike(f"%{search}%"),
                Service.description.ilike(f"%{search}%"),
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        # Count total
        total_result = await self.session.execute(count_query)
        total = total_result.scalar_one()

        # Fetch records
        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        items = list(result.scalars().all())

        return items, total
