# Monarch MCP Server

A Model Context Protocol (MCP) server that exposes the Monarch Initiative API as a set of tools.

## Features

### Core Capabilities

- **Entity Search**: Query genes, diseases, phenotypes across 33 integrated biomedical resources
- **Phenotype Matching**: Find similar diseases using semantic similarity algorithms
- **Cross-Species Analysis**: Explore gene-phenotype-disease relationships across human and model organisms
- **Association Discovery**: Navigate connections between genes, diseases, phenotypes, chemicals, and variants
- **Clinical Diagnostics**: Support rare disease diagnosis through phenotype profile matching
- **Ontology Mapping**: Translate between different biomedical nomenclatures (OMIM, MONDO, HP, etc.)
- **Chemical/Drug Data**: Access drug-disease relationships and treatment information

### Data Sources

The Monarch Knowledge Graph integrates 33 biomedical resources:

- **Clinical/Genetics**: OMIM, Orphanet, ClinVar, HGNC, HPO (Human Phenotype Ontology)
- **Model Organisms**: Alliance of Genome Resources (MGI, ZFIN, WormBase, FlyBase, Xenbase, RGD), dictyBase, PomBase, SGD
- **Ontologies**: MONDO (diseases), Gene Ontology, Uberon (anatomy), CHEBI (chemicals), PHENIO (cross-species phenotypes)
- **Pathways & Interactions**: Reactome, STRING, BioGRID
- **Expression**: Bgee (gene expression across species)
- **Proteins**: UniProt
- **Literature**: PubMed annotations
- **Reference**: Ensembl, NCBI Gene

## Prerequisites

- Python 3.12+ with pip

## Quick Start

### 1. Install UV
UV is a fast Python package and project manager.

```bash
pip install uv
```

### 2. Install MCPM (MCP Manager)
MCPM is a package manager for MCP servers that simplifies installation and configuration.

```bash
pip install mcpm
```

### 3. Setup the MCP Server
```bash
cd monarch-mcp
uv sync
```

### 4. Add the Server to Claude Desktop
```bash
# Make sure you're in the project directory
cd monarch-mcp

# Set Claude as the target client
mcpm target set @claude-desktop

# Add the Monarch MCP server
mcpm import stdio monarch \
  --command "$(uv run which python)" \
  --args "-m monarch_mcp.server"
```
Then restart Claude Desktop.

## Usage

#### Running the Server

```bash
uv run python -m monarch_mcp.server
```

You can choose a specific transport when starting the FastMCP server:

```bash
uv run python -m monarch_mcp.server --transport stdio        # default (Claude Desktop)
uv run python -m monarch_mcp.server --transport sse --host 0.0.0.0 --port 8000
uv run python -m monarch_mcp.server --transport http --host 0.0.0.0 --port 8000
```

When running with `--transport sse` or `--transport http`, the server exposes a discovery document at `/.well-known/mcp.json` and a health check at `/`.

#### AI Agent Example

```bash
# Create .env file with your OpenAI API key
echo "OPENAI_API_KEY=your_key_here" > .env

# Run the example agent
uv run python examples/react_agent.py
```

#### Development

```bash
# Run tests
uv run pytest tests/ -v
```
