from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.telemetry.repository import TelemetryRepository
from src.telemetry.service import TelemetryService

async def get_telemetry_repository(
    db: Annotated[AsyncSession, Depends(get_db)]
) -> TelemetryRepository:
    return TelemetryRepository(db)

async def get_telemetry_service(
    repo: Annotated[TelemetryRepository, Depends(get_telemetry_repository)]
) -> TelemetryService:
    return TelemetryService(repo)
