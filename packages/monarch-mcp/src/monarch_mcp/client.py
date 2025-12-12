# src/monarch_mcp/client.py
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

class MonarchClient:
    def __init__(self):
        self.base_url = os.getenv("MONARCH_API_URL")
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=None)

    async def get(self, endpoint, params=None):
        try:
            response = await self.client.get(endpoint, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            # Re-raise with more context
            raise Exception(f"HTTP error occurred: {e.response.status_code} - {e.response.text}") from e

    async def post(self, endpoint, data=None):
        try:
            response = await self.client.post(endpoint, json=data)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise Exception(f"HTTP error occurred: {e.response.status_code} - {e.response.text}") from e

    async def close(self):
        """
        Closes the underlying httpx client session using the correct async method.
        """
        # CORRECT: The httpx async client uses 'aclose()'
        await self.client.aclose()