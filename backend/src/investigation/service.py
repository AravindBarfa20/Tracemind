import json
import re
import time
import uuid
from typing import List, Optional
from src.llm.base import LLMProvider
from src.telemetry.repository import TelemetryRepository
from src.services_registry.repository import ServiceRepository
from src.incidents.repository import IncidentRepository
from src.investigation.schemas import DiagnoseRequest, DiagnoseResponse, AIHypothesis

class InvestigationService:
    """Uses LLM capabilities to analyze telemetry anomalies and suggest root-cause resolutions."""

    def __init__(
        self,
        llm: LLMProvider,
        telemetry_repo: TelemetryRepository,
        service_repo: ServiceRepository,
        incident_repo: IncidentRepository
    ):
        self.llm = llm
        self.telemetry_repo = telemetry_repo
        self.service_repo = service_repo
        self.incident_repo = incident_repo

    async def diagnose_issue(self, data: DiagnoseRequest) -> DiagnoseResponse:
        start_time = time.perf_counter()

        # Load service context
        service = await self.service_repo.get_by_id(data.service_id)
        service_name = service.name if service else "Unknown Service"
        service_type = service.service_type if service else "Unknown"

        # Query recent logs and traces
        logs = await self.telemetry_repo.list_logs(service_id=data.service_id, limit=15)
        traces = await self.telemetry_repo.list_traces(service_id=data.service_id, limit=10)

        # Load incident details if provided
        incident_context = ""
        if data.incident_id:
            incident = await self.incident_repo.get_by_id(data.incident_id)
            if incident:
                incident_context = f"- Incident Title: {incident.title}\n- Incident Details: {incident.description}\n- Severity: {incident.severity}\n"

        # Build alert section context
        alert_context_section = ""
        if incident_context:
            alert_context_section = f"### Alert Context:\n{incident_context}\n"

        # Build prompt
        logs_str = "\n".join([f"[{l.level}] {l.message} (tags: {l.attributes})" for l in logs]) or "No recent logs captured."
        traces_str = "\n".join([f"Span: {t.name} (duration: {t.duration_ms}ms, status: {t.status})" for t in traces]) or "No recent trace spans."

        prompt = f"""
You are an expert site reliability engineering (SRE) AI assistant. Analyze the system state and telemetry records below to find the root cause of issues in the service and recommend fixes.

{alert_context_section}
### Service Specification:
- Name: {service_name}
- Type: {service_type}

### Recent Structured Logs:
{logs_str}

### Recent Trace Spans:
{traces_str}

### Additional Query/Context:
{data.custom_query or "None provided."}

---
Based on the data, identify the most likely root causes. You MUST respond with a JSON block in this exact format:
{{
  "diagnostic_summary": "Overall summary of the system status and errors.",
  "hypotheses": [
    {{
      "title": "Hypothesis title",
      "description": "Explanatory detail of what went wrong.",
      "confidence_score": 0.85,
      "suggested_fix": "Actionable code patch or configuration change details."
    }}
  ]
}}
"""

        system_prompt = "You are a professional SRE and systems debugger. Always return valid JSON."

        # Execute LLM provider generation
        response = await self.llm.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.2,  # deterministic SRE diagnostics
        )

        elapsed = (time.perf_counter() - start_time) * 1000.0

        # Parse JSON block from response
        try:
            # Clean response text in case LLM added markdown wrappers
            cleaned = response.content.strip()
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                cleaned = match.group(0)
                
            res_dict = json.loads(cleaned)
            summary = res_dict.get("diagnostic_summary", "Anomaly analysis complete.")
            hyp_list = []
            for h in res_dict.get("hypotheses", []):
                hyp_list.append(
                    AIHypothesis(
                        title=h.get("title", "Telemetry anomaly"),
                        description=h.get("description", "Potential correlation detected."),
                        confidence_score=float(h.get("confidence_score", 0.5)),
                        suggested_fix=h.get("suggested_fix", "Inspect config parameters."),
                    )
                )
        except Exception:
            # Fallback output
            summary = response.content[:500] + "..."
            hyp_list = [
                AIHypothesis(
                    title="Unknown Error Condition",
                    description="Could not parse structured diagnostics payload.",
                    confidence_score=0.5,
                    suggested_fix="Inspect logs and query tracing spans manually.",
                )
            ]

        return DiagnoseResponse(
            service_id=data.service_id,
            incident_id=data.incident_id,
            diagnostic_summary=summary,
            hypotheses=hyp_list,
            tokens_used=response.tokens_used,
            latency_ms=round(elapsed, 2),
        )
