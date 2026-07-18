from typing import Annotated
from fastapi import APIRouter, Depends
from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.investigation.dependencies import get_investigation_service
from src.investigation.schemas import DiagnoseRequest, DiagnoseResponse
from src.investigation.service import InvestigationService

router = APIRouter(prefix="/investigation", tags=["AI Investigation"])

@router.post("/diagnose", response_model=DiagnoseResponse)
async def diagnose_issue(
    data: DiagnoseRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[InvestigationService, Depends(get_investigation_service)],
):
    """Triggers SRE AI assistant to analyze telemetry and suggest root-cause resolution fix recommendations."""
    return await service.diagnose_issue(data)
