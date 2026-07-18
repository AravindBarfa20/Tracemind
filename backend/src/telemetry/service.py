import uuid
from typing import List, Optional
from src.telemetry.repository import TelemetryRepository
from src.telemetry.schemas import LogCreate, SpanCreate, MetricCreate, LogResponse, SpanResponse, MetricResponse

class TelemetryService:
    """Coordinates log, trace, and metric collection ingestion workflows."""

    def __init__(self, repository: TelemetryRepository):
        self.repository = repository

    async def ingest_log(self, data: LogCreate) -> LogResponse:
        log = await self.repository.create_log(data.model_dump())
        return LogResponse.model_validate(log)

    async def ingest_span(self, data: SpanCreate) -> SpanResponse:
        span = await self.repository.create_span(data.model_dump())
        return SpanResponse.model_validate(span)

    async def ingest_metric(self, data: MetricCreate) -> MetricResponse:
        metric = await self.repository.create_metric(data.model_dump())
        return MetricResponse.model_validate(metric)

    async def get_logs(
        self,
        service_id: Optional[uuid.UUID] = None,
        level: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[LogResponse]:
        logs = await self.repository.list_logs(service_id, level, search, limit)
        return [LogResponse.model_validate(l) for l in logs]

    async def get_traces(
        self,
        service_id: Optional[uuid.UUID] = None,
        trace_id: Optional[str] = None,
        limit: int = 100
    ) -> List[SpanResponse]:
        spans = await self.repository.list_traces(service_id, trace_id, limit)
        return [SpanResponse.model_validate(s) for s in spans]

    async def get_metrics_timeline(
        self,
        service_id: uuid.UUID,
        metric_name: str,
        limit: int = 100
    ) -> List[MetricResponse]:
        metrics = await self.repository.get_metrics_summary(service_id, metric_name, limit)
        return [MetricResponse.model_validate(m) for m in metrics]
