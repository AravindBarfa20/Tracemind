import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.incidents.models import Incident

class IncidentRepository:
    """Handles low-level CRUD operations for system incident records."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, incident_id: uuid.UUID) -> Optional[Incident]:
        query = select(Incident).where(Incident.id == incident_id)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def create(self, data: dict) -> Incident:
        incident = Incident(**data)
        self.session.add(incident)
        await self.session.flush()
        return incident

    async def update_status(self, incident_id: uuid.UUID, status: str) -> Optional[Incident]:
        incident = await self.get_by_id(incident_id)
        if not incident:
            return None
        incident.status = status
        if status == "resolved":
            incident.resolved_at = datetime.utcnow()
        else:
            incident.resolved_at = None
            
        self.session.add(incident)
        await self.session.flush()
        return incident

    async def list_by_service(
        self,
        service_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Incident]:
        query = select(Incident)
        if service_id:
            query = query.where(Incident.service_id == service_id)
        if status:
            query = query.where(Incident.status == status)
            
        query = query.order_by(Incident.created_at.desc()).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())
