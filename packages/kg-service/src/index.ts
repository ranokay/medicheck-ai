/**
 * Knowledge Graph Decision Flow Service
 *
 * Architecture based on Monarch KG traversal:
 * 1. Body Part Selection (UBERON) → Get symptoms for body parts
 * 2. Symptom Refinement (HPO hierarchy) → Get child phenotypes for refinement
 * 3. Diagnosis (Jaccard Similarity) → Mathematical disease matching
 * 4. LLM Translation Layer → Convert medical terms to user-friendly language (optional)
 *
 * The LLM NEVER makes diagnostic decisions - all results are based on graph mathematics.
 */

import cors from "cors";
import express from "express";

const app = express();
app.use(cors());
app.use(express.json());

// ============ Configuration ============

const MONARCH_API_BASE =
	process.env.MONARCH_API_BASE || "https://api.monarchinitiative.org/v3/api";
const PORT = process.env.PORT || 4000;

// Optional LLM configuration for translation layer only
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_API_URL = process.env.LLM_API_URL;

// ============ Type Definitions ============

interface BodyPart {
	id: string; // UBERON ID
	name: string;
	description?: string;
	parentSystem?: string;
}

interface Phenotype {
	id: string; // HP ID
	name: string;
	description?: string;
	userFriendlyName?: string; // LLM-translated name
	frequency?: number;
}

interface RefinementOption {
	id: string;
	name: string;
	userFriendlyName?: string;
	parentId: string;
}

interface DiagnosisResult {
	id: string; // MONDO ID
	name: string;
	description?: string;
	matchScore: number; // Jaccard similarity score
	matchedPhenotypes: string[];
	totalPhenotypes: number;
	userFriendlyName?: string;
}

interface DiagnoseRequest {
	bodyParts: Array<{ id: string; name: string; uberonId: string }>;
	symptoms: Array<{ id: string; name: string; hpoId: string }>;
	refinements?: Array<{ id: string; name: string; hpoId: string }>;
	severity: number;
	patientInfo: {
		ageCategory: string;
		biologicalSex: string;
	};
}

// ============ Static Data: Body Part → Phenotype Mappings ============

