FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Copy dependency files
COPY pyproject.toml ./

# Copy the rest of the application
COPY . .

# Install dependencies
RUN uv sync

# Make sure the venv is used
ENV PATH="/app/.venv/bin:$PATH"

# Default command (can be overridden)
CMD ["uv", "run", "uvicorn", "monarch_mcp.api_server:app", "--host", "0.0.0.0", "--port", "8500"]
