from typing import Any, Dict, List, Optional
import mcp.types as types
from ..client import MonarchClient

class EntityApi:
    """
    Core tool for retrieving entities and their associations from the Monarch API.
    """

    async def get_entity(self, client: MonarchClient, entity_id: str) -> Dict[str, Any]:
        """
        Retrieves the entity with the specified ID.
        """
        return await client.get(f"entity/{entity_id}")

    async def get_entity_associations_by_category(
        self,
        client: MonarchClient,
        entity_id: str,
        category: str,
        traverse_orthologs: bool = False,
        direct: bool = False,
        query: Optional[str] = None,
        sort: Optional[List[str]] = None,
        facet_fields: Optional[List[str]] = None,
        facet_queries: Optional[List[str]] = None,
        filter_queries: Optional[List[str]] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Retrieves association data for a given entity and association category.
        """
        params = {
            "traverse_orthologs": traverse_orthologs,
            "direct": direct,
            "query": query,
            "sort": sort,
            "facet_fields": facet_fields,
            "facet_queries": facet_queries,
            "filter_queries": filter_queries,
            "limit": limit,
            "offset": offset
        }
        params = {k: v for k, v in params.items() if v is not None}
        return await client.get(f"entity/{entity_id}/{category}", params=params)

    async def get_associations(
        self,
        client: MonarchClient,
        category: Optional[List[str]] = None,
        subject: Optional[List[str]] = None,
        predicate: Optional[List[str]] = None,
        object: Optional[List[str]] = None,
        entity: Optional[List[str]] = None,
        direct: bool = False,
        compact: bool = False,
        limit: int = 20,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """
        Retrieves associations using the generic /association endpoint.
        """
        params = {
            "category": category,
            "subject": subject,
            "predicate": predicate,
            "object": object,
            "entity": entity,
            "direct": direct,
            "compact": compact,
            "limit": limit,
            "offset": offset,
        }
        params = {k: v for k, v in params.items() if v is not None}
        return await client.get("association", params=params)

    async def get_associations_advanced(
        self,
        client: MonarchClient,
        category: Optional[List[str]] = None,
        subject: Optional[List[str]] = None,
        subject_category: Optional[List[str]] = None,
        subject_namespace: Optional[List[str]] = None,
        subject_taxon: Optional[List[str]] = None,
        predicate: Optional[List[str]] = None,
        object: Optional[List[str]] = None,
        object_category: Optional[List[str]] = None,
        object_namespace: Optional[List[str]] = None,
        object_taxon: Optional[List[str]] = None,
        entity: Optional[List[str]] = None,
        direct: bool = False,
        compact: bool = False,
        facet_fields: Optional[List[str]] = None,
        facet_queries: Optional[List[str]] = None,
        filter_queries: Optional[List[str]] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """
        Advanced association query with all available filters.
        """
        params = {
            "category": category,
            "subject": subject,
            "subject_category": subject_category,
            "subject_namespace": subject_namespace,
            "subject_taxon": subject_taxon,
            "predicate": predicate,
            "object": object,
            "object_category": object_category,
            "object_namespace": object_namespace,
            "object_taxon": object_taxon,
            "entity": entity,
            "direct": direct,
            "compact": compact,
            "facet_fields": facet_fields,
            "facet_queries": facet_queries,
            "filter_queries": filter_queries,
            "limit": limit,
            "offset": offset,
        }
        params = {k: v for k, v in params.items() if v is not None}
        return await client.get("association", params=params)

    async def get_entities_batch(
        self,
        client: MonarchClient,
        entity_ids: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Get information for multiple entities at once.
        """
        results = []
        for entity_id in entity_ids:
            try:
                result = await client.get(f"entity/{entity_id}")
                results.append(result)
            except Exception as e:
                results.append({"id": entity_id, "error": str(e)})
        return results

ENTITY_TOOLS = [
    types.Tool(
        name="get_entity",
        description="Get detailed information about any Monarch entity (disease, phenotype, gene, etc.) by its ID.",
        inputSchema={
            "type": "object",
            "properties": {
                "entity_id": {"type": "string", "description": "Entity ID (e.g., MONDO:0005015, HP:0001250, HGNC:1097)"}
            },
            "required": ["entity_id"]
        }
    ),
    types.Tool(
        name="get_entity_associations_by_category",
        description="Retrieves a table of associations for a given entity, filtered by a single high-level category with optional ortholog traversal.",
        inputSchema={
            "type": "object",
            "properties": {
                "entity_id": {"type": "string", "description": "The ID of the entity, e.g., 'MONDO:0019391'"},
                "category": {"type": "string", "description": "The category of association table to retrieve."},
                "traverse_orthologs": {"type": "boolean", "description": "Whether to traverse orthologs for cross-species data.", "default": False},
                "direct": {"type": "boolean", "description": "Whether to only return direct associations.", "default": False},
                "limit": {"type": "number", "description": "Number of results per page (default: 20)", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination (default: 0)", "default": 0}
            },
            "required": ["entity_id", "category"]
        }
    ),
    types.Tool(
        name="get_associations",
        description="Retrieves associations with powerful filtering, such as by subject, predicate, or object.",
        inputSchema={
            "type": "object",
            "properties": {
                "category": {"type": "array", "items": {"type": "string"}, "description": "A list of association categories to filter for."},
                "subject": {"type": "array", "items": {"type": "string"}, "description": "A list of subject CURIEs to filter for."},
                "predicate": {"type": "array", "items": {"type": "string"}, "description": "A list of predicate CURIEs to filter for."},
                "object": {"type": "array", "items": {"type": "string"}, "description": "A list of object CURIEs to filter for."},
                "entity": {"type": "array", "items": {"type": "string"}, "description": "A list of entity CURIEs to filter for, in any position."},
                "direct": {"type": "boolean", "description": "Whether to only return direct associations.", "default": False},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            }
        }
    ),
    types.Tool(
        name="get_associations_advanced",
        description="Advanced association query with detailed filtering by categories, namespaces, and taxons for subjects and objects.",
        inputSchema={
            "type": "object",
            "properties": {
                "category": {"type": "array", "items": {"type": "string"}, "description": "Association categories to filter for."},
                "subject": {"type": "array", "items": {"type": "string"}, "description": "Subject CURIEs to filter for."},
                "subject_category": {"type": "array", "items": {"type": "string"}, "description": "Subject categories (e.g., biolink:Gene)."},
                "subject_namespace": {"type": "array", "items": {"type": "string"}, "description": "Subject namespaces (e.g., HGNC)."},
                "subject_taxon": {"type": "array", "items": {"type": "string"}, "description": "Subject taxons (e.g., NCBITaxon:9606 for human)."},
                "predicate": {"type": "array", "items": {"type": "string"}, "description": "Predicate CURIEs to filter for."},
                "object": {"type": "array", "items": {"type": "string"}, "description": "Object CURIEs to filter for."},
                "object_category": {"type": "array", "items": {"type": "string"}, "description": "Object categories."},
                "object_namespace": {"type": "array", "items": {"type": "string"}, "description": "Object namespaces."},
                "object_taxon": {"type": "array", "items": {"type": "string"}, "description": "Object taxons."},
                "entity": {"type": "array", "items": {"type": "string"}, "description": "Entity CURIEs in any position."},
                "direct": {"type": "boolean", "description": "Only return direct associations.", "default": False},
                "facet_fields": {"type": "array", "items": {"type": "string"}, "description": "Fields to facet on."},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            }
        }
    ),
    types.Tool(
        name="get_entities_batch",
        description="Get information for multiple entities at once in a single batch operation.",
        inputSchema={
            "type": "object",
            "properties": {
                "entity_ids": {"type": "array", "items": {"type": "string"}, "description": "List of entity IDs to retrieve"}
            },
            "required": ["entity_ids"]
        }
    )
]