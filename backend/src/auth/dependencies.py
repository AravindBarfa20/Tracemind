import uuid
from typing import Annotated
from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.auth.models import User
from src.auth.repository import UserRepository
from src.auth.service import AuthService
from src.core.database import get_db
from src.core.exceptions import UnauthorizedException
from src.core.security import get_token_payload
from src.organizations.models import Organization
from src.projects.models import Project

async def get_user_repository(
    db: Annotated[AsyncSession, Depends(get_db)]
) -> UserRepository:
    """Dependency injection wrapper for UserRepository."""
    return UserRepository(db)

async def get_auth_service(
    repo: Annotated[UserRepository, Depends(get_user_repository)]
) -> AuthService:
    """Dependency injection wrapper for AuthService."""
    return AuthService(repo)

async def get_current_user(
    payload: Annotated[dict, Depends(get_token_payload)],
    repo: Annotated[UserRepository, Depends(get_user_repository)],
) -> User:
    """Dependency that resolves the active user from the JWT sub claim.

    Raises HTTP 401 if user is not found or deactivated.
    """
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedException("Token payload missing sub claim")

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError as e:
        raise UnauthorizedException("Invalid user ID format in token") from e

    user = await repo.get_by_id(user_id)
    if not user:
        raise UnauthorizedException("Associated user account not found")

    if not user.is_active:
        raise UnauthorizedException("Associated user account is deactivated")

    # Auto-provision default Organization and Project if none exists
    db = repo.session
    org_stmt = select(Organization).where(Organization.owner_id == user.id)
    org_res = await db.execute(org_stmt)
    org = org_res.scalars().first()

    if not org:
        org = Organization(
            name="Default Organization",
            slug=f"default-org-{str(user.id)[:8]}",
            owner_id=user.id,
        )
        db.add(org)
        await db.flush()

    project_stmt = select(Project).where(Project.organization_id == org.id)
    project_res = await db.execute(project_stmt)
    project = project_res.scalars().first()

    if not project:
        project = Project(
            name="Default Project",
            slug="default-project",
            organization_id=org.id,
        )
        db.add(project)
        await db.flush()
        
    await db.commit()

    # Dynamically bind active organization and project context on user model
    user.active_project_id = project.id
    user.active_organization_id = org.id

    return user

