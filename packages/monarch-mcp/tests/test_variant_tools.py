import pytest
from unittest.mock import patch, AsyncMock
from monarch_mcp.tools.variant import VariantApi

@pytest.mark.asyncio
async def test_get_variant_info(mock_client):
    """Test getting variant information."""
    variant_api = VariantApi()
    variant_id = "ClinVar:12345"
    with patch.object(variant_api.entity_api, "get_entity", new_callable=AsyncMock) as mock_get_entity:
        await variant_api.get_variant_info(mock_client, variant_id=variant_id)
        mock_get_entity.assert_called_once_with(mock_client, variant_id)

@pytest.mark.asyncio
async def test_get_variant_gene_associations(mock_client):
    """Test variant to gene associations."""
    variant_api = VariantApi()
    variant_id = "ClinVar:12345"
    with patch.object(variant_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await variant_api.get_variant_gene_associations(mock_client, variant_id=variant_id, limit=10)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            subject=[variant_id],
            category=["biolink:VariantToGeneAssociation"],
            limit=10,
            offset=0
        )

@pytest.mark.asyncio
async def test_get_variant_disease_associations(mock_client):
    """Test variant to disease associations."""
    variant_api = VariantApi()
    variant_id = "ClinVar:12345"
    with patch.object(variant_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await variant_api.get_variant_disease_associations(mock_client, variant_id=variant_id, limit=15)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            subject=[variant_id],
            category=["biolink:VariantToDiseaseAssociation"],
            limit=15,
            offset=0
        )

@pytest.mark.asyncio
async def test_get_variant_phenotype_associations(mock_client):
    """Test variant to phenotype associations."""
    variant_api = VariantApi()
    variant_id = "ClinVar:12345"
    with patch.object(variant_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await variant_api.get_variant_phenotype_associations(mock_client, variant_id=variant_id, limit=20)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            subject=[variant_id],
            category=["biolink:VariantToPhenotypicFeatureAssociation"],
            limit=20,
            offset=0
        )

@pytest.mark.asyncio
async def test_get_gene_variants(mock_client):
    """Test getting variants for a gene."""
    variant_api = VariantApi()
    gene_id = "HGNC:1097"
    with patch.object(variant_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await variant_api.get_gene_variants(mock_client, gene_id=gene_id, limit=25)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            object=[gene_id],
            category=["biolink:VariantToGeneAssociation"],
            limit=25,
            offset=0
        )

@pytest.mark.asyncio
async def test_get_variants_by_disease(mock_client):
    """Test getting variants associated with a disease."""
    variant_api = VariantApi()
    disease_id = "MONDO:0005015"
    with patch.object(variant_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await variant_api.get_variants_by_disease(mock_client, disease_id=disease_id, limit=30)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            object=[disease_id],
            category=["biolink:VariantToDiseaseAssociation"],
            limit=30,
            offset=0
        )