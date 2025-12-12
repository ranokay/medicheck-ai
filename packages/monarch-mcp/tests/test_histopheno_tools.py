# tests/test_histopheno_tools.py
import pytest
from monarch_mcp.tools.histopheno import HistoPhenoApi

@pytest.mark.asyncio
async def test_get_histopheno(mock_client):
    """Test that get_histopheno calls the correct endpoint."""
    histopheno_api = HistoPhenoApi()
    entity_id = "MONDO:0019391"
    await histopheno_api.get_histopheno(mock_client, id=entity_id)
    mock_client.get.assert_called_once_with(f"histopheno/{entity_id}")