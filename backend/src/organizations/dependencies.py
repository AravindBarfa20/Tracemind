from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.organizations.repository import OrganizationRepository
from src.organizations.service import OrganizationService

async def get_organization_repository(
    db: Annotated[AsyncSession, Depends(get_db)]
) -> OrganizationRepository:
    """Dependency injection wrapper for OrganizationRepository."""
    return OrganizationRepository(db)

async def get_organization_service(
    repo: Annotated[OrganizationRepository, Depends(get_organization_repository)]
) -> OrganizationService:
    """Dependency injection wrapper for OrganizationService."""
    return OrganizationService(repo)
