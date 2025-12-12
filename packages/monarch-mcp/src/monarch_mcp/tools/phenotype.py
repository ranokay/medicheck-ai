from typing import Any, Dict, List
import mcp.types as types
from ..client import MonarchClient
from .entity import EntityApi

class PhenotypeApi:
    """
    Phenotype-specific queries and matching for Monarch, refactored for the v3 API.
    """
    def __init__(self):
        self.entity_api = EntityApi()

    async def phenotype_profile_search(
        self,
        client: MonarchClient,
        phenotype_ids: List[str],
        search_group: str = "Human Diseases",
        metric: str = "ancestor_information_content",
        limit: int = 10,
    ) -> Dict[str, Any]:
        """
        Search for entities (e.g., diseases) that best match a profile of phenotypes.
        """
        termset = ",".join(phenotype_ids)
        params = {"metric": metric, "limit": limit}
        return await client.get(f"semsim/search/{termset}/{search_group}", params=params)

    async def get_phenotype_gene_associations(
        self,
        client: MonarchClient,
        phenotype_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get genes associated with a phenotype."""
        return await self.entity_api.get_associations(
            client,
            subject=[phenotype_id],
            category=["biolink:GeneToPhenotypicFeatureAssociation"],
            limit=limit,
            offset=offset
        )

    async def get_phenotype_disease_associations(
        self,
        client: MonarchClient,
        phenotype_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get diseases associated with a phenotype."""
        return await self.entity_api.get_associations(
            client,
            subject=[phenotype_id],
            category=["biolink:DiseaseToPhenotypicFeatureAssociation"],
            limit=limit,
            offset=offset
        )

    async def get_diseases_with_phenotype(
        self,
        client: MonarchClient,
        phenotype_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get diseases that have a specific phenotype."""
        return await self.entity_api.get_associations(
            client,
            object=[phenotype_id],
            category=["biolink:DiseaseToPhenotypicFeatureAssociation"],
            limit=limit,
            offset=offset
        )

    async def get_genes_with_phenotype(
        self,
        client: MonarchClient,
        phenotype_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get genes that cause a specific phenotype."""
        return await self.entity_api.get_associations(
            client,
            object=[phenotype_id],
            category=["biolink:GeneToPhenotypicFeatureAssociation"],
            limit=limit,
            offset=offset
        )

PHENOTYPE_TOOLS = [
    types.Tool(
        name="phenotype_profile_search",
        description="Match a profile of phenotypes to find similar diseases or other entities using semantic similarity.",
        inputSchema={
            "type": "object",
            "properties": {
                "phenotype_ids": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of HPO phenotype IDs (e.g., ['HP:0001250', 'HP:0001251'])"
                },
                "search_group": {
                    "type": "string",
                    "description": "Group of entities to search within.",
                    "default": "Human Diseases",
                    "enum": ["Human Diseases", "Human Genes", "Mouse Genes", "Rat Genes", "Zebrafish Genes", "C. Elegans Genes"]
                },
                "limit": {"type": "number", "description": "Number of matches to return.", "default": 10}
            },
            "required": ["phenotype_ids"]
        }
    ),
    types.Tool(
        name="get_phenotype_gene_associations",
        description="Get genes associated with a specific phenotype.",
        inputSchema={
            "type": "object",
            "properties": {
                "phenotype_id": {"type": "string", "description": "Phenotype ID (e.g., HP:0001250 for seizure)"},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            },
            "required": ["phenotype_id"]
        }
    ),
    types.Tool(
        name="get_phenotype_disease_associations",
        description="Get diseases associated with a specific phenotype.",
        inputSchema={
            "type": "object",
            "properties": {
                "phenotype_id": {"type": "string", "description": "Phenotype ID (e.g., HP:0001250)"},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            },
            "required": ["phenotype_id"]
        }
    ),
    types.Tool(
        name="get_diseases_with_phenotype",
        description="Get diseases that have a specific phenotype (reverse lookup).",
        inputSchema={
            "type": "object",
            "properties": {
                "phenotype_id": {"type": "string", "description": "Phenotype ID (e.g., HP:0001250)"},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            },
            "required": ["phenotype_id"]
        }
    ),
    types.Tool(
        name="get_genes_with_phenotype",
        description="Get genes that cause a specific phenotype (reverse lookup).",
        inputSchema={
            "type": "object",
            "properties": {
                "phenotype_id": {"type": "string", "description": "Phenotype ID (e.g., HP:0001250)"},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            },
            "required": ["phenotype_id"]
        }
    )
]