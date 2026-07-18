import uuid
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

class LogCreate(BaseModel):
    service_id: uuid.UUID = Field(..., description="Target service UUID")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    level: str = Field(..., max_length=50, description="Log level (INFO, WARN, ERROR, etc.)")
    message: str = Field(..., description="Log message text")
    attributes: Dict[str, Any] = Field(default_factory=dict, description="Metadata tags")

class LogResponse(BaseModel):
    id: uuid.UUID
    service_id: uuid.UUID
    timestamp: datetime
    level: str
    message: str
    attributes: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)

class SpanCreate(BaseModel):
    trace_id: str = Field(..., description="OTel trace ID")
    span_id: str = Field(..., description="OTel span ID")
    parent_span_id: Optional[str] = Field(None, description="OTel parent span ID")
    name: str = Field(..., description="Span operations name")
    service_id: uuid.UUID = Field(..., description="Target service UUID")
    start_time: datetime
    end_time: datetime
    duration_ms: float
    attributes: Dict[str, Any] = Field(default_factory=dict)
    status: str = Field("OK", description="Span status (OK, ERROR)")

class SpanResponse(BaseModel):
    id: uuid.UUID
    trace_id: str
    span_id: str
    parent_span_id: Optional[str]
    name: str
    service_id: uuid.UUID
    start_time: datetime
    end_time: datetime
    duration_ms: float
    attributes: Dict[str, Any]
    status: str

    model_config = ConfigDict(from_attributes=True)

class MetricCreate(BaseModel):
    service_id: uuid.UUID = Field(..., description="Target service UUID")
    name: str = Field(..., description="Metric key name")
    value: float = Field(..., description="Metric float value")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    labels: Dict[str, Any] = Field(default_factory=dict, description="Labels metrics dimensions")

class MetricResponse(BaseModel):
    id: uuid.UUID
    service_id: uuid.UUID
    name: str
    value: float
    timestamp: datetime
    labels: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)
