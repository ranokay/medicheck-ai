"""FastAPI REST server for Monarch Initiative API.

Exposes all Monarch tools as REST endpoints, replacing the MCP protocol.
This is designed for direct frontend consumption.
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

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

__all__ = ["app", "main"]

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
        raise RuntimeError("MonarchClient not initialised.")
    return _client


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise and clean up shared resources."""
    global _client

    logger.info("Starting Monarch REST API server")
    _client = MonarchClient()

    try:
        yield
    finally:
        if _client is not None:
            await _client.close()
            _client = None
            logger.info("Monarch REST API server shut down cleanly")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Monarch Initiative API",
    description="REST API for querying the Monarch Initiative Knowledge Graph",
    version=package_version,
    lifespan=lifespan,
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize API instances
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


# ---------------------------------------------------------------------------
# Request/Response Models
# ---------------------------------------------------------------------------


class SearchRequest(BaseModel):
    query: str = Field(..., description="Search query string")
    category: Optional[str] = Field(None, description="Entity category filter")
    limit: int = Field(20, ge=1, le=100, description="Maximum results")
    offset: int = Field(0, ge=0, description="Pagination offset")


class PhenotypeProfileRequest(BaseModel):
    phenotype_ids: List[str] = Field(..., description="List of HPO phenotype IDs")
    search_group: str = Field("Human Diseases", description="Group to search")
    metric: str = Field("ancestor_information_content", description="Similarity metric")
    limit: int = Field(10, ge=1, le=100, description="Maximum results")


class TermsetCompareRequest(BaseModel):
    subjects: List[str] = Field(..., description="Subject entity IDs")
    objects: List[str] = Field(..., description="Object entity IDs")
    metric: str = Field("ancestor_information_content", description="Similarity metric")


class SimilarTermsRequest(BaseModel):
    termset: List[str] = Field(..., description="Entity IDs to find similar terms for")
    search_group: str = Field(..., description="Group to search within")
    metric: str = Field("ancestor_information_content", description="Similarity metric")
    directionality: str = Field("bidirectional", description="Comparison direction")
    limit: int = Field(10, ge=1, le=100, description="Maximum results")


class AssociationsRequest(BaseModel):
    subject: Optional[List[str]] = Field(None, description="Subject entity IDs")
    object: Optional[List[str]] = Field(None, description="Object entity IDs")
    category: Optional[List[str]] = Field(None, description="Association categories")
    limit: int = Field(20, ge=1, le=500, description="Maximum results")
    offset: int = Field(0, ge=0, description="Pagination offset")


class ChatRequest(BaseModel):
    message: str = Field(..., description="User message")
    context: Optional[str] = Field(None, description="Additional context for the LLM")
    phenotypes: List[str] = Field(default=[], description="Selected phenotype IDs")
    diagnosis_results: Optional[List[dict]] = Field(
        None, description="Diagnosis results for context"
    )
    history: Optional[List[dict]] = Field(
        None, description="Conversation history (role, content)"
    )
    conversation_history: Optional[List[dict]] = Field(
        None, description="Previous messages (deprecated, use history)"
    )


class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[str]] = None


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "version": package_version}


# ---------------------------------------------------------------------------
# Search endpoints
# ---------------------------------------------------------------------------


