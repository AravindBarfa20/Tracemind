import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import PlainTextResponse
from sqlalchemy import text
from src.core.config import settings
from src.core.database import engine, get_db
from src.core.exceptions import (
    TracemindException,
    general_exception_handler,
    tracemind_exception_handler,
)
from src.core.logging import setup_logging
from src.core.metrics import metrics_collector
from src.core.middleware import setup_middleware

# Import domain routers
from src.auth.router import router as auth_router
from src.organizations.router import router as org_router
from src.projects.router import router as project_router
from src.services_registry.router import router as service_router
from src.telemetry.router import router as telemetry_router
from src.replay.router import router as replay_router
from src.incidents.router import router as incident_router
from src.investigation.router import router as investigation_router

logger = logging.getLogger("src.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    setup_logging(debug=settings.DEBUG)
    logger.info(f"Starting {settings.APP_NAME} in {settings.APP_ENV} mode...")
    yield
    # Shutdown tasks
    logger.info("Shutting down engine...")
    await engine.dispose()
    logger.info("Shutdown complete.")

def create_app() -> FastAPI:
    app = FastAPI(
        title="Tracemind API",
        description="AI-Powered Engineering Observability Platform Backend",
        version="0.1.0",
        lifespan=lifespan,
    )

    # Middleware
    setup_middleware(app)

    # Exception Handlers
    app.add_exception_handler(TracemindException, tracemind_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)

    # Register Routers
    app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
    app.include_router(org_router, prefix=settings.API_V1_PREFIX)
    app.include_router(project_router, prefix=settings.API_V1_PREFIX)
    app.include_router(service_router, prefix=settings.API_V1_PREFIX)
    app.include_router(telemetry_router, prefix=settings.API_V1_PREFIX)
    app.include_router(replay_router, prefix=settings.API_V1_PREFIX)
    app.include_router(incident_router, prefix=settings.API_V1_PREFIX)
    app.include_router(investigation_router, prefix=settings.API_V1_PREFIX)

    # Base Routes
    @app.get("/")
    async def root():
        return {
            "name": "Tracemind API",
            "version": "0.1.0",
            "docs": "/docs",
        }

    @app.get("/health")
    async def health_check():
        db_status = "down"
        redis_status = "down"

        # Check DB
        try:
            async for session in get_db():
                await session.execute(text("SELECT 1"))
                db_status = "up"
                break
        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")

        # Check Redis
        try:
            import redis.asyncio as aioredis
            r = aioredis.from_url(settings.REDIS_URL)
            await r.ping()
            await r.aclose()
            redis_status = "up"
        except Exception as e:
            logger.error(f"Redis health check failed: {str(e)}")

        status_code = 200
        if db_status == "down" or redis_status == "down":
            status_code = 503

        return {
            "status": "healthy" if status_code == 200 else "unhealthy",
            "version": "0.1.0",
            "services": {
                "database": db_status,
                "redis": redis_status,
            }
        }

    @app.get("/metrics", response_class=PlainTextResponse)
    async def metrics():
        return metrics_collector.generate_prometheus_metrics()

    return app

app = create_app()
