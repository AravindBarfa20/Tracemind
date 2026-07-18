import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.projects.models import Project

class ProjectRepository:
    """Handles database CRUD operations for the Project entity."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, project_id: uuid.UUID) -> Optional[Project]:
        """Fetches a project by its primary UUID key."""
        query = select(Project).where(Project.id == project_id)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_by_slug(self, org_id: uuid.UUID, slug: str) -> Optional[Project]:
        """Fetches a project by organization ID and project slug."""
        query = select(Project).where(
            Project.organization_id == org_id,
            Project.slug == slug
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def create(self, data: dict) -> Project:
        """Saves a new project record to the database."""
        project = Project(**data)
        self.session.add(project)
        await self.session.flush()
        return project

    async def update(self, project_id: uuid.UUID, data: dict) -> Optional[Project]:
        """Applies updates to an existing project."""
        project = await self.get_by_id(project_id)
        if not project:
            return None
            
        for key, value in data.items():
            setattr(project, key, value)
            
        self.session.add(project)
        await self.session.flush()
        return project

    async def list_by_org(self, org_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Project]:
        """Retrieves a paginated list of all projects within an organization."""
        query = select(Project).where(Project.organization_id == org_id).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())
