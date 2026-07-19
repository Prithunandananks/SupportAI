from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import FastAPI
from app.core.config import settings

import os

# Initialize limiter with Redis or Memory fallback
redis_url = settings.REDIS_URL
storage_uri = redis_url if redis_url else "memory://"
limiter = Limiter(
    key_func=get_remote_address, 
    default_limits=[settings.RATE_LIMIT_GLOBAL],
    storage_uri=storage_uri
)
def setup_rate_limiting(app: FastAPI) -> None:
    """Configure rate limiting on the FastAPI application."""
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
