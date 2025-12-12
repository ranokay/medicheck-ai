"""FastMCP-backed server for Monarch Initiative MCP tools."""
from __future__ import annotations

import anyio
import functools
import inspect
import logging
import os
from contextlib import asynccontextmanager
from typing import Any, Callable, Optional

from dotenv import load_dotenv
from fastmcp import FastMCP
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
import mcp.types as mcp_types
from mcp.server.lowlevel.server import NotificationOptions

from . import __version__ as package_version
from .client import MonarchClient
from .tools import (
    ChemicalApi,
    DiseaseApi,
    EntityApi,
    GeneApi,
    HistoPhenoApi,
    MappingApi,
    PhenotypeApi,
    ProteinApi,
    SearchApi,
    SimilarityApi,
    VariantApi,
)

__all__ = [
    "mcp",
    "get_client",
    "main",
]

# ---------------------------------------------------------------------------
# Logging & environment setup
# ---------------------------------------------------------------------------
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Client lifecycle management
# ---------------------------------------------------------------------------
_client: Optional[MonarchClient] = None


def get_client() -> MonarchClient:
    """Return the active MonarchClient or raise if not initialised."""
    if _client is None:
        raise RuntimeError(
            "MonarchClient not initialised. Tools must be called through the running MCP server."
        )
    return _client


@asynccontextmanager
async def lifespan(server: FastMCP):
    """Initialise and clean up shared resources for FastMCP."""
    global _client

    logger.info("Starting Monarch MCP server")
    _client = MonarchClient()

    try:
        yield
    finally:
        if _client is not None:
            await _client.close()
            _client = None
            logger.info("Monarch MCP server shut down cleanly")


# ---------------------------------------------------------------------------
# FastMCP initialisation
# ---------------------------------------------------------------------------
mcp = FastMCP(
    name="monarch-mcp",
    version=package_version,
    lifespan=lifespan,
)

_entity_api = EntityApi()
_disease_api = DiseaseApi()
_gene_api = GeneApi()
_phenotype_api = PhenotypeApi()
_similarity_api = SimilarityApi()
_search_api = SearchApi()
_histopheno_api = HistoPhenoApi()
_mapping_api = MappingApi()
_chemical_api = ChemicalApi()
_variant_api = VariantApi()
_protein_api = ProteinApi()


def _make_tool_wrapper(method: Callable[..., Any]) -> Callable[..., Any]:
    """Wrap an API coroutine so the shared client is injected automatically."""

    @functools.wraps(method)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        client = get_client()
        return await method(client, *args, **kwargs)

    signature = inspect.signature(method)
    params = list(signature.parameters.values())[1:]
    wrapper.__signature__ = signature.replace(parameters=params)  # type: ignore[attr-defined]
    return wrapper


def register_all_api_methods() -> None:
    """Register every coroutine defined on the API mixins as FastMCP tools."""
    api_instances = (
        _entity_api,
        _disease_api,
        _gene_api,
        _phenotype_api,
        _similarity_api,
        _search_api,
        _histopheno_api,
        _mapping_api,
        _chemical_api,
        _variant_api,
        _protein_api,
    )

    for api in api_instances:
        for name in dir(api):
            if name.startswith("_"):
                continue
            method = getattr(api, name)
            if not inspect.iscoroutinefunction(method):
                continue
            if name in getattr(mcp._tool_manager, "_tools", {}):
                logger.debug("Tool already registered: %s", name)
                continue
            wrapper = _make_tool_wrapper(method)
            mcp.tool(name=name)(wrapper)
            logger.debug("Registered tool: %s", name)


register_all_api_methods()


# ---------------------------------------------------------------------------
# Deprecated module-level guidance
# ---------------------------------------------------------------------------

def __getattr__(name: str) -> Any:  # pragma: no cover - guidance only
    if name == "ALL_TOOLS":
        raise AttributeError(
            "ALL_TOOLS has been removed in v0.2.0. Use FastMCP list_tools instead."
        )
    if name == "API_CLASS_MAP":
        raise AttributeError(
            "API_CLASS_MAP has been removed in v0.2.0. Tool dispatch is handled by FastMCP."
        )
    raise AttributeError(name)


