from typing import Any, Dict, List, Optional
import mcp.types as types
from ..client import MonarchClient
from .entity import EntityApi

class ChemicalApi:
    def __init__(self):
        self.entity_api = EntityApi()

    async def get_chemical_info(self, client: MonarchClient, chemical_id: str) -> Dict[str, Any]:
        return await self.entity_api.get_entity(client, chemical_id)

    async def get_chemical_disease_associations(
        self,
        client: MonarchClient,
        chemical_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        return await self.entity_api.get_associations(
            client,
            subject=[chemical_id],
            category=["biolink:ChemicalToDiseaseOrPhenotypicFeatureAssociation",
                      "biolink:ChemicalOrDrugOrTreatmentToDiseaseOrPhenotypicFeatureAssociation"],
            limit=limit,
            offset=offset
        )

    async def get_chemical_pathway_associations(
        self,
        client: MonarchClient,
        chemical_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        return await self.entity_api.get_associations(
            client,
            subject=[chemical_id],
            category=["biolink:ChemicalToPathwayAssociation"],
            limit=limit,
            offset=offset
        )

    async def get_diseases_treated_by_chemical(
        self,
        client: MonarchClient,
        chemical_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        return await self.entity_api.get_associations(
            client,
            subject=[chemical_id],
            category=["biolink:ChemicalOrDrugOrTreatmentToDiseaseOrPhenotypicFeatureAssociation"],
            predicate=["biolink:treats_or_applied_or_studied_to_treat",
                       "biolink:ameliorates_condition",
                       "biolink:preventative_for_condition"],
            limit=limit,
            offset=offset
        )

    async def get_chemicals_for_disease(
        self,
        client: MonarchClient,
        disease_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        return await self.entity_api.get_associations(
            client,
            object=[disease_id],
            category=["biolink:ChemicalOrDrugOrTreatmentToDiseaseOrPhenotypicFeatureAssociation"],
            predicate=["biolink:treats_or_applied_or_studied_to_treat",
                       "biolink:ameliorates_condition",
                       "biolink:preventative_for_condition"],
            limit=limit,
            offset=offset
        )

CHEMICAL_TOOLS = [
    types.Tool(
        name="get_chemical_info",
        description="Get detailed information about a chemical or drug entity.",
        inputSchema={
            "type": "object",
            "properties": {
                "chemical_id": {"type": "string", "description": "Chemical/drug ID (e.g., CHEBI:3215 for carisoprodol)"}
            },
            "required": ["chemical_id"]
        }
    ),
    types.Tool(
        name="get_chemical_disease_associations",
        description="Get diseases associated with a chemical or drug, including treatment relationships.",
        inputSchema={
            "type": "object",
            "properties": {
                "chemical_id": {"type": "string", "description": "Chemical/drug ID (e.g., CHEBI:3215)"},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            },
            "required": ["chemical_id"]
        }
    ),
    types.Tool(
        name="get_chemical_pathway_associations",
        description="Get biological pathways associated with a chemical compound.",
        inputSchema={
            "type": "object",
            "properties": {
                "chemical_id": {"type": "string", "description": "Chemical ID (e.g., CHEBI:3215)"},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            },
            "required": ["chemical_id"]
        }
    ),
    types.Tool(
        name="get_diseases_treated_by_chemical",
        description="Get diseases that are treated, ameliorated, or prevented by a specific chemical or drug.",
        inputSchema={
            "type": "object",
            "properties": {
                "chemical_id": {"type": "string", "description": "Chemical/drug ID (e.g., CHEBI:3215)"},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            },
            "required": ["chemical_id"]
        }
    ),
    types.Tool(
        name="get_chemicals_for_disease",
        description="Get chemicals or drugs that treat, ameliorate, or prevent a specific disease.",
        inputSchema={
            "type": "object",
            "properties": {
                "disease_id": {"type": "string", "description": "Disease ID (e.g., MONDO:0005015)"},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            },
            "required": ["disease_id"]
        }
    )
]