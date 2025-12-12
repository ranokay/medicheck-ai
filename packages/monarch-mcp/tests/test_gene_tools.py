import pytest
from unittest.mock import patch, AsyncMock
from monarch_mcp.tools.gene import GeneApi

@pytest.mark.asyncio
async def test_get_gene_phenotype_associations(mock_client):
    """Test gene to phenotype associations call."""
    gene_api = GeneApi()
    gene_id = "HGNC:1097"
    with patch.object(gene_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await gene_api.get_gene_phenotype_associations(mock_client, gene_id=gene_id, limit=5)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            subject=[gene_id],
            category=["biolink:GeneToPhenotypicFeatureAssociation"],
            limit=5,
            offset=0
        )

@pytest.mark.asyncio
async def test_get_gene_disease_associations(mock_client):
    """Test gene to disease associations call."""
    gene_api = GeneApi()
    gene_id = "HGNC:1097"
    with patch.object(gene_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await gene_api.get_gene_disease_associations(mock_client, gene_id=gene_id, limit=10)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            subject=[gene_id],
            category=["biolink:GeneToDiseaseAssociation"],
            limit=10,
            offset=0
        )

@pytest.mark.asyncio
async def test_get_gene_expression_associations(mock_client):
    """Test gene to expression associations call."""
    gene_api = GeneApi()
    gene_id = "HGNC:1097"
    with patch.object(gene_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await gene_api.get_gene_expression_associations(mock_client, gene_id=gene_id, limit=15)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            subject=[gene_id],
            category=["biolink:GeneToExpressionSiteAssociation"],
            limit=15,
            offset=0
        )

@pytest.mark.asyncio
async def test_get_gene_interactions(mock_client):
    """Test gene-gene interactions call."""
    gene_api = GeneApi()
    gene_id = "HGNC:1097"
    with patch.object(gene_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await gene_api.get_gene_interactions(mock_client, gene_id=gene_id, limit=20)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            entity=[gene_id],
            category=["biolink:PairwiseGeneToGeneInteraction"],
            limit=20,
            offset=0
        )

@pytest.mark.asyncio
async def test_get_gene_orthologs(mock_client):
    """Test gene ortholog associations call."""
    gene_api = GeneApi()
    gene_id = "HGNC:1097"
    with patch.object(gene_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await gene_api.get_gene_orthologs(mock_client, gene_id=gene_id, limit=10)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            subject=[gene_id],
            category=["biolink:GeneToGeneHomologyAssociation"],
            predicate=["biolink:orthologous_to"],
            limit=10,
            offset=0
        )

@pytest.mark.asyncio
async def test_get_gene_pathways(mock_client):
    """Test gene to pathway associations call."""
    gene_api = GeneApi()
    gene_id = "HGNC:1097"
    with patch.object(gene_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await gene_api.get_gene_pathways(mock_client, gene_id=gene_id, limit=25)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            subject=[gene_id],
            category=["biolink:GeneToPathwayAssociation"],
            limit=25,
            offset=0
        )

@pytest.mark.asyncio
async def test_get_diseases_by_gene(mock_client):
    """Test reverse lookup - diseases associated with a gene."""
    gene_api = GeneApi()
    gene_id = "HGNC:1097"
    with patch.object(gene_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await gene_api.get_diseases_by_gene(mock_client, gene_id=gene_id, limit=30)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            object=[gene_id],
            category=["biolink:CausalGeneToDiseaseAssociation",
                      "biolink:CorrelatedGeneToDiseaseAssociation"],
            limit=30,
            offset=0
        )