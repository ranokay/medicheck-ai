from typing import Any, Dict, List, Optional
import mcp.types as types
from ..client import MonarchClient

class MappingApi:
    """
    Tool for retrieving entity mappings (e.g., skos:exactMatch) from the Monarch API.
    """

    async def get_mappings(
        self,
        client: MonarchClient,
        entity_id: Optional[List[str]] = None,
        subject_id: Optional[List[str]] = None,
        predicate_id: Optional[List[str]] = None,
        object_id: Optional[List[str]] = None,
        mapping_justification: Optional[List[str]] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """
        Retrieves mappings for entities.
        """
        params = {
            "entity_id": entity_id,
            "subject_id": subject_id,
            "predicate_id": predicate_id,
            "object_id": object_id,
            "mapping_justification": mapping_justification,
            "limit": limit,
            "offset": offset,
        }
        params = {k: v for k, v in params.items() if v is not None}
        return await client.get("mappings", params=params)

MAPPING_TOOLS = [
    types.Tool(
        name="get_mappings",
        description="Retrieve mappings (e.g., skos:exactMatch, skos:closeMatch) between entities from different namespaces.",
        inputSchema={
            "type": "object",
            "properties": {
                "entity_id": {"type": "array", "items": {"type": "string"}, "description": "Entity CURIEs to retrieve mappings for."},
                "subject_id": {"type": "array", "items": {"type": "string"}, "description": "Subject CURIEs to filter mappings."},
                "predicate_id": {"type": "array", "items": {"type": "string"}, "description": "Predicate CURIEs (e.g., ['skos:exactMatch', 'skos:closeMatch', 'skos:broadMatch'])."},
                "object_id": {"type": "array", "items": {"type": "string"}, "description": "Object CURIEs to filter mappings."},
                "mapping_justification": {"type": "array", "items": {"type": "string"}, "description": "Mapping justifications to filter by."},
                "limit": {"type": "number", "description": "Number of results per page.", "default": 20},
                "offset": {"type": "number", "description": "Offset for pagination.", "default": 0}
            }
        }
    )
]