// These mappings are based on UBERON → HPO relationships in Monarch KG
// In production, these would be queried from the graph
const BODY_PART_PHENOTYPES: Record<string, Phenotype[]> = {
	// Heart (UBERON:0000948)
	"UBERON:0000948": [
		{ id: "HP:0001635", name: "Congestive heart failure" },
		{ id: "HP:0001962", name: "Palpitations" },
		{ id: "HP:0001681", name: "Angina pectoris" },
		{ id: "HP:0011675", name: "Arrhythmia" },
		{ id: "HP:0001649", name: "Tachycardia" },
		{ id: "HP:0100749", name: "Chest pain" },
		{ id: "HP:0002094", name: "Dyspnea" },
	],
	// Chest (UBERON:0000310)
	"UBERON:0000310": [
		{ id: "HP:0100749", name: "Chest pain" },
		{ id: "HP:0002098", name: "Respiratory distress" },
		{ id: "HP:0002094", name: "Dyspnea" },
		{ id: "HP:0002792", name: "Chest tightness" },
		{ id: "HP:0030828", name: "Wheezing" },
		{ id: "HP:0012735", name: "Cough" },
	],
	// Lung (UBERON:0002048)
	"UBERON:0002048": [
		{ id: "HP:0002094", name: "Dyspnea" },
		{ id: "HP:0002098", name: "Respiratory distress" },
		{ id: "HP:0030828", name: "Wheezing" },
		{ id: "HP:0012735", name: "Cough" },
		{ id: "HP:0002093", name: "Respiratory insufficiency" },
		{ id: "HP:0002105", name: "Hemoptysis" },
	],
	// Head (UBERON:0000033)
	"UBERON:0000033": [
		{ id: "HP:0002315", name: "Headache" },
		{ id: "HP:0002321", name: "Vertigo" },
		{ id: "HP:0001289", name: "Confusion" },
		{ id: "HP:0000651", name: "Diplopia" },
		{ id: "HP:0002018", name: "Nausea" },
	],
	// Stomach (UBERON:0000945)
	"UBERON:0000945": [
		{ id: "HP:0002018", name: "Nausea" },
		{ id: "HP:0002013", name: "Vomiting" },
		{ id: "HP:0002027", name: "Abdominal pain" },
		{ id: "HP:0002020", name: "Gastroesophageal reflux" },
		{ id: "HP:0001824", name: "Weight loss" },
	],
	// Abdomen (UBERON:0000002)
	"UBERON:0000002": [
		{ id: "HP:0002027", name: "Abdominal pain" },
		{ id: "HP:0002014", name: "Diarrhea" },
		{ id: "HP:0002019", name: "Constipation" },
		{ id: "HP:0002017", name: "Nausea and vomiting" },
		{ id: "HP:0003270", name: "Abdominal distension" },
		{ id: "HP:0002018", name: "Nausea" },
	],
	// Eye (UBERON:0000970)
	"UBERON:0000970": [
		{ id: "HP:0000613", name: "Photophobia" },
		{ id: "HP:0000622", name: "Blurred vision" },
		{ id: "HP:0000639", name: "Nystagmus" },
		{ id: "HP:0100533", name: "Eye pain" },
		{ id: "HP:0000608", name: "Macular degeneration" },
	],
	// Skin (UBERON:0002097)
	"UBERON:0002097": [
		{ id: "HP:0000989", name: "Pruritus" },
		{ id: "HP:0000988", name: "Skin rash" },
		{ id: "HP:0025131", name: "Erythema" },
		{ id: "HP:0011123", name: "Dermatitis" },
		{ id: "HP:0001030", name: "Fragile skin" },
	],
	// Muscle (UBERON:0001630)
	"UBERON:0001630": [
		{ id: "HP:0003326", name: "Myalgia" },
		{ id: "HP:0001324", name: "Muscle weakness" },
		{ id: "HP:0003394", name: "Muscle cramps" },
		{ id: "HP:0003457", name: "EMG abnormality" },
	],
	// Spine (UBERON:0001137)
	"UBERON:0001137": [
		{ id: "HP:0003418", name: "Back pain" },
		{ id: "HP:0002808", name: "Kyphosis" },
		{ id: "HP:0002650", name: "Scoliosis" },
		{ id: "HP:0003306", name: "Spinal rigidity" },
	],
	// Kidney (UBERON:0002113)
	"UBERON:0002113": [
		{ id: "HP:0000083", name: "Renal insufficiency" },
		{ id: "HP:0000093", name: "Proteinuria" },
		{ id: "HP:0000790", name: "Hematuria" },
		{ id: "HP:0012622", name: "Chronic kidney disease" },
	],
};

// ============ Common Body Parts List ============

const COMMON_BODY_PARTS: BodyPart[] = [
	{ id: "UBERON:0000033", name: "Head", parentSystem: "head_neck" },
	{ id: "UBERON:0000955", name: "Brain", parentSystem: "head_neck" },
	{ id: "UBERON:0000970", name: "Eye", parentSystem: "head_neck" },
	{ id: "UBERON:0001690", name: "Ear", parentSystem: "head_neck" },
	{ id: "UBERON:0000948", name: "Heart", parentSystem: "cardiovascular" },
	{ id: "UBERON:0002048", name: "Lung", parentSystem: "respiratory" },
	{ id: "UBERON:0000310", name: "Chest", parentSystem: "thorax" },
	{ id: "UBERON:0000945", name: "Stomach", parentSystem: "gastrointestinal" },
	{ id: "UBERON:0000002", name: "Abdomen", parentSystem: "gastrointestinal" },
	{ id: "UBERON:0002107", name: "Liver", parentSystem: "gastrointestinal" },
	{ id: "UBERON:0002113", name: "Kidney", parentSystem: "urinary" },
	{ id: "UBERON:0001630", name: "Muscle", parentSystem: "musculoskeletal" },
	{ id: "UBERON:0001137", name: "Spine", parentSystem: "musculoskeletal" },
	{ id: "UBERON:0002097", name: "Skin", parentSystem: "integumentary" },
];

// ============ Step A: Body Part Selection ============

/**
 * GET /body-parts/common
 * Returns curated list of common body parts for default UI display
 */
app.get("/body-parts/common", (_req, res) => {
	res.json({ bodyParts: COMMON_BODY_PARTS });
});

/**
 * POST /body-parts/search
 * Live search for body parts by name using Monarch API
 */
