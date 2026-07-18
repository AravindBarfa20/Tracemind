import uuid
from typing import List, Optional
from pydantic import BaseModel, Field

class DiagnoseRequest(BaseModel):
    service_id: uuid.UUID = Field(..., description="Target service UUID to analyze")
    incident_id: Optional[uuid.UUID] = Field(None, description="Optional incident UUID context")
    custom_query: Optional[str] = Field(None, description="Additional context or custom message to include")

class AIHypothesis(BaseModel):
    title: str = Field(..., description="Hypothesis title summary")
    description: str = Field(..., description="Detailed explanation of possible root cause")
    confidence_score: float = Field(..., description="Float score (0.0 to 1.0) indicating confidence")
    suggested_fix: str = Field(..., description="Actionable code change recommendation")

class DiagnoseResponse(BaseModel):
    service_id: uuid.UUID
    incident_id: Optional[uuid.UUID]
    diagnostic_summary: str = Field(..., description="Overview statement from AI agent")
    hypotheses: List[AIHypothesis] = Field(default_factory=list)
    tokens_used: Optional[int] = None
    latency_ms: float
