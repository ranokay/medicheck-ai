# MediCheck AI - Setup Guide

## Architecture Overview

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Frontend (React)  │────▶│   Convex Backend    │────▶│   KG Service        │
│   TanStack Router   │     │   Actions/Mutations │     │   Express + Neo4j   │
│   Romanian UI       │     │   OpenAI LLM        │     │   Monarch KG        │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

## Prerequisites

- Docker Desktop (for local Monarch Neo4j - optional)
- Node.js 18+ or Bun
- OpenAI API Key

## Quick Start

### 1. Install Dependencies

```bash
cd medicheck-ai
bun install
```

### 2. Start the KG Service

The KG service connects to the Monarch Knowledge Graph (Neo4j).

**Option A: Use Monarch's public instance (easiest)**

```bash
# In a new terminal
cd packages/kg-service
bun install
bun run dev
```

The service will connect to `bolt://neo4j.monarchinitiative.org:7687` by default.

**Option B: Run local Monarch Neo4j (recommended for production)**

```bash
# Clone Monarch Neo4j
git clone https://github.com/monarch-initiative/monarch-neo4j.git
cd monarch-neo4j

# Download the dump file (see their README for URL)
# Set environment and start
export DO_LOAD=1
docker compose up

# Then start KG service with local connection
cd ../medicheck-ai/packages/kg-service
NEO4J_URI=bolt://localhost:7687 \
NEO4J_USER=neo4j \
NEO4J_PASSWORD=password \
bun run dev
```

### 3. Configure Convex

Set the required environment variables in Convex:

```bash
# Navigate to backend
cd packages/backend

# Set environment variables
npx convex env set OPENAI_API_KEY your_openai_key_here
npx convex env set KG_SERVICE_URL http://localhost:4000
```

### 4. Start Development Servers

```bash
# Terminal 1: Convex backend
bun run dev:server

# Terminal 2: Web frontend
bun run dev:web

# Terminal 3: KG Service (if not already running)
bun run dev:kg
```

## Environment Variables

### Convex Backend (set via `npx convex env set`)

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 | Yes |
| `KG_SERVICE_URL` | URL to KG service | Yes (default: <http://localhost:4000>) |

### KG Service (set via shell environment)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEO4J_URI` | Neo4j Bolt URI | bolt://neo4j.monarchinitiative.org:7687 |
| `NEO4J_USER` | Neo4j username | neo4j |
| `NEO4J_PASSWORD` | Neo4j password | (empty for public instance) |
| `PORT` | Service port | 4000 |

## How It Works

### 1. Symptom Entry (Romanian)

Nurse enters patient symptoms in Romanian:

- Chief complaint: "Durere de cap și amețeală"
- Additional symptoms: "Febră, oboseală, tuse"

### 2. LLM Normalization (Romanian → English)

OpenAI GPT extracts and normalizes symptoms:

```json
{
  "symptomsEn": ["headache", "dizziness", "fever", "fatigue", "cough"],
  "chiefComplaintEn": "headache and dizziness"
}
```

### 3. Knowledge Graph Query

KG Service queries Monarch Neo4j for diseases matching symptoms:

```cypher
MATCH (d:Disease)-[:has_phenotype]->(p:Phenotype)
WHERE toLower(p.name) IN $symptoms
RETURN d.name, count(p) AS matched
ORDER BY matched DESC
```

### 4. Follow-up Questions

If multiple diseases match, LLM generates differentiating questions:

- "Pacientul are dureri musculare?" (Does patient have muscle pain?)
- "A avut contact cu persoane bolnave recent?" (Recent contact with sick people?)

### 5. Final Diagnosis

Based on KG matches and Q&A, LLM provides ranked diagnoses:

```json
{
  "diagnoses": [
    {
      "conditionNameEn": "Influenza",
      "conditionNameRo": "Gripă",
      "probability": 0.78,
      "severity": "medium"
    }
  ]
}
```

## Key Files

- `packages/kg-service/src/index.ts` - Neo4j KG query service
- `packages/backend/convex/ai.ts` - AI orchestration actions
- `packages/backend/convex/prompts.ts` - LLM prompts
- `apps/web/src/components/ai-symptom-checker.tsx` - AI UI component

## Testing the KG Service

```bash
# Health check
curl http://localhost:4000/health

# Query candidate diseases
curl -X POST http://localhost:4000/candidate-diseases \
  -H "Content-Type: application/json" \
  -d '{"phenotypes": ["fever", "cough", "headache"]}'

# Search phenotypes
curl -X POST http://localhost:4000/search-phenotypes \
  -H "Content-Type: application/json" \
  -d '{"query": "fever"}'
```

## Important Notes

1. **KG-Only Responses**: The AI is instructed to ONLY use diseases found in the Monarch KG. It won't invent diagnoses from general knowledge.

2. **Language Handling**:
   - User interface: Romanian
   - Knowledge Graph: English
   - LLM handles translation internally

3. **Confidence Levels**: Diagnoses include confidence scores based on how many symptoms match the disease's phenotypes in the KG.

4. **Production Considerations**:
   - Run your own Monarch Neo4j instance for reliability
   - Consider adding Pinecone for better symptom→phenotype mapping
   - Add rate limiting to the KG service
