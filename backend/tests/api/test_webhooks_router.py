import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app
import uuid
import datetime

client = TestClient(app)

def test_dummy():
    assert True
