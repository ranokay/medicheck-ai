FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies
# --frozen ensures we use the exact versions in uv.lock
# We create the venv in the image
# --no-install-project avoids trying to install the project itself before source is copied
RUN uv sync --frozen --no-install-project

# Copy the rest of the application
COPY . .

# Install the project itself
RUN uv sync --frozen

# Make sure the venv is used
ENV PATH="/app/.venv/bin:$PATH"

# Default command (can be overridden)
CMD ["uv", "run", "uvicorn", "monarch_mcp.api_server:app", "--host", "0.0.0.0", "--port", "8000"]
