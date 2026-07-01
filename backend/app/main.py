import time
import asyncpg
import redis.asyncio as redis
from fastapi import FastAPI, Request
from qdrant_client import AsyncQdrantClient
from app.core.config import settings
from app.core.logger import logger
from app.api.router import api_router
from app.db.qdrant import qdrant_db
from app.api.deps import _embedding_provider
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Qdrant collection using the dynamic dimension from the Embedding Provider
    await qdrant_db.initialize_collection(dimension=_embedding_provider.dimension)
    yield


app = FastAPI(title="SupportAI", lifespan=lifespan)

app.include_router(api_router, prefix="/api/v1")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()

    response = await call_next(request)

    process_time = time.time() - start_time

    logger.info(
        "HTTP Request",
        extra={
            "http_method": request.method,
            "request_path": request.url.path,
            "response_status": response.status_code,
            "response_time_ms": round(process_time * 1000, 2),
        },
    )

    return response


@app.get("/")
async def root():
    return {"message": "SupportAI Backend"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/ready")
async def readiness_check():
    # Check PostgreSQL
    try:
        conn = await asyncpg.connect(settings.DATABASE_URL)
        await conn.close()
    except Exception as e:
        logger.error(f"PostgreSQL connection failed: {e}")
        return {"status": "unhealthy", "dependency": "PostgreSQL"}

    # Check Redis
    try:
        r = redis.from_url(settings.REDIS_URL)
        await r.ping()
        await r.close()
    except Exception as e:
        logger.error(f"Redis connection failed: {e}")
        return {"status": "unhealthy", "dependency": "Redis"}

    # Check Qdrant
    try:
        # qdrant_client supports async if installed with aiohttp, which qdrant-client does
        client = AsyncQdrantClient(url=settings.QDRANT_URL)
        # Using a simple check to verify connection
        await client.get_collections()
    except Exception as e:
        logger.error(f"Qdrant connection failed: {e}")
        return {"status": "unhealthy", "dependency": "Qdrant"}

    return {"status": "ready"}
