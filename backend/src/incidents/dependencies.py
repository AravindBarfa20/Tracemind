from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.incidents.repository import IncidentRepository
from src.incidents.service import IncidentService

async def get_incident_repository(
    db: Annotated[AsyncSession, Depends(get_db)]
) -> IncidentRepository:
    return IncidentRepository(db)

async def get_incident_service(
    repo: Annotated[IncidentRepository, Depends(get_incident_repository)]
) -> IncidentService:
    return IncidentService(repo)
