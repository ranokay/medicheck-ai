import pytest
from unittest.mock import patch, AsyncMock
from monarch_mcp.tools.protein import ProteinApi

@pytest.mark.asyncio
async def test_get_protein_info(mock_client):
    """Test getting protein information."""
    protein_api = ProteinApi()
    protein_id = "UniProtKB:P04637"
    with patch.object(protein_api.entity_api, "get_entity", new_callable=AsyncMock) as mock_get_entity:
        await protein_api.get_protein_info(mock_client, protein_id=protein_id)
        mock_get_entity.assert_called_once_with(mock_client, protein_id)

@pytest.mark.asyncio
async def test_get_protein_interactions(mock_client):
    """Test protein-protein interactions."""
    protein_api = ProteinApi()
    protein_id = "UniProtKB:P04637"
    with patch.object(protein_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await protein_api.get_protein_interactions(mock_client, protein_id=protein_id, limit=10)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            entity=[protein_id],
            category=["biolink:PairwiseGeneToGeneInteraction"],
            predicate=["biolink:interacts_with"],
            limit=10,
            offset=0
        )

@pytest.mark.asyncio
async def test_get_protein_functions(mock_client):
    """Test protein molecular functions."""
    protein_api = ProteinApi()
    protein_id = "UniProtKB:P04637"
    with patch.object(protein_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await protein_api.get_protein_functions(mock_client, protein_id=protein_id, limit=15)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            subject=[protein_id],
            category=["biolink:MacromolecularMachineToMolecularActivityAssociation"],
            predicate=["biolink:enables"],
            limit=15,
            offset=0
        )

@pytest.mark.asyncio
async def test_get_protein_processes(mock_client):
    """Test protein biological processes."""
    protein_api = ProteinApi()
    protein_id = "UniProtKB:P04637"
    with patch.object(protein_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await protein_api.get_protein_processes(mock_client, protein_id=protein_id, limit=20)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            subject=[protein_id],
            category=["biolink:MacromolecularMachineToBiologicalProcessAssociation"],
            predicate=["biolink:actively_involved_in", "biolink:participates_in"],
            limit=20,
            offset=0
        )

@pytest.mark.asyncio
async def test_get_protein_locations(mock_client):
    """Test protein cellular locations."""
    protein_api = ProteinApi()
    protein_id = "UniProtKB:P04637"
    with patch.object(protein_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await protein_api.get_protein_locations(mock_client, protein_id=protein_id, limit=10)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            subject=[protein_id],
            category=["biolink:MacromolecularMachineToCellularComponentAssociation"],
            predicate=["biolink:located_in", "biolink:is_active_in"],
            limit=10,
            offset=0
        )

@pytest.mark.asyncio
async def test_get_proteins_by_function(mock_client):
    """Test getting proteins that have a specific molecular function."""
    protein_api = ProteinApi()
    function_id = "GO:0003674"
    with patch.object(protein_api.entity_api, "get_associations", new_callable=AsyncMock) as mock_get_assoc:
        await protein_api.get_proteins_by_function(mock_client, molecular_activity_id=function_id, limit=25)
        mock_get_assoc.assert_called_once_with(
            mock_client,
            object=[function_id],
            category=["biolink:MacromolecularMachineToMolecularActivityAssociation"],
            predicate=["biolink:enables"],
            limit=25,
            offset=0
        )