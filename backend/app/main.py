import time
import asyncpg
import redis.asyncio as redis
from datetime import datetime, timezone
import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.logger import logger
from app.api.router import api_router
from app.db.qdrant import qdrant_db
from app.api.deps import _embedding_provider
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

from app.core.rate_limit import setup_rate_limiting
import uuid
import json

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Qdrant collection using the dynamic dimension from the Embedding Provider
    await qdrant_db.initialize_collection(dimension=_embedding_provider.dimension)
    
    # Initialize BM25 index from persistent storage
    from app.services.retrieval.bm25_service import bm25_service
    await bm25_service.initialize_from_db()
    
    yield


app = FastAPI(title="SupportAI", lifespan=lifespan)

# Setup Rate Limiting
setup_rate_limiting(app)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

from fastapi.exceptions import RequestValidationError
from app.core.exceptions import UnsupportedDocumentTypeError

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", "unknown")
    logger.error(json.dumps({
        "event": "unhandled_exception",
        "error": type(exc).__name__,
        "message": str(exc),
        "traceback": traceback.format_exc(),
        "request_id": req_id,
        "endpoint": request.url.path,
    }))
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again later."}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    req_id = getattr(request.state, "request_id", "unknown")
    logger.error(json.dumps({
        "event": "validation_error",
        "error": "RequestValidationError",
        "message": str(exc),
        "request_id": req_id,
        "endpoint": request.url.path,
    }))
    return JSONResponse(
        status_code=422,
        content={"detail": "Invalid request parameters."}
    )

@app.middleware("http")
async def structured_logging_middleware(request: Request, call_next):
    start_time = time.time()
    request_id = str(uuid.uuid4())
    
    # Add request ID to state for downstream use if needed
    request.state.request_id = request_id

    response = await call_next(request)

    process_time = time.time() - start_time
    
    # Extract user ID if available (e.g., from auth middleware if we had one that sets request.state.user)
    user_id = getattr(getattr(request, "state", None), "user_id", None)

    log_data = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "request_id": request_id,
        "endpoint": request.url.path,
        "method": request.method,
        "status": response.status_code,
        "latency_ms": round(process_time * 1000, 2),
    }
    
    if user_id:
        log_data["user_id"] = str(user_id)

    # Output structured JSON log
    logger.info(json.dumps(log_data))

    return response


@app.get("/")
async def root():
    return {"message": "SupportAI Backend"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/ready")
async def readiness_check():
    if settings.is_development:
        return {"status": "ready"}

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
        # Using a simple check to verify connection
        await qdrant_db.client.get_collections()
    except Exception as e:
        logger.error(f"Qdrant connection failed: {e}")
        return {"status": "unhealthy", "dependency": "Qdrant"}

    return {"status": "ready"}
