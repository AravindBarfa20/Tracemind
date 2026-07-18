from typing import Annotated, List, Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.telemetry.dependencies import get_telemetry_service
from src.telemetry.schemas import (
    LogCreate,
    LogResponse,
    SpanCreate,
    SpanResponse,
    MetricCreate,
    MetricResponse,
)
from src.telemetry.service import TelemetryService

router = APIRouter(prefix="/telemetry", tags=["Telemetry Collection"])

@router.post("/logs", response_model=LogResponse, status_code=status.HTTP_201_CREATED)
async def ingest_log(
    data: LogCreate,
    service: Annotated[TelemetryService, Depends(get_telemetry_service)],
):
    """Ingests a structured log entry from observed microservice client."""
    return await service.ingest_log(data)

@router.post("/traces", response_model=SpanResponse, status_code=status.HTTP_201_CREATED)
async def ingest_trace(
    data: SpanCreate,
    service: Annotated[TelemetryService, Depends(get_telemetry_service)],
):
    """Ingests a trace span event payload conforming to OpenTelemetry specification."""
    return await service.ingest_span(data)

@router.post("/metrics", response_model=MetricResponse, status_code=status.HTTP_201_CREATED)
async def ingest_metric(
    data: MetricCreate,
    service: Annotated[TelemetryService, Depends(get_telemetry_service)],
):
    """Ingests time-series metric value counters."""
    return await service.ingest_metric(data)

# Query endpoints

@router.get("/logs", response_model=List[LogResponse])
async def search_logs(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[TelemetryService, Depends(get_telemetry_service)],
    service_id: Optional[uuid.UUID] = Query(None),
    level: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, le=1000),
):
    """Searches structured log records based on query filter inputs."""
    return await service.get_logs(service_id, level, search, limit)

@router.get("/traces", response_model=List[SpanResponse])
async def search_traces(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[TelemetryService, Depends(get_telemetry_service)],
    service_id: Optional[uuid.UUID] = Query(None),
    trace_id: Optional[str] = Query(None),
    limit: int = Query(100, le=1000),
):
    """Retrieves list of distributed traces or trace spans query details."""
    return await service.get_traces(service_id, trace_id, limit)

@router.get("/metrics/summary", response_model=List[MetricResponse])
async def query_metrics(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[TelemetryService, Depends(get_telemetry_service)],
    service_id: uuid.UUID = Query(...),
    metric_name: str = Query(...),
    limit: int = Query(100, le=500),
):
    """Fetches metric timeline history summary for Recharts visualization."""
    return await service.get_metrics_timeline(service_id, metric_name, limit)
