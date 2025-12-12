import pytest
from unittest.mock import patch, AsyncMock
from monarch_mcp.tools.phenotype import PhenotypeApi

@pytest.mark.asyncio
async def test_phenotype_profile_search(mock_client):
    """Test phenotype profile search calls the semsim search endpoint."""
    phenotype_api = PhenotypeApi()
    phenotype_ids = ["HP:0001250", "HP:0001290"]
    search_group = "Human Diseases"
    await phenotype_api.phenotype_profile_search(
        mock_client, 
        phenotype_ids=phenotype_ids, 
        search_group=search_group, 
        limit=5
    )
    
    expected_termset = ",".join(phenotype_ids)
    expected_url = f"semsim/search/{expected_termset}/{search_group}"
    
    mock_client.get.assert_called_once_with(
        expected_url,
        params={"metric": "ancestor_information_content", "limit": 5}
    )

@pytest.mark.asyncio
async def test_phenotype_profile_search_different_group(mock_client):
    """Test phenotype profile search with different search groups."""
    phenotype_api = PhenotypeApi()
    phenotype_ids = ["HP:0001250"]
    search_group = "Mouse Genes"
    await phenotype_api.phenotype_profile_search(
        mock_client,
        phenotype_ids=phenotype_ids,
        search_group=search_group,
        metric="jaccard_similarity",
        limit=15
    )
    
    expected_url = f"semsim/search/HP:0001250/{search_group}"
    mock_client.get.assert_called_once_with(
        expected_url,
        params={"metric": "jaccard_similarity", "limit": 15}
    )

@pytest.mark.asyncio
async def test_get_phenotype_gene_associations(mock_client):
    """Test phenotype to gene associations call."""
    phenotype_api = PhenotypeApi()
    phenotype_id = "HP:0001250"
    with patch.object(phenotype_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await phenotype_api.get_phenotype_gene_associations(mock_client, phenotype_id=phenotype_id, limit=10)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            subject=[phenotype_id],
            category=["biolink:GeneToPhenotypicFeatureAssociation"],
            limit=10,
            offset=0
        )

@pytest.mark.asyncio
async def test_get_phenotype_disease_associations(mock_client):
    """Test phenotype to disease associations call."""
    phenotype_api = PhenotypeApi()
    phenotype_id = "HP:0001250"
    with patch.object(phenotype_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await phenotype_api.get_phenotype_disease_associations(mock_client, phenotype_id=phenotype_id, limit=15)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            subject=[phenotype_id],
            category=["biolink:DiseaseToPhenotypicFeatureAssociation"],
            limit=15,
            offset=0
        )

@pytest.mark.asyncio
async def test_get_diseases_with_phenotype(mock_client):
    """Test reverse lookup - diseases that have a phenotype."""
    phenotype_api = PhenotypeApi()
    phenotype_id = "HP:0001250"
    with patch.object(phenotype_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await phenotype_api.get_diseases_with_phenotype(mock_client, phenotype_id=phenotype_id, limit=20)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            object=[phenotype_id],
            category=["biolink:DiseaseToPhenotypicFeatureAssociation"],
            limit=20,
            offset=0
        )

@pytest.mark.asyncio
async def test_get_genes_with_phenotype(mock_client):
    """Test reverse lookup - genes that cause a phenotype."""
    phenotype_api = PhenotypeApi()
    phenotype_id = "HP:0001250"
    with patch.object(phenotype_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await phenotype_api.get_genes_with_phenotype(mock_client, phenotype_id=phenotype_id, limit=25)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            object=[phenotype_id],
            category=["biolink:GeneToPhenotypicFeatureAssociation"],
            limit=25,
            offset=0
        )