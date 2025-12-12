from typing import Any, Dict
import mcp.types as types
from ..client import MonarchClient

class HistoPhenoApi:
    """
    Tool for retrieving histopheno data from the Monarch API.
    """

    async def get_histopheno(self, client: MonarchClient, id: str) -> Dict[str, Any]:
        """
        Retrieves histopheno data for a given entity ID.
        """
        return await client.get(f"histopheno/{id}")

HISTOPHENO_TOOLS = [
    types.Tool(
        name="get_histopheno",
        description="Retrieves histophenotype data showing phenotype frequency information for a disease.",
        inputSchema={
            "type": "object",
            "properties": {
                "id": {"type": "string", "description": "The disease entity ID (e.g., MONDO:0019391)."}
            },
            "required": ["id"]
        }
    )
]