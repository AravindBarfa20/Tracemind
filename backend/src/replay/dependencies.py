from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.replay.repository import ReplayRepository
from src.replay.service import ReplayService

async def get_replay_repository(
    db: Annotated[AsyncSession, Depends(get_db)]
) -> ReplayRepository:
    return ReplayRepository(db)

async def get_replay_service(
    repo: Annotated[ReplayRepository, Depends(get_replay_repository)]
) -> ReplayService:
    return ReplayService(repo)
