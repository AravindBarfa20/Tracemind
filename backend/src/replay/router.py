from typing import Annotated, List
import uuid
from fastapi import APIRouter, Depends, Query, status
from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.replay.dependencies import get_replay_service
from src.replay.schemas import (
    ReplaySessionCreate,
    ReplaySessionResponse,
    ReplayRunResponse,
)
from src.replay.service import ReplayService

router = APIRouter(prefix="/replay", tags=["Replay Engine"])

@router.post("/sessions", response_model=ReplaySessionResponse, status_code=status.HTTP_201_CREATED)
async def record_session(
    data: ReplaySessionCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ReplayService, Depends(get_replay_service)],
):
    """Registers a new recorded traffic session for subsequent replay regression testing."""
    return await service.record_session(data)

@router.get("/sessions", response_model=List[ReplaySessionResponse])
async def list_sessions(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ReplayService, Depends(get_replay_service)],
    service_id: uuid.UUID = Query(...),
):
    """Retrieves all recorded replay sessions for an observed microservice."""
    return await service.list_sessions(service_id)

@router.get("/sessions/{session_id}", response_model=ReplaySessionResponse)
async def get_session(
    session_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ReplayService, Depends(get_replay_service)],
):
    """Fetches metadata details of a specific recorded traffic session."""
    return await service.get_session(session_id)

@router.post("/sessions/{session_id}/run", response_model=ReplayRunResponse)
async def run_replay(
    session_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ReplayService, Depends(get_replay_service)],
):
    """Triggers the runner client to execute the recorded session calls and return comparison diffs."""
    return await service.execute_replay(session_id)
