import logging
import time
import uuid
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from src.core.config import settings
from src.core.metrics import metrics_collector

logger = logging.getLogger("src.core.middleware")

class RequestIDMiddleware(BaseHTTPMiddleware):
    """Middleware that assigns a unique UUID correlation ID to each incoming request

    and appends it to response headers as well as local state.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID")
        if not request_id:
            request_id = str(uuid.uuid4())
            
        request.state.request_id = request_id
        
        response: Response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware that injects standard security hardening headers to all HTTP responses."""
    async def dispatch(self, request: Request, call_next) -> Response:
        response: Response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
        return response


class RequestLoggingAndMetricsMiddleware(BaseHTTPMiddleware):
    """Middleware that logs detailed request/response execution details

    and updates Prometheus metrics.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        # Ignore health check and metrics endpoints for request logging noise
        path = request.url.path
        is_ignored = path in ["/health", "/metrics", "/docs", "/openapi.json"]

        metrics_collector.increment_active()
        start_time = time.perf_counter()
        
        try:
            response: Response = await call_next(request)
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            
            if not is_ignored:
                # Add request_id to logging contextual parameters if needed
                logger.info(
                    f"HTTP {request.method} {path} - Status {response.status_code} "
                    f"in {duration_ms:.2f}ms [RequestID: {getattr(request.state, 'request_id', 'none')}]"
                )
                
            metrics_collector.increment_request(request.method, path, response.status_code)
            metrics_collector.observe_duration(request.method, path, duration_ms / 1000.0)
            return response
            
        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            logger.error(
                f"HTTP {request.method} {path} failed with: {str(exc)} after {duration_ms:.2f}ms"
            )
            # Re-raise so global exception handler handles it
            raise exc
        finally:
            metrics_collector.decrement_active()


from collections import defaultdict

# Global in-memory rate limits tracker
_in_memory_limits = defaultdict(list)


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Hybrid rate limiter middleware that uses Redis for scale, falling back to local in-memory tracking if Redis is offline/disabled."""
    
    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        if path in ["/health", "/metrics", "/docs", "/openapi.json"] or path.startswith("/static"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        limit = 100
        window_secs = 60
        
        # 1. Try Redis Rate Limiting
        try:
            import time
            current_minute = int(time.time() / 60)
            key = f"ratelimit:{client_ip}:{current_minute}"
            
            from src.core.redis import get_redis_client
            r = get_redis_client()
            count = await r.incr(key)
            if count == 1:
                await r.expire(key, 60)
            await r.aclose()
            
            if count > limit:
                return Response(
                    content='{"error":{"code":429,"message":"Rate limit exceeded. Max 100 requests/min."}}',
                    status_code=429,
                    media_type="application/json",
                )
            return await call_next(request)
        except Exception as e:
            # Fall back to high-reliability in-memory rate limiting
            pass

        # 2. Local In-Memory Sliding Window Rate Limiting (Free, zero-downtime, no external database required)
        import time
        now = time.time()
        cutoff = now - window_secs
        
        # Clean up and validate
        timestamps = _in_memory_limits[client_ip]
        valid_timestamps = [ts for ts in timestamps if ts > cutoff]
        _in_memory_limits[client_ip] = valid_timestamps
        
        if len(valid_timestamps) >= limit:
            return Response(
                content='{"error":{"code":429,"message":"Rate limit exceeded. Max 100 requests/min."}}',
                status_code=429,
                media_type="application/json",
            )
            
        _in_memory_limits[client_ip].append(now)
        return await call_next(request)


def setup_middleware(app: FastAPI) -> None:
    """Configures middlewares for the FastAPI application."""
    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Custom Middlewares (Executed in reverse order of addition)
    app.add_middleware(RateLimitingMiddleware)
    app.add_middleware(RequestLoggingAndMetricsMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestIDMiddleware)
