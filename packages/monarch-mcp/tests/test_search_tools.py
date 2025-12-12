import pytest
from monarch_mcp.tools.search import SearchApi

@pytest.mark.asyncio
async def test_search_basic(mock_client):
    """Test basic search functionality."""
    search_api = SearchApi()
    await search_api.search(mock_client, q="diabetes")
    mock_client.get.assert_called_once_with(
        "search",
        params={
            "q": "diabetes",
            "limit": 20,
            "offset": 0
        },
    )

@pytest.mark.asyncio
async def test_search_with_filters(mock_client):
    """Test search with all filtering options."""
    search_api = SearchApi()
    await search_api.search(
        mock_client,
        q="marfan",
        category=["biolink:Disease", "biolink:PhenotypicFeature"],
        in_taxon_label=["Homo sapiens"],
        limit=5,
        offset=10
    )
    mock_client.get.assert_called_once_with(
        "search",
        params={
            "q": "marfan",
            "category": ["biolink:Disease", "biolink:PhenotypicFeature"],
            "in_taxon_label": ["Homo sapiens"],
            "limit": 5,
            "offset": 10
        },
    )

@pytest.mark.asyncio
async def test_search_wildcard(mock_client):
    """Test wildcard search."""
    search_api = SearchApi()
    await search_api.search(mock_client, q="*:*", category=["biolink:Gene"])
    mock_client.get.assert_called_once_with(
        "search",
        params={
            "q": "*:*",
            "category": ["biolink:Gene"],
            "limit": 20,
            "offset": 0
        },
    )

@pytest.mark.asyncio
async def test_autocomplete(mock_client):
    """Test autocomplete functionality."""
    search_api = SearchApi()
    await search_api.autocomplete(mock_client, q="marf")
    mock_client.get.assert_called_once_with(
        "autocomplete",
        params={"q": "marf"}
    )

@pytest.mark.asyncio
async def test_autocomplete_default(mock_client):
    """Test autocomplete with default query."""
    search_api = SearchApi()
    await search_api.autocomplete(mock_client)
    mock_client.get.assert_called_once_with(
        "autocomplete",
        params={"q": "*:*"}
    )

@pytest.mark.asyncio
async def test_semsim_autocomplete(mock_client):
    """Test semantic similarity autocomplete."""
    search_api = SearchApi()
    await search_api.semsim_autocomplete(mock_client, q="seizure")
    mock_client.get.assert_called_once_with(
        "semsim/autocomplete",
        params={"q": "seizure"}
    )

@pytest.mark.asyncio
async def test_semsim_autocomplete_default(mock_client):
    """Test semantic similarity autocomplete with default."""
    search_api = SearchApi()
    await search_api.semsim_autocomplete(mock_client)
    mock_client.get.assert_called_once_with(
        "semsim/autocomplete",
        params={"q": "*:*"}
    )