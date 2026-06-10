import json
from typing import Any

import redis.asyncio as aioredis

from app.core.config import settings

redis_client: aioredis.Redis | None = None


async def init_redis():
    global redis_client
    try:
        redis_client = aioredis.from_url(
            settings.REDIS_URL, decode_responses=True
        )
        await redis_client.ping()
    except Exception:
        redis_client = None


async def close_redis():
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None


async def cache_get(key: str) -> Any | None:
    if redis_client is None:
        return None
    try:
        data = await redis_client.get(key)
        return json.loads(data) if data else None
    except Exception:
        return None


async def cache_set(key: str, value: Any, ttl: int | None = None) -> None:
    if redis_client is None:
        return
    try:
        ttl = ttl or settings.REDIS_CACHE_TTL_SECONDS
        await redis_client.setex(key, ttl, json.dumps(value, default=str))
    except Exception:
        pass


async def cache_delete(key: str) -> None:
    if redis_client is None:
        return
    try:
        await redis_client.delete(key)
    except Exception:
        pass


async def cache_invalidate_pattern(pattern: str) -> None:
    if redis_client is None:
        return
    try:
        cursor = 0
        while True:
            cursor, keys = await redis_client.scan(cursor=cursor, match=pattern, count=100)
            if keys:
                await redis_client.delete(*keys)
            if cursor == 0:
                break
    except Exception:
        pass
