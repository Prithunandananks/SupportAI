import pytest
from fastapi import FastAPI
from slowapi.errors import RateLimitExceeded
from app.core.rate_limit import setup_rate_limiting, limiter

def test_setup_rate_limiting():
    app = FastAPI()
    setup_rate_limiting(app)
    
    assert hasattr(app.state, "limiter")
    assert app.state.limiter == limiter