app.post("/body-parts/search", async (req, res) => {
	const { query, limit = 20 } = req.body;

	if (!query) {
		return res.status(400).json({ error: "query is required" });
	}

	try {
		const params = new URLSearchParams({
			q: query,
			category: "biolink:AnatomicalEntity",
			limit: String(limit),
		});

		const response = await fetch(`${MONARCH_API_BASE}/search?${params}`);
		const data = (await response.json()) as {
			items: Array<{ id: string; name: string; description?: string }>;
		};

		const bodyParts: BodyPart[] = (data.items || []).map((item) => ({
			id: item.id,
			name: item.name,
			description: item.description,
		}));

		res.json({ bodyParts });
	} catch (error) {
		console.error("Body parts search failed:", error);
		res.status(500).json({ error: "Search failed", details: String(error) });
	}
});

// ============ Step B: Get Symptoms for Body Parts ============

/**
 * POST /symptoms-for-body-parts
 * Dynamic symptom discovery using Monarch semantic search
 *
 * Strategy:
 * 1. Use body part name to search for related HPO phenotypes
 * 2. Filter to only HP: namespace (Human Phenotype Ontology)
 * 3. Fall back to static mappings if search fails or returns few results
 */
app.post("/symptoms-for-body-parts", async (req, res) => {
	const { bodyPartIds, bodyPartNames, limit = 30 } = req.body;

	if (
		(!bodyPartIds || bodyPartIds.length === 0) &&
		(!bodyPartNames || bodyPartNames.length === 0)
	) {
		return res.status(400).json({
			error: "bodyPartIds or bodyPartNames array is required",
		});
	}

	const phenotypesMap = new Map<string, Phenotype>();

	// Get body part names for search (from provided names or lookup by ID)
	const searchTerms: string[] = bodyPartNames || [];

	// If only IDs provided, resolve names from common body parts
	if (bodyPartIds && searchTerms.length === 0) {
		for (const id of bodyPartIds) {
			const part = COMMON_BODY_PARTS.find((p) => p.id === id);
			if (part) {
				searchTerms.push(part.name);
			}
		}
	}

	// Dynamic search: Query Monarch API for phenotypes related to each body part
	for (const term of searchTerms) {
		try {
			const phenotypes = await searchPhenotypesForBodyPart(term, 15);
			for (const p of phenotypes) {
				if (!phenotypesMap.has(p.id)) {
					phenotypesMap.set(p.id, p);
				}
			}
		} catch (error) {
			console.error(`Search failed for "${term}":`, error);
		}
	}

	// Fallback: Add static mappings if dynamic search returned few results
	if (phenotypesMap.size < 5 && bodyPartIds) {
		for (const bodyPartId of bodyPartIds) {
			const staticPhenotypes = BODY_PART_PHENOTYPES[bodyPartId] || [];
			for (const p of staticPhenotypes) {
				if (!phenotypesMap.has(p.id)) {
					phenotypesMap.set(p.id, p);
				}
			}
		}
	}

	const phenotypes = Array.from(phenotypesMap.values()).slice(0, limit);
	res.json({
		phenotypes,
		count: phenotypes.length,
		source: phenotypesMap.size >= 5 ? "monarch_search" : "static_fallback",
	});
});

/**
 * Search Monarch API for phenotypes related to a body part name
 * Uses semantic search with category filter for PhenotypicFeature
 */
