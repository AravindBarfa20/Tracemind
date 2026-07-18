import uuid
from typing import List, Optional, Tuple
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from src.telemetry.models import Log, Span, Metric

class TelemetryRepository:
    """Handles low-level database operations for telemetry data (logs, traces, and metrics)."""

    def __init__(self, session: AsyncSession):
        self.session = session

    # --- Logs ---
    async def create_log(self, data: dict) -> Log:
        log = Log(**data)
        self.session.add(log)
        await self.session.flush()
        return log

    async def list_logs(
        self,
        service_id: Optional[uuid.UUID] = None,
        level: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 100,
        skip: int = 0
    ) -> List[Log]:
        query = select(Log)
        if service_id:
            query = query.where(Log.service_id == service_id)
        if level:
            query = query.where(Log.level == level)
        if search:
            query = query.where(Log.message.ilike(f"%{search}%"))
        
        query = query.order_by(Log.timestamp.desc()).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    # --- Spans (Traces) ---
    async def create_span(self, data: dict) -> Span:
        span = Span(**data)
        self.session.add(span)
        await self.session.flush()
        return span

    async def list_traces(
        self,
        service_id: Optional[uuid.UUID] = None,
        trace_id: Optional[str] = None,
        limit: int = 100,
        skip: int = 0
    ) -> List[Span]:
        query = select(Span)
        if service_id:
            query = query.where(Span.service_id == service_id)
        if trace_id:
            query = query.where(Span.trace_id == trace_id)
            query = query.order_by(Span.start_time.asc())
        else:
            query = query.order_by(Span.start_time.desc())
            
        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    # --- Metrics ---
    async def create_metric(self, data: dict) -> Metric:
        metric = Metric(**data)
        self.session.add(metric)
        await self.session.flush()
        return metric

    async def get_metrics_summary(
        self,
        service_id: uuid.UUID,
        metric_name: str,
        limit: int = 100
    ) -> List[Metric]:
        query = select(Metric).where(
            Metric.service_id == service_id,
            Metric.name == metric_name
        ).order_by(Metric.timestamp.asc()).limit(limit)
        
        result = await self.session.execute(query)
        return list(result.scalars().all())
