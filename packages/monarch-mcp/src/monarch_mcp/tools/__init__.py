"""Public API surfaces for Monarch MCP tool classes.

`ALL_TOOLS` and `API_CLASS_MAP` were removed in v0.2.0. FastMCP now handles tool
registration and dispatching directly in `monarch_mcp.server`.
"""

from .chemical import ChemicalApi
from .disease import DiseaseApi
from .entity import EntityApi
from .gene import GeneApi
from .histopheno import HistoPhenoApi
from .mapping import MappingApi
from .phenotype import PhenotypeApi
from .protein import ProteinApi
from .search import SearchApi
from .similarity import SimilarityApi
from .variant import VariantApi

__all__ = [
    "ChemicalApi",
    "DiseaseApi",
    "EntityApi",
    "GeneApi",
    "HistoPhenoApi",
    "MappingApi",
    "PhenotypeApi",
    "ProteinApi",
    "SearchApi",
    "SimilarityApi",
    "VariantApi",
]


def __getattr__(name: str):
    if name == "ALL_TOOLS":
        import warnings

        warnings.warn(
            "ALL_TOOLS is deprecated in v0.2.0. Tools are now managed by FastMCP.",
            DeprecationWarning,
            stacklevel=2,
        )
        return []
    if name == "API_CLASS_MAP":
        import warnings

        warnings.warn(
            "API_CLASS_MAP is deprecated in v0.2.0. FastMCP handles tool dispatch.",
            DeprecationWarning,
            stacklevel=2,
        )
        return {}
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")