# ---------------------------------------------------------------------------
# Discovery endpoint for HTTP/SSE transports
# ---------------------------------------------------------------------------


@mcp.custom_route("/.well-known/mcp.json", methods=["GET"], include_in_schema=False)
async def discovery_endpoint(request: Request) -> JSONResponse:
    """Expose MCP discovery metadata for HTTP/SSE clients."""

    base_url = str(request.base_url).rstrip("/")
    sse_path = mcp._deprecated_settings.sse_path.lstrip("/")
    message_path = mcp._deprecated_settings.message_path.lstrip("/")
    http_path = mcp._deprecated_settings.streamable_http_path.lstrip("/")

    capabilities = mcp._mcp_server.get_capabilities(
        NotificationOptions(),
        experimental_capabilities={}
    )

    transports: dict[str, dict[str, str]] = {
        "sse": {
            "url": f"{base_url}/{sse_path}",
            "messageUrl": f"{base_url}/{message_path}",
        }
    }

    transports["http"] = {
        "url": f"{base_url}/{http_path}",
    }

    discovery = {
        "protocolVersion": mcp_types.LATEST_PROTOCOL_VERSION,
        "server": {
            "name": mcp._mcp_server.name,
            "version": mcp._mcp_server.version,
            "instructions": mcp._mcp_server.instructions,
        },
        "capabilities": capabilities.model_dump(mode="json"),
        "transports": transports,
    }

    return JSONResponse(discovery)


@mcp.custom_route("/", methods=["GET"], include_in_schema=False)
async def root_health(_: Request) -> JSONResponse:
    """Simple health check endpoint."""

    return JSONResponse({"status": "ok"})


@mcp.custom_route(mcp._deprecated_settings.sse_path, methods=["POST"], include_in_schema=False)
async def sse_message_fallback(_: Request) -> Response:
    """Gracefully handle clients that POST to the SSE endpoint."""

    return Response(status_code=204)


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------
def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(
        description="Monarch MCP Server",
        epilog="Environment overrides: MCP_TRANSPORT, FASTMCP_SERVER_HOST, FASTMCP_SERVER_PORT",
    )
    parser.add_argument(
        "--transport",
        choices=["stdio", "sse", "http"],
        default=os.getenv("MCP_TRANSPORT", "stdio"),
        help="Transport protocol to expose (stdio, sse, or http)",
    )
    parser.add_argument(
        "--host",
        default=os.getenv("FASTMCP_SERVER_HOST", "0.0.0.0"),
        help="Host for SSE transport (default: 0.0.0.0)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.getenv("FASTMCP_SERVER_PORT", "8000")),
        help="Port for SSE transport (default: 8000)",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose (DEBUG level) logging",
    )

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    if args.transport in {"sse", "http"}:
        os.environ["FASTMCP_SERVER_HOST"] = args.host
        os.environ["FASTMCP_SERVER_PORT"] = str(args.port)
        if hasattr(mcp, "settings"):
            mcp.settings.host = args.host  # type: ignore[attr-defined]
            mcp.settings.port = args.port  # type: ignore[attr-defined]
        logger.info("Configured %s host=%s port=%s", args.transport.upper(), args.host, args.port)

    logger.info(
        "Starting Monarch MCP server (transport=%s, host=%s, port=%s)",
        args.transport,
        args.host,
        args.port,
    )

    try:
        if args.transport == "http":
            async def run_http() -> None:
                await mcp.run_http_async(host=args.host, port=args.port)

            anyio.run(run_http)
        else:
            mcp.run(transport=args.transport)
    except KeyboardInterrupt:  # pragma: no cover - user interaction
        logger.info("Server interrupted by user")
    except Exception:  # pragma: no cover - unexpected runtime failure
        logger.exception("Server encountered an unrecoverable error")
        raise


if __name__ == "__main__":  # pragma: no cover
    main()
