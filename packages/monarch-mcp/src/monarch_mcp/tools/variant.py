from typing import Any, Dict, List, Optional
import mcp.types as types
from ..client import MonarchClient
from .entity import EntityApi

class VariantApi:
    def __init__(self):
        self.entity_api = EntityApi()

    async def get_variant_info(self, client: MonarchClient, variant_id: str) -> Dict[str, Any]:
        return await self.entity_api.get_entity(client, variant_id)

    async def get_variant_gene_associations(
        self,
        client: MonarchClient,
        variant_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        return await self.entity_api.get_associations(
            client,
            subject=[variant_id],
            category=["biolink:VariantToGeneAssociation"],
            limit=limit,
            offset=offset
        )

    async def get_variant_disease_associations(
        self,
        client: MonarchClient,
        variant_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        return await self.entity_api.get_associations(
            client,
            subject=[variant_id],
            category=["biolink:VariantToDiseaseAssociation"],
            limit=limit,
            offset=offset
        )

    async def get_variant_phenotype_associations(
        self,
        client: MonarchClient,
        variant_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        return await self.entity_api.get_associations(
            client,
            subject=[variant_id],
            category=["biolink:VariantToPhenotypicFeatureAssociation"],
            limit=limit,
            offset=offset
        )

    async def get_gene_variants(
        self,
        client: MonarchClient,
        gene_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        return await self.entity_api.get_associations(
            client,
            object=[gene_id],
            category=["biolink:VariantToGeneAssociation"],
            limit=limit,
            offset=offset
        )

    async def get_variants_by_disease(
        self,
        client: MonarchClient,
        disease_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        return await self.entity_api.get_associations(
            client,
            object=[disease_id],
            category=["biolink:VariantToDiseaseAssociation"],
            limit=limit,
            offset=offset
        )

VARIANT_TOOLS = [
    types.Tool(
        name="get_variant_info",
        description="Get detailed information about a genetic variant.",
        inputSchema={
            "type": "object",
            "properties": {
                "variant_id": {"type": "string", "description": "Variant ID (e.g., ClinVar:12345)"}
            },
            "required": ["variant_id"]
        }
    ),
    types.Tool(
        name="get_variant_gene_associations",
        description="Get genes associated with a genetic variant.",
        inputSchema={
            "type": "object",
            "properties": {
                "variant_id": {"type": "string", "description": "Variant ID (e.g., ClinVar:12345)"},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            },
            "required": ["variant_id"]
        }
    ),
    types.Tool(
        name="get_variant_disease_associations",
        description="Get diseases associated with a genetic variant.",
        inputSchema={
            "type": "object",
            "properties": {
                "variant_id": {"type": "string", "description": "Variant ID (e.g., ClinVar:12345)"},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            },
            "required": ["variant_id"]
        }
    ),
    types.Tool(
        name="get_variant_phenotype_associations",
        description="Get phenotypes associated with a genetic variant.",
        inputSchema={
            "type": "object",
            "properties": {
                "variant_id": {"type": "string", "description": "Variant ID (e.g., ClinVar:12345)"},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            },
            "required": ["variant_id"]
        }
    ),
    types.Tool(
        name="get_gene_variants",
        description="Get genetic variants associated with a specific gene.",
        inputSchema={
            "type": "object",
            "properties": {
                "gene_id": {"type": "string", "description": "Gene ID (e.g., HGNC:1097)"},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            },
            "required": ["gene_id"]
        }
    ),
    types.Tool(
        name="get_variants_by_disease",
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
    )
]