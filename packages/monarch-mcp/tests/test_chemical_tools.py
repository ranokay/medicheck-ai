import pytest
from unittest.mock import patch, AsyncMock
from monarch_mcp.tools.chemical import ChemicalApi

@pytest.mark.asyncio
async def test_get_chemical_info(mock_client):
    """Test getting chemical information."""
    chemical_api = ChemicalApi()
    chemical_id = "CHEBI:3215"
    with patch.object(chemical_api.entity_api, "get_entity", new_callable=AsyncMock) as mock_get_entity:
        await chemical_api.get_chemical_info(mock_client, chemical_id=chemical_id)
        mock_get_entity.assert_called_once_with(mock_client, chemical_id)

@pytest.mark.asyncio
async def test_get_chemical_disease_associations(mock_client):
    """Test chemical to disease associations."""
    chemical_api = ChemicalApi()
    chemical_id = "CHEBI:3215"
    with patch.object(chemical_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await chemical_api.get_chemical_disease_associations(mock_client, chemical_id=chemical_id, limit=10)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            subject=[chemical_id],
            category=["biolink:ChemicalToDiseaseOrPhenotypicFeatureAssociation",
                      "biolink:ChemicalOrDrugOrTreatmentToDiseaseOrPhenotypicFeatureAssociation"],
            limit=10,
            offset=0
        )

@pytest.mark.asyncio
async def test_get_chemical_pathway_associations(mock_client):
    """Test chemical to pathway associations."""
    chemical_api = ChemicalApi()
    chemical_id = "CHEBI:3215"
    with patch.object(chemical_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await chemical_api.get_chemical_pathway_associations(mock_client, chemical_id=chemical_id, limit=15)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            subject=[chemical_id],
            category=["biolink:ChemicalToPathwayAssociation"],
            limit=15,
            offset=0
        )

@pytest.mark.asyncio
async def test_get_diseases_treated_by_chemical(mock_client):
    """Test getting diseases treated by a chemical."""
    chemical_api = ChemicalApi()
    chemical_id = "CHEBI:3215"
    with patch.object(chemical_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await chemical_api.get_diseases_treated_by_chemical(mock_client, chemical_id=chemical_id, limit=20)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            subject=[chemical_id],
            category=["biolink:ChemicalOrDrugOrTreatmentToDiseaseOrPhenotypicFeatureAssociation"],
            predicate=["biolink:treats_or_applied_or_studied_to_treat",
                       "biolink:ameliorates_condition",
                       "biolink:preventative_for_condition"],
            limit=20,
            offset=0
        )

@pytest.mark.asyncio
async def test_get_chemicals_for_disease(mock_client):
    """Test getting chemicals that treat a disease."""
    chemical_api = ChemicalApi()
    disease_id = "MONDO:0005015"
    with patch.object(chemical_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await chemical_api.get_chemicals_for_disease(mock_client, disease_id=disease_id, limit=25)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            object=[disease_id],
            category=["biolink:ChemicalOrDrugOrTreatmentToDiseaseOrPhenotypicFeatureAssociation"],
            predicate=["biolink:treats_or_applied_or_studied_to_treat",
                       "biolink:ameliorates_condition",
                       "biolink:preventative_for_condition"],
            limit=25,
            offset=0
        )