import pytest
from monarch_mcp.tools.mapping import MappingApi

@pytest.mark.asyncio
async def test_get_mappings_basic(mock_client):
    """Test basic mapping retrieval with entity_id."""
    mapping_api = MappingApi()
    entity_id = "MONDO:0019391"
    await mapping_api.get_mappings(mock_client, entity_id=[entity_id])
    mock_client.get.assert_called_once_with(
        "mappings",
        params={
            "entity_id": [entity_id],
            "limit": 20,
            "offset": 0
        },
    )

@pytest.mark.asyncio
async def test_get_mappings_with_predicates(mock_client):
    """Test mapping retrieval with predicate filtering."""
    mapping_api = MappingApi()
    entity_id = "MONDO:0019391"
    predicate_id = ["skos:exactMatch", "skos:closeMatch"]
    await mapping_api.get_mappings(
        mock_client, 
        entity_id=[entity_id], 
        predicate_id=predicate_id,
        limit=30
    )
    mock_client.get.assert_called_once_with(
        "mappings",
        params={
            "entity_id": [entity_id],
            "predicate_id": predicate_id,
            "limit": 30,
            "offset": 0
        },
    )

@pytest.mark.asyncio
async def test_get_mappings_subject_object(mock_client):
    """Test mapping retrieval with subject and object filtering."""
    mapping_api = MappingApi()
    await mapping_api.get_mappings(
        mock_client,
        subject_id=["MONDO:0019391"],
        object_id=["OMIM:123456"],
        predicate_id=["skos:exactMatch"]
    )
    mock_client.get.assert_called_once_with(
        "mappings",
        params={
            "subject_id": ["MONDO:0019391"],
            "object_id": ["OMIM:123456"],
            "predicate_id": ["skos:exactMatch"],
            "limit": 20,
            "offset": 0
        },
    )

@pytest.mark.asyncio
async def test_get_mappings_with_justification(mock_client):
    """Test mapping retrieval with mapping justification."""
    mapping_api = MappingApi()
    await mapping_api.get_mappings(
        mock_client,
        entity_id=["HP:0001250"],
        mapping_justification=["semapv:LexicalMatching"],
        limit=50
    )
    mock_client.get.assert_called_once_with(
        "mappings",
        params={
            "entity_id": ["HP:0001250"],
            "mapping_justification": ["semapv:LexicalMatching"],
            "limit": 50,
            "offset": 0
        },
    )