from typing import Any, Dict, List, Optional
import mcp.types as types
from ..client import MonarchClient
from .entity import EntityApi

class ProteinApi:
    def __init__(self):
        self.entity_api = EntityApi()

    async def get_protein_info(self, client: MonarchClient, protein_id: str) -> Dict[str, Any]:
        return await self.entity_api.get_entity(client, protein_id)

    async def get_protein_interactions(
        self,
        client: MonarchClient,
        protein_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        return await self.entity_api.get_associations(
            client,
            entity=[protein_id],
            category=["biolink:PairwiseGeneToGeneInteraction"],
            predicate=["biolink:interacts_with"],
            limit=limit,
            offset=offset
        )

    async def get_protein_functions(
        self,
        client: MonarchClient,
        protein_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        return await self.entity_api.get_associations(
            client,
            subject=[protein_id],
            category=["biolink:MacromolecularMachineToMolecularActivityAssociation"],
            predicate=["biolink:enables"],
            limit=limit,
            offset=offset
        )

    async def get_protein_processes(
        self,
        client: MonarchClient,
        protein_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        return await self.entity_api.get_associations(
            client,
            subject=[protein_id],
            category=["biolink:MacromolecularMachineToBiologicalProcessAssociation"],
            predicate=["biolink:actively_involved_in", "biolink:participates_in"],
            limit=limit,
            offset=offset
        )

    async def get_protein_locations(
        self,
        client: MonarchClient,
        protein_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        return await self.entity_api.get_associations(
            client,
            subject=[protein_id],
            category=["biolink:MacromolecularMachineToCellularComponentAssociation"],
            predicate=["biolink:located_in", "biolink:is_active_in"],
            limit=limit,
            offset=offset
        )

    async def get_proteins_by_function(
        self,
        client: MonarchClient,
        molecular_activity_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        return await self.entity_api.get_associations(
            client,
            object=[molecular_activity_id],
            category=["biolink:MacromolecularMachineToMolecularActivityAssociation"],
            predicate=["biolink:enables"],
            limit=limit,
            offset=offset
        )

PROTEIN_TOOLS = [
    types.Tool(
        name="get_protein_info",
        description="Get detailed information about a protein.",
        inputSchema={
            "type": "object",
            "properties": {
                "protein_id": {"type": "string", "description": "Protein ID (e.g., UniProtKB:P04637)"}
            },
            "required": ["protein_id"]
        }
    ),
    types.Tool(
        name="get_protein_interactions",
        description="Get protein-protein interactions for a specific protein.",
        inputSchema={
            "type": "object",
            "properties": {
                "protein_id": {"type": "string", "description": "Protein ID (e.g., UniProtKB:P04637)"},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            },
            "required": ["protein_id"]
        }
    ),
    types.Tool(
        name="get_protein_functions",
        description="Get molecular functions (activities) enabled by a protein.",
        inputSchema={
            "type": "object",
            "properties": {
                "protein_id": {"type": "string", "description": "Protein ID (e.g., UniProtKB:P04637)"},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            },
            "required": ["protein_id"]
        }
    ),
    types.Tool(
        name="get_protein_processes",
        description="Get biological processes that a protein is involved in.",
        inputSchema={
            "type": "object",
            "properties": {
                "protein_id": {"type": "string", "description": "Protein ID (e.g., UniProtKB:P04637)"},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            },
            "required": ["protein_id"]
        }
    ),
    types.Tool(
        name="get_protein_locations",
        description="Get cellular components where a protein is located or active.",
        inputSchema={
            "type": "object",
            "properties": {
                "protein_id": {"type": "string", "description": "Protein ID (e.g., UniProtKB:P04637)"},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            },
            "required": ["protein_id"]
        }
    ),
    types.Tool(
        name="get_proteins_by_function",
        description="Get proteins that enable a specific molecular function.",
        inputSchema={
            "type": "object",
            "properties": {
                "molecular_activity_id": {"type": "string", "description": "Molecular activity/function ID (e.g., GO:0003674)"},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            },
            "required": ["molecular_activity_id"]
        }
    )
]