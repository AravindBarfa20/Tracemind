import asyncio
import pytest
from typing import AsyncGenerator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.main import app
from src.core.config import settings
from src.core.database import Base, get_db

TEST_DATABASE_URL = "postgresql+asyncpg://tracemind:tracemind_dev_password@localhost:5433/tracemind"

# Setup test async engine
@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def test_engine():
    # Attempt using PostgreSQL test DB. If it fails, fallback to sqlite in-memory for unit tests
    try:
        from sqlalchemy import text
        engine = create_async_engine(TEST_DATABASE_URL, echo=False)
        # Verify connection works
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        yield engine
        await engine.dispose()
    except Exception:
        # Fallback to sqlite in-memory for local running without setup
        engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
        yield engine
        await engine.dispose()

@pytest.fixture(scope="function")
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    async_session = async_sessionmaker(
        bind=test_engine,
        expire_on_commit=False,
        class_=AsyncSession
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()

@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    # Override get_db dependency
    async def _get_test_db():
        yield db_session
        
    from httpx import ASGITransport
    app.dependency_overrides[get_db] = _get_test_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
        
    app.dependency_overrides.clear()