async function searchPhenotypesForBodyPart(
	bodyPartName: string,
	limit: number,
): Promise<Phenotype[]> {
	// Body part to symptom search terms mapping
	// These are symptom-related keywords that return good HP: results
	const bodyPartSymptomKeywords: Record<string, string[]> = {
		heart: ["chest pain", "cardiac", "palpitations", "heart failure"],
		chest: ["chest pain", "dyspnea", "breathing", "thoracic"],
		head: ["headache", "migraine", "cephalgia", "dizziness"],
		brain: ["cognitive", "seizure", "encephalopathy", "memory"],
		abdomen: ["abdominal pain", "nausea", "vomiting", "digestive"],
		stomach: ["gastric", "stomach pain", "dyspepsia", "reflux"],
		lung: ["respiratory", "cough", "dyspnea", "pulmonary"],
		back: ["back pain", "spinal", "lumbar", "vertebral"],
		knee: ["knee pain", "joint", "arthralgia", "swelling"],
		ankle: ["ankle pain", "foot", "swelling", "mobility"],
		shoulder: ["shoulder pain", "arm", "range of motion"],
		neck: ["neck pain", "cervical", "stiffness"],
		eye: ["vision", "ocular", "eye pain", "blindness"],
		ear: ["hearing", "ear pain", "tinnitus", "vertigo"],
		throat: ["sore throat", "dysphagia", "pharyngeal"],
		skin: ["rash", "pruritus", "skin lesion", "dermal"],
		liver: ["hepatic", "liver failure", "jaundice"],
		kidney: ["renal", "urinary", "proteinuria"],
		bladder: ["urinary", "incontinence", "dysuria"],
		muscle: ["myalgia", "muscle weakness", "cramping"],
		bone: ["bone pain", "fracture", "osteo"],
	};

	// Normalize body part name (lowercase, handle common variations)
	const normalizedName = bodyPartName.toLowerCase().trim();

	// Get search keywords for this body part, or generate defaults
	const keywords = bodyPartSymptomKeywords[normalizedName] || [
		`${bodyPartName} pain`,
		`${bodyPartName} abnormal`,
		bodyPartName,
	];

	const allPhenotypes: Phenotype[] = [];
	const seenIds = new Set<string>();

	for (const query of keywords) {
		try {
			const params = new URLSearchParams({
				q: query,
				category: "biolink:PhenotypicFeature",
				limit: String(Math.ceil(limit / keywords.length) + 5),
			});

			const response = await fetch(`${MONARCH_API_BASE}/search?${params}`);

			if (!response.ok) continue;

			const data = (await response.json()) as {
				items: Array<{
					id: string;
					name: string;
					description?: string;
				}>;
			};

			for (const item of data.items || []) {
				// Only include HPO terms (HP: namespace) for human phenotypes
				if (item.id.startsWith("HP:") && !seenIds.has(item.id)) {
					seenIds.add(item.id);
					allPhenotypes.push({
						id: item.id,
						name: item.name,
						description: item.description,
					});
				}
			}
		} catch (error) {
			console.error(`Phenotype search failed for "${query}":`, error);
		}
	}

	return allPhenotypes.slice(0, limit);
}

// ============ Step B2: Search Phenotypes (Direct Semantic Search) ============

/**
 * GET /search-phenotypes
 * Direct semantic search for phenotypes using Monarch API
 * Useful for autocomplete or symptom search by keyword
 */
app.get("/search-phenotypes", async (req, res) => {
	const { q, limit = "20" } = req.query;

	if (!q || typeof q !== "string") {
		return res.status(400).json({ error: "Query parameter 'q' is required" });
	}

	try {
		const params = new URLSearchParams({
			q: q,
			category: "biolink:PhenotypicFeature",
			limit: String(limit),
		});

		const response = await fetch(`${MONARCH_API_BASE}/search?${params}`);

		if (!response.ok) {
			throw new Error(`Monarch API returned ${response.status}`);
		}

		const data = (await response.json()) as {
			items: Array<{
				id: string;
				name: string;
				description?: string;
			}>;
			total: number;
		};

		// Filter to HPO terms only
		const phenotypes = (data.items || [])
			.filter((item) => item.id.startsWith("HP:"))
			.map((item) => ({
				id: item.id,
				name: item.name,
				description: item.description,
			}));

		res.json({
			phenotypes,
			count: phenotypes.length,
			total: data.total,
			query: q,
		});
	} catch (error) {
		console.error("Phenotype search error:", error);
		res.status(500).json({ error: "Failed to search phenotypes" });
	}
});

// ============ Static Symptom Refinements (HPO Hierarchy) ============

// These represent HPO child terms for common symptoms
// In a full implementation, these would be queried from Neo4j or an HPO database
const SYMPTOM_REFINEMENTS: Record<string, RefinementOption[]> = {
	// Abdominal pain refinements
	"HP:0002027": [
		{ id: "HP:0002574", name: "Epigastric pain", parentId: "HP:0002027" },
		{ id: "HP:0100851", name: "Abnormal appetite", parentId: "HP:0002027" },
		{
			id: "HP:0025278",
			name: "Burning abdominal pain",
			parentId: "HP:0002027",
		},
		{ id: "HP:0025279", name: "Sharp abdominal pain", parentId: "HP:0002027" },
		{
			id: "HP:0003394",
			name: "Cramping abdominal pain",
			parentId: "HP:0002027",
		},
	],
	// Chest pain refinements
	"HP:0100749": [
		{ id: "HP:0001681", name: "Angina pectoris", parentId: "HP:0100749" },
		{ id: "HP:0025279", name: "Sharp chest pain", parentId: "HP:0100749" },
		{ id: "HP:0025278", name: "Burning chest pain", parentId: "HP:0100749" },
		{ id: "HP:0002792", name: "Chest tightness", parentId: "HP:0100749" },
	],
	// Headache refinements
	"HP:0002315": [
		{ id: "HP:0002083", name: "Migraine", parentId: "HP:0002315" },
		{ id: "HP:0011498", name: "Tension-type headache", parentId: "HP:0002315" },
		{ id: "HP:0012785", name: "Flexion contracture", parentId: "HP:0002315" },
	],
	// Dyspnea (shortness of breath) refinements
	"HP:0002094": [
		{ id: "HP:0002098", name: "Respiratory distress", parentId: "HP:0002094" },
		{ id: "HP:0002104", name: "Apnea", parentId: "HP:0002094" },
		{ id: "HP:0030828", name: "Wheezing", parentId: "HP:0002094" },
	],
	// Back pain refinements
	"HP:0003418": [
		{
			id: "HP:0003376",
			name: "Decreased mobility of the lower back",
			parentId: "HP:0003418",
		},
		{ id: "HP:0008438", name: "Lumbar pain", parentId: "HP:0003418" },
	],
};