@app.get("/search")
async def search_entities(
    query: str,
    category: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Search for entities across the Monarch Knowledge Graph."""
    try:
        client = get_client()
        category_list = [category] if category else None
        result = await _search_api.search(
            client, q=query, category=category_list, limit=limit, offset=offset
        )
        return result
    except Exception as e:
        logger.exception("Search failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/autocomplete")
async def autocomplete(
    query: str,
    category: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50),
):
    """Autocomplete search for quick suggestions."""
    try:
        client = get_client()
        result = await _search_api.autocomplete(client, q=query)
        return result
    except Exception as e:
        logger.exception("Autocomplete failed")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Entity endpoints
# ---------------------------------------------------------------------------


@app.get("/entity/{entity_id:path}")
async def get_entity(entity_id: str):
    """Get detailed information about a specific entity."""
    try:
        client = get_client()
        result = await _entity_api.get_entity(client, entity_id=entity_id)
        return result
    except Exception as e:
        logger.exception(f"Failed to get entity {entity_id}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/entity/{entity_id:path}/children")
async def get_entity_children(
    entity_id: str,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """Get child entities in the ontology hierarchy."""
    try:
        client = get_client()
        # Get entity info which includes node_hierarchy with sub_classes
        result = await client.get(f"entity/{entity_id}", params={})

        # Extract children from node_hierarchy.sub_classes
        node_hierarchy = result.get("node_hierarchy", {})
        sub_classes = node_hierarchy.get("sub_classes", [])

        # Apply offset and limit
        paginated = sub_classes[offset : offset + limit]

        return {
            "items": paginated,
            "total": len(sub_classes),
            "limit": limit,
            "offset": offset,
        }
    except Exception as e:
        logger.exception(f"Failed to get children for {entity_id}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/associations")
async def get_associations(request: AssociationsRequest):
    """Get associations between entities."""
    try:
        client = get_client()
        result = await _entity_api.get_associations(
            client,
            subject=request.subject,
            object=request.object,
            category=request.category,
            limit=request.limit,
            offset=request.offset,
        )
        return result
    except Exception as e:
        logger.exception("Failed to get associations")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Phenotype endpoints
# ---------------------------------------------------------------------------


@app.post("/phenotype/profile-search")
async def phenotype_profile_search(request: PhenotypeProfileRequest):
    """Search for diseases matching a phenotype profile using semantic similarity."""
    try:
        client = get_client()
        result = await _phenotype_api.phenotype_profile_search(
            client,
            phenotype_ids=request.phenotype_ids,
            search_group=request.search_group,
            metric=request.metric,
            limit=request.limit,
        )
        return result
    except Exception as e:
        logger.exception("Phenotype profile search failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/phenotype/{phenotype_id:path}/diseases")
async def get_phenotype_diseases(
    phenotype_id: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Get diseases associated with a phenotype."""
    try:
        client = get_client()
        result = await _phenotype_api.get_diseases_with_phenotype(
            client, phenotype_id=phenotype_id, limit=limit, offset=offset
        )
        return result
    except Exception as e:
        logger.exception(f"Failed to get diseases for phenotype {phenotype_id}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/phenotype/{phenotype_id:path}/genes")
async def get_phenotype_genes(
    phenotype_id: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Get genes associated with a phenotype."""
    try:
        client = get_client()
        result = await _phenotype_api.get_genes_with_phenotype(
            client, phenotype_id=phenotype_id, limit=limit, offset=offset
        )
        return result
    except Exception as e:
        logger.exception(f"Failed to get genes for phenotype {phenotype_id}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Disease endpoints
# ---------------------------------------------------------------------------


@app.get("/disease/{disease_id:path}")
async def get_disease(disease_id: str):
    """Get detailed information about a disease."""
    try:
        client = get_client()
        result = await _entity_api.get_entity(client, entity_id=disease_id)
        return result
    except Exception as e:
        logger.exception(f"Failed to get disease {disease_id}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/disease/{disease_id:path}/phenotypes")
async def get_disease_phenotypes(
    disease_id: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Get phenotypes associated with a disease."""
    try:
        client = get_client()
        result = await _disease_api.get_disease_phenotype_associations(
            client, disease_id=disease_id, limit=limit, offset=offset
        )
        return result
    except Exception as e:
        logger.exception(f"Failed to get phenotypes for disease {disease_id}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/disease/{disease_id:path}/genes")
async def get_disease_genes(
    disease_id: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Get genes associated with a disease."""
    try:
        client = get_client()
        result = await _disease_api.get_disease_gene_associations(
            client, disease_id=disease_id, limit=limit, offset=offset
        )
        return result
    except Exception as e:
        logger.exception(f"Failed to get genes for disease {disease_id}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Gene endpoints
# ---------------------------------------------------------------------------


@app.get("/gene/{gene_id:path}")
async def get_gene(gene_id: str):
    """Get detailed information about a gene."""
    try:
        client = get_client()
        result = await _entity_api.get_entity(client, entity_id=gene_id)
        return result
    except Exception as e:
        logger.exception(f"Failed to get gene {gene_id}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/gene/{gene_id:path}/phenotypes")
async def get_gene_phenotypes(
    gene_id: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Get phenotypes associated with a gene."""
    try:
        client = get_client()
        result = await _gene_api.get_gene_phenotype_associations(
            client, gene_id=gene_id, limit=limit, offset=offset
        )
        return result
    except Exception as e:
        logger.exception(f"Failed to get phenotypes for gene {gene_id}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/gene/{gene_id:path}/diseases")
async def get_gene_diseases(
    gene_id: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Get diseases associated with a gene."""
    try:
        client = get_client()
        result = await _gene_api.get_gene_disease_associations(
            client, gene_id=gene_id, limit=limit, offset=offset
        )
        return result
    except Exception as e:
        logger.exception(f"Failed to get diseases for gene {gene_id}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Similarity endpoints
# ---------------------------------------------------------------------------


@app.post("/similarity/compare")
async def compare_termsets(request: TermsetCompareRequest):
    """Calculate pairwise semantic similarity between two sets of terms."""
    try:
        client = get_client()
        result = await _similarity_api.compare_termsets(
            client,
            subjects=request.subjects,
            objects=request.objects,
            metric=request.metric,
        )
        return result
    except Exception as e:
        logger.exception("Termset comparison failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/similarity/search")
async def find_similar_terms(request: SimilarTermsRequest):
    """Find entities semantically similar to a given termset."""
    try:
        client = get_client()
        result = await _similarity_api.find_similar_terms(
            client,
            termset=request.termset,
            search_group=request.search_group,
            metric=request.metric,
            directionality=request.directionality,
            limit=request.limit,
        )
        return result
    except Exception as e:
        logger.exception("Similar terms search failed")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# HPO Hierarchy endpoints (for symptom refinement)
# ---------------------------------------------------------------------------


@app.get("/hpo/{hpo_id:path}/children")
async def get_hpo_children(
    hpo_id: str,
    limit: int = Query(100, ge=1, le=500),
):
    """Get child terms of an HPO phenotype for refinement questions."""
    try:
        client = get_client()
        # Get entity info which includes node_hierarchy with sub_classes
        result = await client.get(f"entity/{hpo_id}", params={})

        # Extract children from node_hierarchy.sub_classes
        node_hierarchy = result.get("node_hierarchy", {})
        sub_classes = node_hierarchy.get("sub_classes", [])

        # Filter to only HPO terms and apply limit
        children = []
        for child in sub_classes[:limit]:
            if child.get("id", "").startswith("HP:"):
                children.append(
                    {
                        "id": child.get("id"),
                        "subject": child.get("id"),
                        "subject_label": child.get("name"),
                        "subject_category": "biolink:PhenotypicFeature",
                        "object": hpo_id,
                        "object_label": result.get("name", ""),
                        "predicate": "biolink:subclass_of",
                        # Include full entity info for frontend
                        "name": child.get("name"),
                        "description": child.get("description"),
                    }
                )

        return {
            "parent_id": hpo_id,
            "parent_name": result.get("name", ""),
            "children": children,
            "total": len(children),
        }
    except Exception as e:
        logger.exception(f"Failed to get HPO children for {hpo_id}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Chat endpoint (LLM Q&A)
# ---------------------------------------------------------------------------


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    LLM-powered Q&A about diagnosis results.

    This endpoint provides AI assistance ONLY for:
    - Explaining diagnosis results
    - Answering questions about diseases/phenotypes
    - Providing general medical information context

    It does NOT make diagnostic decisions - those are based on
    semantic similarity from the Monarch Knowledge Graph.
    """
    try:
        import openai

        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            raise HTTPException(
                status_code=503,
                detail="Chat service unavailable - OpenAI API key not configured",
            )

        openai_client = openai.AsyncOpenAI(api_key=openai_api_key)

        # Build context from diagnosis results or use provided context
        context_parts = []

        # Use provided context if available
        if request.context:
            context_parts.append(request.context)

        if request.phenotypes:
            context_parts.append(
                f"Selected phenotypes (HPO IDs): {', '.join(request.phenotypes)}"
            )

        if request.diagnosis_results:
            context_parts.append(
                "\nDiagnosis results (from semantic similarity search):"
            )
            for i, result in enumerate(request.diagnosis_results[:5], 1):
                name = result.get("name", result.get("id", "Unknown"))
                confidence = result.get("confidence", result.get("score", 0))
                context_parts.append(f"{i}. {name} - {confidence}% match")

        context = (
            "\n".join(context_parts)
            if context_parts
            else "No diagnosis context provided."
        )

        # Build conversation messages
        messages = [
            {
                "role": "system",
                "content": """You are a helpful medical information assistant for MediCheck AI.

IMPORTANT GUIDELINES:
1. You provide INFORMATION and CONTEXT only - never diagnostic conclusions
2. The diagnosis results shown are based on semantic similarity from the Monarch Knowledge Graph
3. Always recommend consulting a healthcare professional for actual medical advice
4. Explain medical terms in accessible language
5. You can discuss:
   - What the matched diseases are and their characteristics
   - How phenotypes relate to diseases
   - General information about symptoms and conditions
   - Why certain diseases may have matched based on phenotype similarity
6. You should NOT:
   - Confirm or deny any diagnosis
   - Provide treatment recommendations
   - Make medical decisions

Current context:
"""
                + context,
            }
        ]

        # Add conversation history if provided (prefer new 'history' field over deprecated 'conversation_history')
        history_to_use = request.history or request.conversation_history
        if history_to_use:
            for msg in history_to_use[-10:]:  # Last 10 messages
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role in ["user", "assistant"] and content:
                    messages.append({"role": role, "content": content})

        # Add current message
        messages.append({"role": "user", "content": request.message})

        # Call OpenAI
        response = await openai_client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            messages=messages,
            max_tokens=1000,
            temperature=0.7,
        )

        assistant_message = (
            response.choices[0].message.content
            or "I apologize, but I couldn't generate a response."
        )

        return ChatResponse(
            response=assistant_message,
            sources=["Monarch Initiative Knowledge Graph", "OpenAI GPT"],
        )

    except openai.APIError as e:
        logger.exception("OpenAI API error")
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")
    except Exception as e:
        logger.exception("Chat failed")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------


def main() -> None:
    import argparse

    import uvicorn

    parser = argparse.ArgumentParser(
        description="Monarch REST API Server",
        epilog="Environment: MONARCH_API_URL, OPENAI_API_KEY, HOST, PORT",
    )
    parser.add_argument(
        "--host",
        default=os.getenv("HOST", "0.0.0.0"),
        help="Host to bind (default: 0.0.0.0)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.getenv("PORT", "8500")),
        help="Port to bind (default: 8500)",
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Enable auto-reload for development",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose (DEBUG level) logging",
    )

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    logger.info(f"Starting Monarch REST API server on {args.host}:{args.port}")

    uvicorn.run(
        "monarch_mcp.api_server:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="debug" if args.verbose else "info",
    )


if __name__ == "__main__":
    main()
