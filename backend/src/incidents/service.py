import uuid
from typing import List, Optional
from src.core.exceptions import NotFoundException
from src.incidents.repository import IncidentRepository
from src.incidents.schemas import IncidentCreate, IncidentResponse, IncidentUpdate

class IncidentService:
    """Manages workflows surrounding incident generation, acknowledgment, and resolution."""

    def __init__(self, repository: IncidentRepository):
        self.repository = repository

    async def trigger_incident(self, data: IncidentCreate) -> IncidentResponse:
        incident_dict = data.model_dump()
        incident = await self.repository.create(incident_dict)
        return IncidentResponse.model_validate(incident)

    async def update_incident_status(self, incident_id: uuid.UUID, data: IncidentUpdate) -> IncidentResponse:
        incident = await self.repository.update_status(incident_id, data.status)
        if not incident:
            raise NotFoundException("Incident not found")
        return IncidentResponse.model_validate(incident)

    async def get_incident(self, incident_id: uuid.UUID) -> IncidentResponse:
        incident = await self.repository.get_by_id(incident_id)
        if not incident:
            raise NotFoundException("Incident not found")
        return IncidentResponse.model_validate(incident)

    async def list_incidents(
        self,
        service_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None
    ) -> List[IncidentResponse]:
        incidents = await self.repository.list_by_service(service_id, status)
        return [IncidentResponse.model_validate(i) for i in incidents]