// ============ Step C: Symptom Refinement (HPO Hierarchy) ============

/**
 * POST /refine-symptom
 * Graph Traversal: Get child phenotypes to refine a symptom
 * Query: MATCH (child:Phenotype)-[:is_a]->(parent:Phenotype {id: $symptomId})
 *
 * Example: "Abdominal Pain" → "Burning", "Cramping", "Sharp"
 */
app.post("/refine-symptom", (_req, res) => {
	const { symptomId } = _req.body;

	if (!symptomId) {
		return res.status(400).json({ error: "symptomId is required" });
	}

	// Use static refinements based on HPO hierarchy
	// In production, this would query Neo4j or the HPO database
	const refinements = SYMPTOM_REFINEMENTS[symptomId] || [];

	if (refinements.length > 0) {
		res.json({ refinements, source: "hpo_hierarchy" });
	} else {
		res.json({
			refinements: [],
			message: "No refinements available for this symptom",
		});
	}
});

// ============ Step D: Diagnosis (Jaccard Similarity) ============

/**
 * POST /diagnose
 * Mathematical diagnosis using Jaccard Similarity / Set Theory
 *
 * Algorithm:
 * 1. User Vector = Set of selected HPO IDs
 * 2. Disease Vector = Set of HPO IDs each disease has
 * 3. Score = |intersection| / |user_set| (how many user symptoms match)
 *
 * The LLM is NOT used for decision-making. Results are purely mathematical.
 */
app.post("/diagnose", async (req, res) => {
	const { bodyParts, symptoms, refinements, severity, patientInfo } =
		req.body as DiagnoseRequest;

	// Collect all HPO IDs from the user's selections
	const userHpoIds = new Set<string>();

	// Add symptoms from body part associations
	if (bodyParts) {
		for (const bp of bodyParts) {
			const phenotypes = BODY_PART_PHENOTYPES[bp.uberonId] || [];
			// Add first 2 phenotypes as implicit symptoms for context
			for (const p of phenotypes.slice(0, 2)) {
				userHpoIds.add(p.id);
			}
		}
	}

	// Add explicitly selected symptoms
	if (symptoms) {
		for (const s of symptoms) {
			if (s.hpoId) userHpoIds.add(s.hpoId);
		}
	}

	// Add refinements (more specific symptoms)
	if (refinements) {
		for (const r of refinements) {
			if (r.hpoId) userHpoIds.add(r.hpoId);
		}
	}

	if (userHpoIds.size === 0) {
		return res.status(400).json({
			error: "No symptoms selected. Please select body parts and symptoms.",
		});
	}

	const hpoIdArray = Array.from(userHpoIds);
	console.log(`[Diagnose] User HPO IDs: ${hpoIdArray.join(", ")}`);

	try {
		// Use Monarch Semantic Similarity API for disease matching
		const diseases = await findDiseasesByJaccardSimilarity(hpoIdArray);

		// Apply demographic weighting (age/sex adjustments)
		const weightedDiseases = applyDemographicWeighting(
			diseases,
			patientInfo?.ageCategory,
			patientInfo?.biologicalSex,
		);

		// Determine urgency based on matched conditions
		const urgencyLevel = determineUrgencyLevel(weightedDiseases, severity);

		// Generate evidence-based recommendations
		const recommendations = generateRecommendations({
			diseases: weightedDiseases,
			urgency: urgencyLevel,
		});

		// Suggest relevant clinical tests
		const additionalTests = suggestAdditionalTests(weightedDiseases);

		// Format response for frontend
		const diagnoses = weightedDiseases.slice(0, 10).map((d, index) => ({
			id: d.id,
			name: d.name,
			mondoId: d.id,
			description: d.description,
			probability: calculateProbability(d.matchScore, index),
			matchedSymptoms: d.matchedPhenotypes,
			confidence: d.matchScore,
		}));

		res.json({
			diagnoses,
			urgencyLevel,
			recommendations,
			additionalTests,
			context: {
				userSymptomCount: hpoIdArray.length,
				hpoIds: hpoIdArray,
				method: "jaccard_similarity",
			},
		});
	} catch (error) {
		console.error("Diagnosis failed:", error);
		res.status(500).json({ error: "Diagnosis failed", details: String(error) });
	}
});

