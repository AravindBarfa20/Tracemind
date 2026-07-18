import time
from datetime import datetime
import uuid
import httpx
from typing import List, Optional
from src.core.exceptions import NotFoundException
from src.replay.repository import ReplayRepository
from src.replay.schemas import (
    ReplaySessionCreate,
    ReplaySessionResponse,
    ReplayRunResponse,
    ReplayResultItem,
)

class ReplayService:
    """Manages recording traffic sessions and runner validation replay tests."""

    def __init__(self, repository: ReplayRepository):
        self.repository = repository

    async def record_session(self, data: ReplaySessionCreate) -> ReplaySessionResponse:
        session_dict = {
            "service_id": data.service_id,
            "name": data.name,
            "recorded_requests": [req.model_dump() for req in data.recorded_requests],
        }
        session = await self.repository.create(session_dict)
        return ReplaySessionResponse.model_validate(session)

    async def get_session(self, session_id: uuid.UUID) -> ReplaySessionResponse:
        session = await self.repository.get_by_id(session_id)
        if not session:
            raise NotFoundException("Replay session not found")
        return ReplaySessionResponse.model_validate(session)

    async def list_sessions(self, service_id: uuid.UUID) -> List[ReplaySessionResponse]:
        sessions = await self.repository.list_by_service(service_id)
        return [ReplaySessionResponse.model_validate(s) for s in sessions]

    async def execute_replay(self, session_id: uuid.UUID) -> ReplayRunResponse:
        """Plays back the recorded API transactions, timing response times and verifying differences."""
        session = await self.repository.get_by_id(session_id)
        if not session:
            raise NotFoundException("Replay session not found")

        results: List[ReplayResultItem] = []
        passed_count = 0
        failed_count = 0

        async with httpx.AsyncClient(timeout=10.0) as client:
            for req_dict in session.recorded_requests:
                # Reconstruct request structure
                method = req_dict.get("method", "GET").upper()
                url = req_dict.get("url")
                headers = req_dict.get("headers", {})
                body = req_dict.get("body")
                expected = req_dict.get("expected_status", 200)

                start = time.perf_counter()
                actual_status = 500
                diff = None

                try:
                    res = await client.request(
                        method=method,
                        url=url,
                        headers=headers,
                        content=body,
                    )
                    actual_status = res.status_code
                    latency = (time.perf_counter() - start) * 1000.0
                    passed = actual_status == expected
                    
                    if not passed:
                        diff = f"Status code mismatch. Expected: {expected}, Got: {actual_status}"
                except Exception as e:
                    passed = False
                    latency = (time.perf_counter() - start) * 1000.0
                    diff = f"HTTP request failed: {str(e)}"

                if passed:
                    passed_count += 1
                else:
                    failed_count += 1

                results.append(
                    ReplayResultItem(
                        request=req_dict,
                        actual_status=actual_status,
                        latency_ms=round(latency, 2),
                        passed=passed,
                        diff=diff,
                    )
                )

        return ReplayRunResponse(
            session_id=session.id,
            timestamp=datetime.utcnow(),
            passed_count=passed_count,
            failed_count=failed_count,
            results=results,
        )
