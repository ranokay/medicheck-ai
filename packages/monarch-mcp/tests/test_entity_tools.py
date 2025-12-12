import pytest
from monarch_mcp.tools.entity import EntityApi

@pytest.mark.asyncio
async def test_get_entity(mock_client):
    """Test that get_entity calls the correct endpoint."""
    entity_api = EntityApi()
    entity_id = "MONDO:0005015"
    await entity_api.get_entity(mock_client, entity_id)
    mock_client.get.assert_called_once_with(f"entity/{entity_id}")

@pytest.mark.asyncio
async def test_get_entity_associations_by_category(mock_client):
    """Test that get_entity_associations_by_category calls the correct endpoint."""
    entity_api = EntityApi()
    entity_id = "MONDO:0005015"
    category = "biolink:DiseaseToPhenotypicFeatureAssociation"
    await entity_api.get_entity_associations_by_category(
        mock_client, 
        entity_id, 
        category, 
        traverse_orthologs=True,
        limit=10
    )
    expected_url = f"entity/{entity_id}/{category}"
    mock_client.get.assert_called_once_with(
        expected_url,
        params={
            "traverse_orthologs": True,
            "direct": False,  # Default value included
            "limit": 10,
            "offset": 0
        },
    )

@pytest.mark.asyncio
async def test_get_entity_associations_by_category_with_all_params(mock_client):
    """Test entity associations with all optional parameters."""
    entity_api = EntityApi()
    entity_id = "HGNC:1097"
    category = "biolink:GeneToPhenotypicFeatureAssociation"
    await entity_api.get_entity_associations_by_category(
        mock_client,
        entity_id,
        category,
        traverse_orthologs=True,
        direct=True,
        query="cancer",
        sort=["frequency desc"],
        facet_fields=["subject_taxon"],
        limit=50
    )
    expected_url = f"entity/{entity_id}/{category}"
    mock_client.get.assert_called_once_with(
        expected_url,
        params={
            "traverse_orthologs": True,
            "direct": True,
            "query": "cancer",
            "sort": ["frequency desc"],
            "facet_fields": ["subject_taxon"],
            "limit": 50,
            "offset": 0
        },
    )

@pytest.mark.asyncio
async def test_get_associations(mock_client):
    """Test that get_associations calls the correct generic association endpoint."""
    entity_api = EntityApi()
    subject_id = "MONDO:0005015"
    category = "biolink:DiseaseToPhenotypicFeatureAssociation"
    await entity_api.get_associations(mock_client, subject=[subject_id], category=[category], limit=10)
    mock_client.get.assert_called_once_with(
        "association",
        params={
            "subject": [subject_id],
            "category": [category],
            "limit": 10,
            "offset": 0,
            "direct": False,
            "compact": False
        },
    )

@pytest.mark.asyncio
async def test_get_associations_with_predicates(mock_client):
    """Test associations with predicate filtering."""
    entity_api = EntityApi()
    await entity_api.get_associations(
        mock_client,
        subject=["CHEBI:3215"],
        category=["biolink:ChemicalOrDrugOrTreatmentToDiseaseOrPhenotypicFeatureAssociation"],
        predicate=["biolink:treats_or_applied_or_studied_to_treat"],
        limit=20
    )
    mock_client.get.assert_called_once_with(
        "association",
        params={
            "subject": ["CHEBI:3215"],
            "category": ["biolink:ChemicalOrDrugOrTreatmentToDiseaseOrPhenotypicFeatureAssociation"],
            "predicate": ["biolink:treats_or_applied_or_studied_to_treat"],
            "limit": 20,
            "offset": 0,
            "direct": False,
            "compact": False
        },
    )

@pytest.mark.asyncio
async def test_get_associations_advanced(mock_client):
    """Test advanced associations with all filtering options."""
    entity_api = EntityApi()
    await entity_api.get_associations_advanced(
        mock_client,
        category=["biolink:GeneToDiseaseAssociation"],
        subject_category=["biolink:Gene"],
        subject_namespace=["HGNC"],
        subject_taxon=["NCBITaxon:9606"],
        object_category=["biolink:Disease"],
        object_namespace=["MONDO"],
        facet_fields=["subject_taxon", "object_namespace"],
        limit=30
    )
    mock_client.get.assert_called_once_with(
        "association",
        params={
            "category": ["biolink:GeneToDiseaseAssociation"],
            "subject_category": ["biolink:Gene"],
            "subject_namespace": ["HGNC"],
            "subject_taxon": ["NCBITaxon:9606"],
            "object_category": ["biolink:Disease"],
            "object_namespace": ["MONDO"],
            "facet_fields": ["subject_taxon", "object_namespace"],
            "limit": 30,
            "offset": 0,
            "direct": False,
            "compact": False
        },
    )

@pytest.mark.asyncio
async def test_get_entities_batch(mock_client):
    """Test batch entity retrieval."""
    entity_api = EntityApi()
    entity_ids = ["MONDO:0005015", "HGNC:1097", "HP:0001250"]
    
    # Mock successful responses for each entity
    mock_client.get.side_effect = [
        {"id": "MONDO:0005015", "name": "Diabetes"},
        {"id": "HGNC:1097", "name": "BRCA1"},
        {"id": "HP:0001250", "name": "Seizure"}
    ]
    
    results = await entity_api.get_entities_batch(mock_client, entity_ids)
    
    assert len(results) == 3
    assert results[0]["id"] == "MONDO:0005015"
    assert results[1]["id"] == "HGNC:1097"
    assert results[2]["id"] == "HP:0001250"
    
    # Verify each call
    assert mock_client.get.call_count == 3
    mock_client.get.assert_any_call("entity/MONDO:0005015")
    mock_client.get.assert_any_call("entity/HGNC:1097")
    mock_client.get.assert_any_call("entity/HP:0001250")

@pytest.mark.asyncio
async def test_get_entities_batch_with_error(mock_client):
    """Test batch entity retrieval with error handling."""
    entity_api = EntityApi()
    entity_ids = ["MONDO:0005015", "INVALID:ID"]
    
    # Mock one successful and one failed response
    mock_client.get.side_effect = [
        {"id": "MONDO:0005015", "name": "Diabetes"},
        Exception("Entity not found")
    ]
    
    results = await entity_api.get_entities_batch(mock_client, entity_ids)
    
    assert len(results) == 2
    assert results[0]["id"] == "MONDO:0005015"
    assert results[1]["id"] == "INVALID:ID"
    assert "error" in results[1]