// ============ Core Algorithm: Jaccard Similarity Disease Matching ============

/**
 * Find diseases by calculating Jaccard similarity with user symptoms
 * Uses Monarch's semantic similarity endpoint
 */
async function findDiseasesByJaccardSimilarity(
	hpoIds: string[],
): Promise<DiagnosisResult[]> {
	try {
		// Use Monarch v3 semsim search endpoint
		// Format: /semsim/search/{termset}/{group}
		const termset = hpoIds.join(",");
		const group = "Human Diseases";
		const url = `${MONARCH_API_BASE}/semsim/search/${encodeURIComponent(termset)}/${encodeURIComponent(group)}?limit=25`;

		console.log(`[SemSim] Querying with ${hpoIds.length} HPO terms`);

		const response = await fetch(url);

		if (!response.ok) {
			console.error("SemSim search failed:", response.status);
			return [];
		}

		const data = (await response.json()) as Array<{
			subject: {
				id: string;
				name: string;
				category: string;
				description?: string;
			};
			score: number;
		}>;

		console.log(`[SemSim] Returned ${data.length} disease matches`);

		return data
			.filter((item) => item.subject.category === "biolink:Disease")
			.map((item) => ({
				id: item.subject.id,
				name: item.subject.name,
				description: item.subject.description,
				matchScore: item.score,
				matchedPhenotypes: hpoIds, // All user symptoms contributed to match
				totalPhenotypes: hpoIds.length,
			}));
	} catch (error) {
		console.error("Jaccard similarity search failed:", error);
		return [];
	}
}

// ============ Helper Functions ============

/**
 * Convert match score to probability range [0.1, 0.95]
 * Uses both score and rank for differentiation
 */
function calculateProbability(matchScore: number, rank: number): number {
	const rankDecay = 0.95 ** rank;
	const probability = matchScore * rankDecay * 0.85 + 0.1;
	return Math.round(Math.min(0.95, Math.max(0.1, probability)) * 100) / 100;
}

/**
 * Apply demographic weighting to disease scores
 * Pediatric conditions weighted higher for children, etc.
 */
