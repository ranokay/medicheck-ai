from typing import Any, Dict, List
import mcp.types as types
from ..client import MonarchClient
from .entity import EntityApi

class DiseaseApi:
    """
    Convenience wrappers for disease-specific queries using the core EntityApi.
    """
    def __init__(self):
        self.entity_api = EntityApi()

    async def get_disease_phenotype_associations(
        self,
        client: MonarchClient,
        disease_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Gets a table of phenotypes associated with a disease."""
        return await self.entity_api.get_associations(
            client,
            subject=[disease_id],
            category=["biolink:DiseaseToPhenotypicFeatureAssociation"],
            limit=limit,
            offset=offset
        )

    async def get_disease_gene_associations(
        self,
        client: MonarchClient,
        disease_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Gets a table of genes associated with a disease."""
        return await self.entity_api.get_associations(
            client,
            subject=[disease_id],
            category=["biolink:CausalGeneToDiseaseAssociation", "biolink:CorrelatedGeneToDiseaseAssociation"],
            limit=limit,
            offset=offset
        )

    async def get_disease_treatments(
        self,
        client: MonarchClient,
        disease_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get treatments for a disease."""
        return await self.entity_api.get_associations(
            client,
            object=[disease_id],
            category=["biolink:ChemicalOrDrugOrTreatmentToDiseaseOrPhenotypicFeatureAssociation"],
            predicate=["biolink:treats_or_applied_or_studied_to_treat",
                       "biolink:ameliorates_condition"],
            limit=limit,
            offset=offset
        )

    async def get_disease_variants(
        self,
        client: MonarchClient,
        disease_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get genetic variants associated with a disease."""
        return await self.entity_api.get_associations(
            client,
            object=[disease_id],
            category=["biolink:VariantToDiseaseAssociation"],
            limit=limit,
            offset=offset
        )

    async def get_disease_inheritance(
        self,
        client: MonarchClient,
        disease_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get inheritance pattern for a disease."""
        return await self.entity_api.get_associations(
            client,
            subject=[disease_id],
            category=["biolink:DiseaseOrPhenotypicFeatureToGeneticInheritanceAssociation"],
            limit=limit,
            offset=offset
        )

DISEASE_TOOLS = [
    types.Tool(
        name="get_disease_phenotype_associations",
        description="Gets a table of phenotypes associated with a specific disease.",
        inputSchema={
            "type": "object",
            "properties": {
                "disease_id": {"type": "string", "description": "Disease ID (e.g., MONDO:0005015)"},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            },
            "required": ["disease_id"]
        }
    ),
    types.Tool(
        name="get_disease_gene_associations",
        description="Gets a table of genes associated with a specific disease.",
        inputSchema={
            "type": "object",
            "properties": {
                "disease_id": {"type": "string", "description": "Disease ID (e.g., MONDO:0005015)"},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            },
            "required": ["disease_id"]
        }
    ),
    types.Tool(
        name="get_disease_treatments",
        description="Get drugs or treatments for a specific disease.",
        inputSchema={
            "type": "object",
            "properties": {
                "disease_id": {"type": "string", "description": "Disease ID (e.g., MONDO:0005015)"},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            },
            "required": ["disease_id"]
        }
    ),
    types.Tool(
        name="get_disease_variants",
        description="Get genetic variants associated with a specific disease.",
        inputSchema={
            "type": "object",
            "properties": {
                "disease_id": {"type": "string", "description": "Disease ID (e.g., MONDO:0005015)"},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            },
            "required": ["disease_id"]
        }
    ),
    types.Tool(
        name="get_disease_inheritance",
        description="Get inheritance pattern (autosomal dominant, recessive, etc.) for a genetic disease.",
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