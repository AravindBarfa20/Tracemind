from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.llm.base import LLMProvider
from src.llm.factory import get_llm_provider
from src.telemetry.repository import TelemetryRepository
from src.telemetry.dependencies import get_telemetry_repository
from src.services_registry.repository import ServiceRepository
from src.services_registry.dependencies import get_services_registry_service
from src.incidents.repository import IncidentRepository
from src.incidents.dependencies import get_incident_repository
from src.investigation.service import InvestigationService

async def get_investigation_service(
    llm: Annotated[LLMProvider, Depends(get_llm_provider)],
    telemetry_repo: Annotated[TelemetryRepository, Depends(get_telemetry_repository)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> InvestigationService:
    service_repo = ServiceRepository(db)
    incident_repo = IncidentRepository(db)
    return InvestigationService(llm, telemetry_repo, service_repo, incident_repo)
