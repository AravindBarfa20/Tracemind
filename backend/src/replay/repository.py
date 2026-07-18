import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.replay.models import ReplaySession

class ReplayRepository:
    """Handles CRUD operations for session replay captures."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, session_id: uuid.UUID) -> Optional[ReplaySession]:
        query = select(ReplaySession).where(ReplaySession.id == session_id)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def create(self, data: dict) -> ReplaySession:
        session = ReplaySession(**data)
        self.session.add(session)
        await self.session.flush()
        return session

    async def list_by_service(self, service_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[ReplaySession]:
        query = select(ReplaySession).where(ReplaySession.service_id == service_id).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())
