from typing import Any, Dict, List, Optional
import mcp.types as types
from ..client import MonarchClient

class SearchApi:
    """
    Search and autocomplete functionality across Monarch entities.
    """

    async def search(
        self,
        client: MonarchClient,
        q: str = "*:*",
        category: Optional[List[str]] = None,
        in_taxon_label: Optional[List[str]] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """
        Search for entities by label, with optional filters.
        """
        params = {
            "q": q,
            "category": category,
            "in_taxon_label": in_taxon_label,
            "limit": limit,
            "offset": offset,
        }
        params = {k: v for k, v in params.items() if v is not None}
        return await client.get("search", params=params)

    async def autocomplete(self, client: MonarchClient, q: str = "*:*") -> Dict[str, Any]:
        """
        Autocomplete for entities by label.
        """
        return await client.get("autocomplete", params={"q": q})

    async def semsim_autocomplete(self, client: MonarchClient, q: str = "*:*") -> Dict[str, Any]:
        """
        Autocomplete for semantic similarity lookups.
        """
        return await client.get("semsim/autocomplete", params={"q": q})

SEARCH_TOOLS = [
    types.Tool(
        name="search",
        description="Search for entities (diseases, phenotypes, genes, etc.) by text query with optional filters.",
        inputSchema={
            "type": "object",
            "properties": {
                "q": {"type": "string", "description": "Search query text", "default": "*:*"},
                "category": {"type": "array", "items": {"type": "string"}, "description": "Filter by Biolink categories (e.g., ['biolink:Disease', 'biolink:Gene'])."},
                "in_taxon_label": {"type": "array", "items": {"type": "string"}, "description": "Filter by taxon labels (e.g., ['Homo sapiens', 'Mus musculus'])."},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            }
        }
    ),
    types.Tool(
        name="autocomplete",
        description="Get autocomplete suggestions for entity names based on partial query.",
        inputSchema={
            "type": "object",
            "properties": {
                "q": {"type": "string", "description": "Partial search query for autocomplete", "default": "*:*"}
            }
        }
    ),
    types.Tool(
        name="semsim_autocomplete",
        description="Get autocomplete suggestions for semantic similarity lookups, prioritizing entities with direct phenotype associations.",
        inputSchema={
            "type": "object",
            "properties": {
                "q": {"type": "string", "description": "Partial search query for autocomplete", "default": "*:*"}
            }
        }
    )
]