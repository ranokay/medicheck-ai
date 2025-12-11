# KG Decision Flow Service

A knowledge graph-based symptom checker using **pure mathematical diagnosis** - no LLM decision-making.

## Architecture

Based on the Monarch Knowledge Graph traversal approach:

```
Body Part (UBERON) → Symptoms (HPO) → Refinement (HPO Hierarchy) → Diagnosis (Jaccard Similarity)
```

### Key Principles

1. **LLM is NOT used for diagnosis** - All results are based on graph mathematics
2. **Jaccard Similarity** for disease matching - intersection of user symptoms with disease phenotypes
3. **HPO Hierarchy** for symptom refinement - parent → child relationships
4. **LLM Translation Layer** (optional) - Only for converting medical terms to user-friendly language

## Endpoints

### Step A: Body Part Selection

```bash
# Get common body parts (default list)
GET /body-parts/common

# Search body parts by name
POST /body-parts/search
{ "query": "heart", "limit": 20 }
```

### Step B: Get Symptoms for Body Parts (Dynamic Semantic Search)

Uses **Monarch API semantic search** to find HPO phenotypes related to body parts:

```bash
# By body part names (recommended)
POST /symptoms-for-body-parts
{ "bodyPartNames": ["heart", "chest"], "limit": 15 }

# By UBERON IDs (uses static fallback)
POST /symptoms-for-body-parts
{ "bodyPartIds": ["UBERON:0000948", "UBERON:0000310"] }
```

**How it works:**

1. Body part name is mapped to symptom-related search keywords
2. Monarch API `/search?category=biolink:PhenotypicFeature` returns HPO terms
3. Falls back to static mappings if search returns few results

### Direct Phenotype Search

```bash
# Search phenotypes by keyword (for autocomplete)
GET /search-phenotypes?q=chest+pain&limit=20
```

### Step C: Symptom Refinement (HPO Hierarchy)

```bash
POST /refine-symptom
{ "symptomId": "HP:0002027" }  # Abdominal pain → Burning, Cramping, Sharp
```

### Step D: Diagnosis (Jaccard Similarity)

```bash
POST /diagnose
{
  "bodyParts": [
    { "id": "UBERON:0000948", "name": "Heart", "uberonId": "UBERON:0000948" }
  ],
  "symptoms": [
    { "id": "HP:0100749", "name": "Chest pain", "hpoId": "HP:0100749" },
    { "id": "HP:0002094", "name": "Dyspnea", "hpoId": "HP:0002094" }
  ],
  "severity": 7,
  "patientInfo": {
    "ageCategory": "adult",
    "biologicalSex": "male"
  }
}
```

### LLM Translation Layer (Optional)

Only for translating medical terms to user-friendly language:

```bash
# Translate single term
POST /translate-term
{ "term": "Pruritus of the lacrimal caruncle", "targetLanguage": "en" }
# Returns: "Itchy inner corner of eye"

# Batch translate
POST /translate-terms
{ "terms": ["Dyspnea", "Angina pectoris"], "targetLanguage": "en" }
```

## Algorithm

### Disease Matching (Jaccard Similarity)

```
1. User Vector = Set of selected HPO IDs
2. Disease Vector = Set of HPO IDs each disease has (from Monarch KG)
3. Score = |intersection| / |total_user_symptoms|
4. Rank diseases by score
```

Uses Monarch's Semantic Similarity API (`/semsim/search`) for efficient graph-based matching.

### Demographic Weighting

Scores are adjusted based on patient demographics:

- Pediatric conditions weighted higher for children
- Age-related conditions weighted higher for seniors
- Sex-specific conditions weighted for relevant sex

## Environment Variables

```bash
MONARCH_API_BASE=https://api.monarchinitiative.org/v3/api
PORT=4000

# Optional: LLM Translation Layer
LLM_API_KEY=your-api-key
LLM_API_URL=https://api.openai.com/v1/chat/completions
```

## Running

```bash
# Development
bun run dev

# Production
bun run build && bun run start
```

## Data Sources

- **UBERON**: Anatomical entities (body parts)
- **HPO**: Human Phenotype Ontology (symptoms/phenotypes)
- **MONDO**: Mondo Disease Ontology (diseases)
- **Monarch Initiative**: Graph relationships and semantic similarity
