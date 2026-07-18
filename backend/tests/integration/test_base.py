import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    """Test that the root URL returns API name and docs link."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Tracemind API"
    assert "version" in data
    assert data["docs"] == "/docs"

@pytest.mark.asyncio
async def test_health_check_endpoint(client: AsyncClient):
    """Test that the health check endpoint returns 200 and services statuses."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "services" in data
    assert "database" in data["services"]
    assert "redis" in data["services"]
