import logging
from typing import Any, Dict, List, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

class TracemindException(Exception):
    """Base exception for all Tracemind errors."""
    def __init__(
        self,
        detail: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        errors: Optional[List[Any]] = None,
    ):
        self.detail = detail
        self.status_code = status_code
        self.errors = errors or []
        super().__init__(detail)

class NotFoundException(TracemindException):
    """Resource not found (404)."""
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(detail, status_code=status.HTTP_404_NOT_FOUND)

class UnauthorizedException(TracemindException):
    """Unauthorized credentials (401)."""
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(detail, status_code=status.HTTP_401_UNAUTHORIZED)

class ForbiddenException(TracemindException):
    """Operation forbidden (403)."""
    def __init__(self, detail: str = "Operation forbidden"):
        super().__init__(detail, status_code=status.HTTP_403_FORBIDDEN)

class ConflictException(TracemindException):
    """Resource state conflict, e.g. duplicate keys (409)."""
    def __init__(self, detail: str = "Resource already exists"):
        super().__init__(detail, status_code=status.HTTP_409_CONFLICT)

class ValidationException(TracemindException):
    """Request validation failure (422)."""
    def __init__(self, detail: str = "Validation failed", errors: Optional[List[Any]] = None):
        super().__init__(detail, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, errors=errors)

async def tracemind_exception_handler(request: Request, exc: TracemindException) -> JSONResponse:
    """Global handler for TracemindException."""
    request_id = getattr(request.state, "request_id", "unknown")
    
    # Check severity
    if exc.status_code >= 500:
        logger.error(
            f"Server Error {exc.status_code}: {exc.detail} [RequestID: {request_id}]",
            exc_info=True
        )
    else:
        logger.warning(
            f"Client Error {exc.status_code}: {exc.detail} [RequestID: {request_id}]"
        )
        
    content: Dict[str, Any] = {
        "error": {
            "code": exc.status_code,
            "message": exc.detail,
            "request_id": request_id,
        }
    }
    if exc.errors:
        content["error"]["details"] = exc.errors
        
    return JSONResponse(
        status_code=exc.status_code,
        content=content,
    )

async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all for unhandled server exceptions."""
    request_id = getattr(request.state, "request_id", "unknown")
    logger.critical(
        f"Unhandled Exception: {str(exc)} [RequestID: {request_id}]",
        exc_info=True
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": 500,
                "message": "An unexpected error occurred. Please contact support.",
                "request_id": request_id,
            }
        },
    )
