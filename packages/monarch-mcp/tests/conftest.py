# tests/conftest.py
import pytest
from unittest.mock import AsyncMock
from monarch_mcp.client import MonarchClient

@pytest.fixture
def mock_client() -> MonarchClient:
    """Fixture to create a mock MonarchClient with an async get method."""
    client = MonarchClient()
    client.get = AsyncMock()
    client.post = AsyncMock()
    return client