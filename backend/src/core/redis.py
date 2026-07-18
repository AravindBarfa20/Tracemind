import logging
import redis.asyncio as aioredis
from src.core.config import settings

logger = logging.getLogger("src.core.redis")

# Initialize async redis connection pool
redis_pool = aioredis.ConnectionPool.from_url(
    settings.REDIS_URL,
    max_connections=10,
    decode_responses=True,
)

def get_redis_client() -> aioredis.Redis:
    """Returns a client from the shared connection pool."""
    return aioredis.Redis(connection_pool=redis_pool)
