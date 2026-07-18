import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

class RecordedRequest(BaseModel):
    method: str
    url: str
    headers: Dict[str, str] = Field(default_factory=dict)
    body: Optional[str] = None
    expected_status: int = 200

class ReplaySessionCreate(BaseModel):
    service_id: uuid.UUID = Field(..., description="Target service UUID")
    name: str = Field(..., min_length=1, max_length=255, description="Session record name")
    recorded_requests: List[RecordedRequest] = Field(default_factory=list)

class ReplaySessionResponse(BaseModel):
    id: uuid.UUID
    service_id: uuid.UUID
    name: str
    recorded_requests: List[RecordedRequest]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ReplayResultItem(BaseModel):
    request: RecordedRequest
    actual_status: int
    latency_ms: float
    passed: bool
    diff: Optional[str] = None

class ReplayRunResponse(BaseModel):
    session_id: uuid.UUID
    timestamp: datetime
    passed_count: int
    failed_count: int
    results: List[ReplayResultItem]