function applyDemographicWeighting(
	diseases: DiagnosisResult[],
	ageCategory?: string,
	biologicalSex?: string,
): DiagnosisResult[] {
	return diseases
		.map((disease) => {
			let adjustedScore = disease.matchScore;
			const nameLower = disease.name.toLowerCase();

			// Age-based adjustments
			if (ageCategory === "infant" || ageCategory === "child") {
				if (
					nameLower.includes("pediatric") ||
					nameLower.includes("childhood") ||
					nameLower.includes("congenital") ||
					nameLower.includes("infantile")
				) {
					adjustedScore *= 1.2;
				}
			}

			if (ageCategory === "senior") {
				if (
					nameLower.includes("adult-onset") ||
					nameLower.includes("age-related") ||
					nameLower.includes("senile")
				) {
					adjustedScore *= 1.15;
				}
			}

			// Sex-based adjustments (for sex-specific conditions)
			if (biologicalSex === "female") {
				if (
					nameLower.includes("ovarian") ||
					nameLower.includes("uterine") ||
					nameLower.includes("pregnancy")
				) {
					adjustedScore *= 1.1;
				}
			}

			if (biologicalSex === "male") {
				if (
					nameLower.includes("prostate") ||
					nameLower.includes("testicular")
				) {
					adjustedScore *= 1.1;
				}
			}

			return { ...disease, matchScore: Math.min(adjustedScore, 1.0) };
		})
		.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Determine clinical urgency based on matched conditions
 */
function determineUrgencyLevel(
	diseases: DiagnosisResult[],
	severity?: number,
): "low" | "medium" | "high" | "emergency" {
	const emergencyKeywords = [
		"myocardial infarction",
		"heart attack",
		"stroke",
		"pulmonary embolism",
		"anaphylaxis",
		"meningitis",
		"sepsis",
		"aortic dissection",
	];

	const highPriorityKeywords = [
		"angina",
		"pneumonia",
		"appendicitis",
		"pancreatitis",
		"deep vein thrombosis",
		"heart failure",
		"acute",
	];

	const topNames = diseases.slice(0, 5).map((d) => d.name.toLowerCase());

	for (const keyword of emergencyKeywords) {
		if (topNames.some((name) => name.includes(keyword))) {
			return "emergency";
		}
	}

	for (const keyword of highPriorityKeywords) {
		if (topNames.some((name) => name.includes(keyword))) {
			return "high";
		}
	}

	if (severity !== undefined && severity >= 8) return "high";
	if (severity !== undefined && severity >= 6) return "medium";

	return "low";
}

/**
 * Generate clinical recommendations based on urgency
 */
function generateRecommendations({
	diseases,
	urgency,
}: {
	diseases: DiagnosisResult[];
	urgency: "low" | "medium" | "high" | "emergency";
}): string[] {
	const recommendations: string[] = [];

	switch (urgency) {
		case "emergency":
			recommendations.push("Seek immediate medical attention");
			recommendations.push("Call emergency services if symptoms worsen");
			recommendations.push("Do not delay - time is critical");
			break;
		case "high":
			recommendations.push("Schedule an urgent appointment today");
			recommendations.push("Monitor symptoms closely");
			recommendations.push("Go to emergency if rapidly worsening");
			break;
		case "medium":
			recommendations.push("Schedule an appointment within 1-2 days");
			recommendations.push("Track symptom changes");
			recommendations.push("Rest and stay hydrated");
			break;
		case "low":
			recommendations.push("Monitor symptoms over the next few days");
			recommendations.push("Schedule routine check-up if persisting");
			recommendations.push("Maintain healthy lifestyle");
			break;
	}

	// Add condition-specific recommendations
	if (diseases.length > 0) {
		const topName = diseases[0].name.toLowerCase();
		if (topName.includes("cardiac") || topName.includes("heart")) {
			recommendations.push("Avoid strenuous physical activity");
		}
		if (topName.includes("respiratory") || topName.includes("lung")) {
			recommendations.push("Avoid smoking and polluted environments");
		}
		if (topName.includes("gastro") || topName.includes("abdominal")) {
			recommendations.push("Follow a bland diet temporarily");
		}
	}

	return recommendations;
}

/**
 * Suggest relevant clinical tests based on top diagnoses
 */
function suggestAdditionalTests(diseases: DiagnosisResult[]): string[] {
	const tests = new Set<string>();

	for (const disease of diseases.slice(0, 3)) {
		const name = disease.name.toLowerCase();

		if (name.includes("cardiac") || name.includes("heart")) {
			tests.add("ECG (Electrocardiogram)");
			tests.add("Cardiac enzymes (Troponin)");
		}

		if (name.includes("pulmonary") || name.includes("lung")) {
			tests.add("Chest X-ray");
			tests.add("Pulse oximetry");
		}

		if (name.includes("gastro") || name.includes("liver")) {
			tests.add("Abdominal ultrasound");
			tests.add("Liver function tests");
		}

		if (name.includes("kidney") || name.includes("renal")) {
			tests.add("Kidney function tests");
			tests.add("Urinalysis");
		}

		if (name.includes("infection") || name.includes("inflammatory")) {
			tests.add("Complete blood count (CBC)");
			tests.add("C-reactive protein (CRP)");
		}
	}

	if (tests.size === 0) {
		tests.add("Complete blood count (CBC)");
		tests.add("Basic metabolic panel");
	}

	return Array.from(tests).slice(0, 6);
}

// ============ LLM Translation Layer (Optional) ============

/**
 * POST /translate-term
 * LLM Translation Layer: Convert medical terms to user-friendly language
 *
 * The LLM is ONLY used for translation, NOT for diagnosis decisions.
 * Example: "Pruritus of the lacrimal caruncle" → "Itchy inner corner of eye"
 */
app.post("/translate-term", async (req, res) => {
	const { term, targetLanguage = "en" } = req.body;

	if (!term) {
		return res.status(400).json({ error: "term is required" });
	}

	// If LLM not configured, return original term
	if (!LLM_API_KEY || !LLM_API_URL) {
		return res.json({
			original: term,
			translated: term,
			message: "LLM not configured, returning original term",
		});
	}

	try {
		// Call LLM API for translation only
		const response = await fetch(LLM_API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${LLM_API_KEY}`,
			},
			body: JSON.stringify({
				messages: [
					{
						role: "system",
						content: `You are a medical term translator. Convert medical terminology into simple, patient-friendly language. Only translate - do not provide medical advice or interpretations. Keep responses to 5 words or less. Language: ${targetLanguage}`,
					},
					{
						role: "user",
						content: `Translate this medical term to simple language: "${term}"`,
					},
				],
				max_tokens: 50,
			}),
		});

		if (!response.ok) {
			throw new Error("LLM API request failed");
		}

		const data = (await response.json()) as {
			choices: Array<{ message: { content: string } }>;
		};
		const translated = data.choices?.[0]?.message?.content?.trim() || term;

		res.json({ original: term, translated });
	} catch (error) {
		console.error("Translation failed:", error);
		res.json({ original: term, translated: term, error: "Translation failed" });
	}
});

/**
 * POST /translate-terms
 * Batch translation of multiple medical terms
 */
app.post("/translate-terms", async (req, res) => {
	const { terms, targetLanguage = "en" } = req.body;

	if (!terms || !Array.isArray(terms)) {
		return res.status(400).json({ error: "terms array is required" });
	}

	// If LLM not configured, return original terms
	if (!LLM_API_KEY || !LLM_API_URL) {
		const results = terms.map((term: string) => ({
			original: term,
			translated: term,
		}));
		return res.json({ translations: results, llmEnabled: false });
	}

	try {
		const response = await fetch(LLM_API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${LLM_API_KEY}`,
			},
			body: JSON.stringify({
				messages: [
					{
						role: "system",
						content: `You are a medical term translator. Convert medical terms to simple patient-friendly language. Return JSON array with same order. Only translate - no medical advice. Language: ${targetLanguage}`,
					},
					{
						role: "user",
						content: `Translate these medical terms: ${JSON.stringify(terms)}`,
					},
				],
				max_tokens: 500,
			}),
		});

		if (!response.ok) {
			throw new Error("LLM API request failed");
		}

		const data = (await response.json()) as {
			choices: Array<{ message: { content: string } }>;
		};

		let translations: string[];
		try {
			translations = JSON.parse(data.choices?.[0]?.message?.content || "[]");
		} catch {
			translations = terms;
		}

		const results = terms.map((term: string, i: number) => ({
			original: term,
			translated: translations[i] || term,
		}));

		res.json({ translations: results, llmEnabled: true });
	} catch (error) {
		console.error("Batch translation failed:", error);
		const results = terms.map((term: string) => ({
			original: term,
			translated: term,
		}));
		res.json({
			translations: results,
			llmEnabled: false,
			error: String(error),
		});
	}
});

