import os
import sys

# Ensure the src-layout package is importable when Vercel loads this module.
_ROOT = os.path.dirname(os.path.dirname(__file__))
_SRC = os.path.join(_ROOT, "src")
if _SRC not in sys.path:
    sys.path.insert(0, _SRC)

from monarch_mcp.api_server import app  # noqa: E402

__all__ = ["app"]
