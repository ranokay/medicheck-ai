# Monarch KG + Clinical Decision Support System Setup Guide

This guide walks you through setting up the complete technology stack for the MediCheck AI symptom checker based on the Monarch Initiative Knowledge Graph.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Install Neo4j](#step-1-install-neo4j)
4. [Step 2: Download & Load Monarch KG](#step-2-download--load-monarch-kg)
5. [Step 3: Configure KGX (Optional)](#step-3-configure-kgx-optional)
6. [Step 4: Set Up the KG Service](#step-4-set-up-the-kg-service)
7. [Step 5: Configure LLM Integration](#step-5-configure-llm-integration)
8. [Step 6: Connect Frontend (TanStack + Convex)](#step-6-connect-frontend-tanstack--convex)
9. [Production Deployment](#production-deployment)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (TanStack Router)                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Symptom Checker UI                                          │   │
│  │  - Body Part Selection (Uberon mapped)                       │   │
│  │  - Symptom Factors (HPO mapped)                              │   │
│  │  - Patient Demographics                                       │   │
│  └───────────────────────────┬─────────────────────────────────┘   │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         CONVEX BACKEND                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Actions & Mutations                                         │   │
│  │  - startDiagnosis()                                          │   │
│  │  - processSymptoms()                                         │   │
│  │  - saveDiagnosis()                                           │   │
│  └───────────────────────────┬─────────────────────────────────┘   │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                                 ▼
┌─────────────────────────┐       ┌─────────────────────────────────┐
│   KG SERVICE (Express)  │       │      LLM (OpenAI/Claude)        │
│  ┌───────────────────┐  │       │  - Symptom Extraction           │
│  │  Neo4j Driver     │  │       │  - Diagnosis Reasoning          │
│  │  Cypher Queries   │  │       │  - Natural Language Output      │
│  └─────────┬─────────┘  │       └─────────────────────────────────┘
└────────────┼────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NEO4J DATABASE                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   MONARCH KNOWLEDGE GRAPH                     │  │
│  │                                                               │  │
│  │  ┌──────────┐    has_phenotype    ┌──────────────┐           │  │
│  │  │ Disease  │◄───────────────────►│  Phenotype   │           │  │
│  │  │ (Mondo)  │                     │    (HPO)     │           │  │
│  │  └──────────┘                     └──────┬───────┘           │  │
│  │                                          │                    │  │
│  │                                    location_of                │  │
│  │                                          │                    │  │
│  │                                          ▼                    │  │
│  │                                   ┌──────────────┐            │  │
│  │                                   │  Anatomical  │            │  │
│  │                                   │   Entity     │            │  │
│  │                                   │   (Uberon)   │            │  │
│  │                                   └──────────────┘            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Ontologies Used

| Ontology | Purpose | Prefix |
|----------|---------|--------|
| **HPO** (Human Phenotype Ontology) | Symptoms & clinical findings | `HP:` |
| **Mondo** | Disease classification | `MONDO:` |
| **Uberon** | Anatomical structures | `UBERON:` |
| **Biolink Model** | Graph schema standardization | `biolink:` |

---

## Prerequisites

Before starting, ensure you have:

- **macOS/Linux** (Windows works with WSL)
- **Node.js 18+** or **Bun 1.0+**
- **Docker** (recommended for Neo4j)
- **At least 16GB RAM** (Neo4j with Monarch KG requires ~8GB)
- **50GB free disk space** (for the full Monarch KG dump)

---

## Step 1: Install Neo4j

### Option A: Docker (Recommended)

```bash
# Create data directory
mkdir -p ~/neo4j-monarch/data ~/neo4j-monarch/logs ~/neo4j-monarch/import

# Run Neo4j Community Edition
docker run \
  --name neo4j-monarch \
  -p 7474:7474 \
  -p 7687:7687 \
  -v ~/neo4j-monarch/data:/data \
  -v ~/neo4j-monarch/logs:/logs \
  -v ~/neo4j-monarch/import:/var/lib/neo4j/import \
  -e NEO4J_AUTH=neo4j/your_password_here \
  -e NEO4J_PLUGINS='["apoc", "graph-data-science"]' \
  -e NEO4J_dbms_memory_heap_initial__size=4G \
  -e NEO4J_dbms_memory_heap_max__size=8G \
  -e NEO4J_dbms_memory_pagecache_size=2G \
  -d neo4j:5.15.0
```

### Option B: Homebrew (macOS)

```bash
# Install Neo4j
brew install neo4j

# Start Neo4j
neo4j start

# Set initial password (first time only)
neo4j-admin dbms set-initial-password your_password_here
```

### Verify Installation

Open <http://localhost:7474> in your browser. You should see the Neo4j Browser.

---

## Step 2: Download & Load Monarch KG

### Option A: Use Monarch's Pre-built Neo4j Dump (Recommended)

This is the fastest method for a production-ready setup.

```bash
# Download the latest Monarch KG Neo4j dump
# Check https://monarchinitiative.org/kg/downloads for the latest version
cd ~/neo4j-monarch/import

# Download the dump file (~3-5GB compressed)
curl -LO https://data.monarchinitiative.org/monarch-kg/latest/monarch-kg-neo4j-dump.tar.gz

# Extract
tar -xzf monarch-kg-neo4j-dump.tar.gz

# Stop Neo4j
docker stop neo4j-monarch

# Load the dump
docker exec neo4j-monarch neo4j-admin database load --from-path=/var/lib/neo4j/import/monarch-kg monarch --overwrite-destination=true

# Start Neo4j
docker start neo4j-monarch
```

### Option B: Build from TSV Files (KGX Method)

If you need to customize the data or the dump isn't available:

```bash
# Install KGX (Knowledge Graph Exchange)
pip install kgx

# Download Monarch KG TSV files
curl -LO https://data.monarchinitiative.org/monarch-kg/latest/monarch-kg-nodes.tsv.gz
curl -LO https://data.monarchinitiative.org/monarch-kg/latest/monarch-kg-edges.tsv.gz

# Decompress
gunzip monarch-kg-nodes.tsv.gz monarch-kg-edges.tsv.gz

# Transform to Neo4j format using KGX
kgx transform \
  --input-type tsv \
  --input-filename monarch-kg-nodes.tsv monarch-kg-edges.tsv \
  --output-type neo4j \
  --output-filename neo4j-import \
  --stream
```

### Option C: Use Monarch REST API (No Local Neo4j)

For development or limited resources, use the public Monarch API:

```bash
# No local setup needed - the kg-service can query Monarch's public API
# Set in your environment:
export USE_MONARCH_API=true
export MONARCH_API_BASE=https://api.monarchinitiative.org/v3/api
```

### Verify Data Load

In Neo4j Browser (<http://localhost:7474>), run:

```cypher
// Count nodes by type
MATCH (n)
RETURN labels(n)[0] AS label, count(*) AS count
ORDER BY count DESC
LIMIT 10;

// Check for diseases with phenotypes
MATCH (d:Disease)-[:has_phenotype]->(p:PhenotypicFeature)
RETURN d.name, count(p) AS phenotypeCount
ORDER BY phenotypeCount DESC
LIMIT 10;

// Verify anatomical entities (Uberon)
MATCH (a:AnatomicalEntity)
RETURN a.id, a.name
LIMIT 10;
```

Expected output should show millions of nodes including Disease, PhenotypicFeature, Gene, and AnatomicalEntity.

---

## Step 3: Configure KGX (Optional)

KGX is useful for:

- Validating data against Biolink Model
- Transforming between formats (TSV, JSON-LD, Neo4j)
- Filtering/subsetting the graph

### Install KGX

```bash
# Create a Python virtual environment
python -m venv kg-tools
source kg-tools/bin/activate

# Install KGX and dependencies
pip install kgx[neo4j]
pip install biolink-model
```

### Validate Your Data

```bash
# Validate against Biolink Model
kgx validate \
  --input-type neo4j \
  --uri bolt://localhost:7687 \
  --username neo4j \
  --password your_password_here
```

---

## Step 4: Set Up the KG Service

The KG Service is an Express.js microservice that bridges your app and Neo4j.

### Environment Variables

Create `packages/kg-service/.env`:

```bash
# Neo4j Connection
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password_here

# Server
PORT=4000

# Optional: Use Monarch REST API instead of local Neo4j
# USE_MONARCH_API=true
# MONARCH_API_BASE=https://api.monarchinitiative.org/v3/api
```

### Install Dependencies

```bash
cd packages/kg-service
bun install
```

### Run the Service

```bash
bun run dev
# or
bun run src/index.ts
```

### Test the Endpoints

```bash
# Health check
curl http://localhost:4000/health

# Search body parts (anatomical entities)
curl -X POST http://localhost:4000/body-parts \
  -H "Content-Type: application/json" \
  -d '{"query": "heart"}'

# Get symptoms for body parts
curl -X POST http://localhost:4000/symptoms-for-body-parts \
  -H "Content-Type: application/json" \
  -d '{"bodyPartIds": ["UBERON:0000948"]}'

# Get candidate diseases
curl -X POST http://localhost:4000/candidate-diseases \
  -H "Content-Type: application/json" \
  -d '{"phenotypes": ["chest pain", "shortness of breath"]}'
```

---

## Step 5: Configure LLM Integration

The LLM provides natural language understanding and diagnostic reasoning.

### Convex Environment Setup

In your Convex dashboard or `.env.local`:

```bash
# OpenAI (Recommended)
OPENAI_API_KEY=sk-...

# Or Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# KG Service URL
KG_SERVICE_URL=http://localhost:4000
```

### Using Vercel AI SDK

The project uses `@ai-sdk/openai`. Configure in `convex/ai.ts`:

```typescript
import { openai } from "@ai-sdk/openai";

// Model selection
const model = openai("gpt-4o"); // Best for medical reasoning
// Or: openai("gpt-4o-mini") for faster/cheaper development
```

---

## Step 6: Connect Frontend (TanStack + Convex)

### Data Flow

1. **User selects body parts** → Stored in component state
2. **User adds symptom factors** → Mapped to HPO terms
3. **Submit diagnosis request** → Convex action
4. **Convex calls KG Service** → Neo4j Cypher queries
5. **LLM processes results** → Ranked diagnoses
6. **Results displayed** → React components

### Convex Mutations & Actions

```typescript
// In your component
import { useAction } from "convex/react";
import { api } from "@medicheck-ai/backend/convex/_generated/api";

const diagnose = useAction(api.diagnosis.processSymptoms);

// Call the action
const results = await diagnose({
  patientId: "...",
  bodyParts: ["UBERON:0000948"], // Heart
  symptoms: [
    { type: "pain_description", value: "sharp", hpoId: "HP:0025279" },
    { type: "trigger", value: "exertion", hpoId: "HP:0025276" }
  ],
  patientAge: 45,
  patientSex: "male",
  height: 175,
  weight: 80
});
```

---

## Production Deployment

### Neo4j Deployment Options

1. **Neo4j Aura** (Managed Cloud)
   - Easiest option
   - Auto-scaling
   - ~$65/month for Professional tier
   - <https://neo4j.com/cloud/aura/>

2. **Self-hosted on Cloud VM**
   - AWS EC2: r5.xlarge or larger
   - GCP: n2-highmem-4 or larger
   - Requires 16GB+ RAM

3. **Kubernetes (Helm)**

   ```bash
   helm install neo4j neo4j/neo4j \
     --set neo4j.password=your_password \
     --set neo4j.resources.memory=8Gi
   ```

### KG Service Deployment

Deploy as a Docker container:

```dockerfile
# Dockerfile
FROM oven/bun:1

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
CMD ["bun", "run", "src/index.ts"]
```

```bash
# Build and push
docker build -t your-registry/kg-service:latest .
docker push your-registry/kg-service:latest
```

### Environment Variables for Production

```bash
# Neo4j Aura
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_aura_password

# Optional: Redis for caching
REDIS_URL=redis://...

# Convex (automatically configured)
CONVEX_URL=https://your-deployment.convex.cloud
```

---

## Troubleshooting

### Neo4j Connection Issues

```bash
# Check if Neo4j is running
docker ps | grep neo4j

# View logs
docker logs neo4j-monarch

# Test connection
cypher-shell -a bolt://localhost:7687 -u neo4j -p your_password "RETURN 1"
```

### Memory Issues

```bash
# Increase Neo4j heap size
docker exec neo4j-monarch sh -c 'echo "dbms.memory.heap.max_size=8G" >> /var/lib/neo4j/conf/neo4j.conf'
docker restart neo4j-monarch
```

### Slow Queries

Create indexes for common queries:

```cypher
// Create indexes
CREATE INDEX disease_name IF NOT EXISTS FOR (d:Disease) ON (d.name);
CREATE INDEX phenotype_name IF NOT EXISTS FOR (p:PhenotypicFeature) ON (p.name);
CREATE INDEX anatomical_name IF NOT EXISTS FOR (a:AnatomicalEntity) ON (a.name);

// Full-text search indexes
CREATE FULLTEXT INDEX disease_search IF NOT EXISTS FOR (d:Disease) ON EACH [d.name, d.synonym];
CREATE FULLTEXT INDEX phenotype_search IF NOT EXISTS FOR (p:PhenotypicFeature) ON EACH [p.name, p.synonym];
```

### Monarch API Rate Limits

If using the public Monarch API:

- Max 10 requests/second
- Implement caching in your KG service
- Consider hosting local Neo4j for production

---

## Quick Start Commands

```bash
# 1. Start Neo4j
docker start neo4j-monarch

# 2. Start KG Service
cd packages/kg-service && bun dev

# 3. Start Convex
cd packages/backend && bun dev

# 4. Start Frontend
cd apps/web && bun dev

# Access:
# - Frontend: http://localhost:3001
# - Neo4j Browser: http://localhost:7474
# - KG Service: http://localhost:4000
```

---

## Important Disclaimer

> ⚠️ **Medical Disclaimer**: This system is for informational purposes only and should not be used for direct diagnostic use or medical decision-making. The Monarch Initiative data is experimental and academic in nature. Always consult a qualified healthcare professional for medical advice.

---

## Resources

- [Monarch Initiative](https://monarchinitiative.org/)
- [Human Phenotype Ontology](https://hpo.jax.org/)
- [Mondo Disease Ontology](https://mondo.monarchinitiative.org/)
- [Uberon Anatomy Ontology](http://uberon.org/)
- [Biolink Model](https://biolink.github.io/biolink-model/)
- [Neo4j Documentation](https://neo4j.com/docs/)
- [KGX Documentation](https://kgx.readthedocs.io/)