// ============ Health Check ============

app.get("/health", async (_req, res) => {
	try {
		// Test Monarch API connectivity
		const response = await fetch(`${MONARCH_API_BASE}/search?q=test&limit=1`);
		if (response.ok) {
			res.json({
				status: "ok",
				monarchApi: "connected",
				llmEnabled: Boolean(LLM_API_KEY && LLM_API_URL),
				architecture: "decision_flow",
			});
		} else {
			res
				.status(500)
				.json({ status: "error", error: "Monarch API unreachable" });
		}
	} catch (error) {
		res.status(500).json({ status: "error", error: String(error) });
	}
});

// ============ Graceful Shutdown ============

process.on("SIGINT", () => {
	console.log("Shutting down...");
	process.exit(0);
});

// ============ Start Server ============

app.listen(PORT, () => {
	console.log("\n🏥 KG Decision Flow Service");
	console.log(`   Port: ${PORT}`);
	console.log(`   Monarch API: ${MONARCH_API_BASE}`);
	console.log(`   LLM Translation: ${LLM_API_KEY ? "Enabled" : "Disabled"}`);
	console.log(
		"\n   Architecture: Body Part → Symptom → Refinement → Diagnosis",
	);
	console.log("   Method: Jaccard Similarity (Pure Math, No LLM Decisions)\n");
});
