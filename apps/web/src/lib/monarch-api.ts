/**
 * Monarch REST API Client
 *
 * TypeScript client for the monarch-mcp FastAPI server.
 * This is the single source of truth for all Monarch API calls.
 *
 * Connects to the Python backend at /packages/monarch-mcp
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API_BASE_URL =
	import.meta.env.VITE_MONARCH_API_URL || "http://localhost:8500";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MonarchEntity {
	id: string;
	name: string;
	category: string;
	description?: string | null;
	synonym?: string[];
	namespace?: string;
	xref?: string[];
	in_taxon?: string;
	in_taxon_label?: string;
	has_phenotype?: string[];
	has_phenotype_label?: string[];
	has_phenotype_count?: number;
	symbol?: string;
	synonyms?: string[];
}

export interface SearchResult {
	limit: number;
	offset: number;
	total: number;
	items: MonarchEntity[];
}

export interface AutocompleteResult {
	limit: number;
	offset: number;
	total: number;
	items: MonarchEntity[];
}

export interface Association {
	id: string;
	subject: string;
	subject_label?: string;
	subject_category?: string;
	predicate: string;
	object: string;
	object_label?: string;
	object_category?: string;
	primary_knowledge_source?: string;
	publications?: string[];
	frequency_qualifier?: string;
	onset_qualifier?: string;
}

export interface AssociationsResult {
	limit: number;
	offset: number;
	total: number;
	items: Association[];
}

export interface SimilarityMatch {
	subject: MonarchEntity;
	score: number;
	similarity?: {
		subject_termset: Record<string, { id: string; label: string }>;
		object_termset: Record<string, { id: string; label: string }>;
		subject_best_matches?: Record<string, unknown>;
		object_best_matches?: Record<string, unknown>;
		average_score?: number;
		best_score?: number;
		ancestor_information_content?: number;
		jaccard_similarity?: number;
		phenodigm_score?: number;
	};
}

export interface HPOChildrenResult {
	parent_id: string;
	parent_name: string;
	children: Association[];
	total: number;
}

export interface ChatMessage {
	role: "user" | "assistant";
	content: string;
}

export interface ChatRequest {
	message: string;
	context?: string;
	phenotypes?: string[];
	diagnosis_results?: Array<{
		id: string;
		name: string;
		confidence: number;
	}>;
	history?: Array<{
		role: "user" | "assistant";
		content: string;
	}>;
}

export interface ChatResponse {
	response: string;
	sources?: string[];
}

// Patient context for post-filtering (not used in similarity search)
export interface PatientContext {
	ageCategory?: "infant" | "child" | "adolescent" | "adult" | "elderly";
	gender?: "male" | "female" | "other";
	heightCm?: number;
	weightKg?: number;
}

// ---------------------------------------------------------------------------
// Body Part Data (Static, for symptom narrowing decision graph)
// ---------------------------------------------------------------------------

export interface BodyPart {
	id: string; // UBERON ID
	name: string;
	nameRo?: string;
	icon?: string;
	parentSystem?: string;
}

// Common body parts for quick selection
export const COMMON_BODY_PARTS: BodyPart[] = [
	{
		id: "UBERON:0000970",
		name: "Eye",
		nameRo: "Ochi",
		icon: "👁️",
		parentSystem: "head_neck",
	},
	{
		id: "UBERON:0001690",
		name: "Ear",
		nameRo: "Ureche",
		icon: "👂",
		parentSystem: "head_neck",
	},
	{
		id: "UBERON:0000004",
		name: "Nose",
		nameRo: "Nas",
		icon: "👃",
		parentSystem: "head_neck",
	},
	{
		id: "UBERON:0000165",
		name: "Mouth",
		nameRo: "Gură",
		icon: "👄",
		parentSystem: "head_neck",
	},
	{
		id: "UBERON:0000033",
		name: "Head",
		nameRo: "Cap",
		icon: "🧠",
		parentSystem: "head_neck",
	},
	{
		id: "UBERON:0001137",
		name: "Neck",
		nameRo: "Gât",
		icon: "🦒",
		parentSystem: "head_neck",
	},
	{
		id: "UBERON:0000948",
		name: "Heart",
		nameRo: "Inimă",
		icon: "❤️",
		parentSystem: "cardiovascular",
	},
	{
		id: "UBERON:0002048",
		name: "Lung",
		nameRo: "Plămân",
		icon: "🫁",
		parentSystem: "respiratory",
	},
	{
		id: "UBERON:0000310",
		name: "Chest",
		nameRo: "Piept",
		icon: "🫀",
		parentSystem: "thorax",
	},
	{
		id: "UBERON:0000945",
		name: "Stomach",
		nameRo: "Stomac",
		icon: "🫃",
		parentSystem: "gastrointestinal",
	},
	{
		id: "UBERON:0000002",
		name: "Abdomen",
		nameRo: "Abdomen",
		icon: "🤰",
		parentSystem: "gastrointestinal",
	},
	{
		id: "UBERON:0002107",
		name: "Liver",
		nameRo: "Ficat",
		icon: "🫀",
		parentSystem: "gastrointestinal",
	},
	{
		id: "UBERON:0002113",
		name: "Kidney",
		nameRo: "Rinichi",
		icon: "🫘",
		parentSystem: "urinary",
	},
	{
		id: "UBERON:0001434",
		name: "Skeletal system",
		nameRo: "Sistem osos",
		icon: "🦴",
		parentSystem: "musculoskeletal",
	},
	{
		id: "UBERON:0001630",
		name: "Muscle",
		nameRo: "Mușchi",
		icon: "💪",
		parentSystem: "musculoskeletal",
	},
	{
		id: "UBERON:0002097",
		name: "Skin",
		nameRo: "Piele",
		icon: "🖐️",
		parentSystem: "integumentary",
	},
	{
		id: "UBERON:0001016",
		name: "Nervous system",
		nameRo: "Sistem nervos",
		icon: "🧠",
		parentSystem: "nervous",
	},
];

// Body part to symptom keyword mappings for phenotype search
const BODY_PART_SYMPTOM_KEYWORDS: Record<string, string[]> = {
	"UBERON:0000948": [
		"chest pain",
		"cardiac",
		"palpitations",
		"heart failure",
		"arrhythmia",
	],
	"UBERON:0000310": [
		"chest pain",
		"dyspnea",
		"breathing",
		"thoracic",
		"chest tightness",
	],
	"UBERON:0000033": [
		"headache",
		"migraine",
		"cephalgia",
		"dizziness",
		"vertigo",
	],
	"UBERON:0000955": [
		"cognitive",
		"seizure",
		"encephalopathy",
		"memory",
		"confusion",
	],
	"UBERON:0000002": [
		"abdominal pain",
		"nausea",
		"vomiting",
		"digestive",
		"bloating",
	],
	"UBERON:0000945": [
		"gastric",
		"stomach pain",
		"dyspepsia",
		"reflux",
		"nausea",
	],
	"UBERON:0002048": [
		"respiratory",
		"cough",
		"dyspnea",
		"pulmonary",
		"wheezing",
	],
	"UBERON:0003418": ["back pain", "spinal", "lumbar", "vertebral"],
	"UBERON:0000970": [
		"vision",
		"ocular",
		"eye pain",
		"blindness",
		"photophobia",
	],
	"UBERON:0001690": [
		"hearing",
		"ear pain",
		"tinnitus",
		"vertigo",
		"hearing loss",
	],
	"UBERON:0002097": ["rash", "pruritus", "skin lesion", "dermal", "erythema"],
	"UBERON:0002107": ["hepatic", "liver failure", "jaundice", "hepatomegaly"],
	"UBERON:0002113": ["renal", "urinary", "proteinuria", "kidney pain"],
	"UBERON:0001630": ["myalgia", "muscle weakness", "cramping", "muscle pain"],
	"UBERON:0001434": ["bone pain", "fracture", "osteo", "joint pain"],
	"UBERON:0001137": ["neck pain", "cervical", "stiffness", "neck swelling"],
	"UBERON:0001016": ["neuropathy", "weakness", "numbness", "paresthesia"],
};

// ---------------------------------------------------------------------------
// API Client Class
// ---------------------------------------------------------------------------

class MonarchAPIClient {
	private baseUrl: string;
	private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
	private cacheTTL = 5 * 60 * 1000; // 5 minutes

	constructor(baseUrl: string = API_BASE_URL) {
		this.baseUrl = baseUrl;
	}

	private getCacheKey(
		endpoint: string,
		params?: Record<string, unknown>,
	): string {
		return `${endpoint}:${JSON.stringify(params || {})}`;
	}

	private getFromCache<T>(key: string): T | null {
		const cached = this.cache.get(key);
		if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
			return cached.data as T;
		}
		this.cache.delete(key);
		return null;
	}

	private setCache(key: string, data: unknown): void {
		this.cache.set(key, { data, timestamp: Date.now() });
	}

	private async request<T>(
		endpoint: string,
		options: RequestInit = {},
		useCache = true,
	): Promise<T> {
		const url = `${this.baseUrl}${endpoint}`;
		const cacheKey = this.getCacheKey(
			endpoint,
			options.body ? JSON.parse(options.body as string) : undefined,
		);

		if (useCache && options.method !== "POST") {
			const cached = this.getFromCache<T>(cacheKey);
			if (cached) return cached;
		}

		const response = await fetch(url, {
			...options,
			headers: {
				"Content-Type": "application/json",
				...options.headers,
			},
		});

		if (!response.ok) {
			const error = await response
				.json()
				.catch(() => ({ detail: response.statusText }));
			throw new Error(error.detail || `API error: ${response.status}`);
		}

		const data = await response.json();

		if (useCache && options.method !== "POST") {
			this.setCache(cacheKey, data);
		}

		return data as T;
	}

	// ---------------------------------------------------------------------------
	// Health
	// ---------------------------------------------------------------------------

	async healthCheck(): Promise<{ status: string; version: string }> {
		return this.request("/health");
	}

	// ---------------------------------------------------------------------------
	// Search
	// ---------------------------------------------------------------------------

	async search(
		query: string,
		options: { category?: string; limit?: number; offset?: number } = {},
	): Promise<SearchResult> {
		const params = new URLSearchParams({ query });
		if (options.category) params.set("category", options.category);
		if (options.limit) params.set("limit", options.limit.toString());
		if (options.offset) params.set("offset", options.offset.toString());
		return this.request(`/search?${params}`);
	}

	async autocomplete(query: string, limit = 10): Promise<AutocompleteResult> {
		const params = new URLSearchParams({ query, limit: limit.toString() });
		return this.request(`/autocomplete?${params}`);
	}

	// ---------------------------------------------------------------------------
	// Anatomy (UBERON)
	// ---------------------------------------------------------------------------

	async searchAnatomy(query: string, limit = 20): Promise<SearchResult> {
		return this.search(query, { category: "biolink:AnatomicalEntity", limit });
	}

	// ---------------------------------------------------------------------------
	// Entity
	// ---------------------------------------------------------------------------

	async getEntity(entityId: string): Promise<MonarchEntity> {
		return this.request(`/entity/${encodeURIComponent(entityId)}`);
	}

	async getEntityChildren(
		entityId: string,
		options: { limit?: number; offset?: number } = {},
	): Promise<AssociationsResult> {
		const params = new URLSearchParams();
		if (options.limit) params.set("limit", options.limit.toString());
		if (options.offset) params.set("offset", options.offset.toString());
		return this.request(
			`/entity/${encodeURIComponent(entityId)}/children?${params}`,
		);
	}

	// ---------------------------------------------------------------------------
	// Associations
	// ---------------------------------------------------------------------------

	async getAssociations(options: {
		subject?: string[];
		object?: string[];
		category?: string[];
		limit?: number;
		offset?: number;
	}): Promise<AssociationsResult> {
		return this.request("/associations", {
			method: "POST",
			body: JSON.stringify(options),
		});
	}

	// ---------------------------------------------------------------------------
	// Phenotypes
	// ---------------------------------------------------------------------------

	async searchPhenotypes(
		query: string,
		options: { limit?: number; offset?: number } = {},
	): Promise<MonarchEntity[]> {
		const result = await this.search(query, {
			category: "biolink:PhenotypicFeature",
			limit: options.limit || 20,
			offset: options.offset || 0,
		});
		// Filter to only HPO terms
		return result.items.filter((item) => item.id.startsWith("HP:"));
	}

	/**
	 * Get phenotypes related to a body part by searching for symptoms
	 * Uses semantic search with body-part-specific keywords
	 */
	async getPhenotypesForBodyPart(
		bodyPartId: string,
		bodyPartName?: string,
		limit = 30,
	): Promise<MonarchEntity[]> {
		const phenotypesMap = new Map<string, MonarchEntity>();

		// Get search keywords for this body part
		const keywords = BODY_PART_SYMPTOM_KEYWORDS[bodyPartId] || [
			`${bodyPartName || "body"} pain`,
			`${bodyPartName || "body"} abnormal`,
		];

		// Add body part name as keyword if provided
		if (bodyPartName) {
			keywords.unshift(bodyPartName);
		}

		// Search for phenotypes with each keyword
		for (const keyword of keywords.slice(0, 4)) {
			try {
				const items = await this.searchPhenotypes(keyword, { limit: 15 });
				for (const item of items) {
					if (item.id.startsWith("HP:") && !phenotypesMap.has(item.id)) {
						phenotypesMap.set(item.id, item);
					}
				}
			} catch (error) {
				console.error(`Phenotype search failed for "${keyword}":`, error);
			}
		}

		return Array.from(phenotypesMap.values()).slice(0, limit);
	}

	/**
	 * Get phenotypes for multiple body parts
	 */
	async getPhenotypesForBodyParts(
		bodyParts: Array<{ id: string; name: string }>,
		limit = 30,
	): Promise<{
		grouped: Record<
			string,
			{ bodyPart: BodyPart; phenotypes: MonarchEntity[] }
		>;
		common: MonarchEntity[];
	}> {
		const grouped: Record<
			string,
			{ bodyPart: BodyPart; phenotypes: MonarchEntity[] }
		> = {};
		const phenotypeOccurrences = new Map<
			string,
			{ phenotype: MonarchEntity; count: number }
		>();

		// Fetch phenotypes for each body part
		await Promise.all(
			bodyParts.map(async (bodyPart) => {
				const phenotypes = await this.getPhenotypesForBodyPart(
					bodyPart.id,
					bodyPart.name,
					20,
				);

				const bodyPartInfo = COMMON_BODY_PARTS.find(
					(bp) => bp.id === bodyPart.id,
				) || {
					id: bodyPart.id,
					name: bodyPart.name,
				};

				grouped[bodyPart.id] = {
					bodyPart: bodyPartInfo,
					phenotypes,
				};

				// Track occurrences for finding common symptoms
				for (const phenotype of phenotypes) {
					const existing = phenotypeOccurrences.get(phenotype.id);
					if (existing) {
						existing.count += 1;
					} else {
						phenotypeOccurrences.set(phenotype.id, { phenotype, count: 1 });
					}
				}
			}),
		);

		// Find common phenotypes (appear in 2+ body parts)
		const common: MonarchEntity[] = [];
		const commonIds = new Set<string>();

		for (const [id, data] of phenotypeOccurrences) {
			if (data.count >= 2) {
				common.push(data.phenotype);
				commonIds.add(id);
			}
		}

		// Remove common phenotypes from individual lists
		for (const partId of Object.keys(grouped)) {
			grouped[partId].phenotypes = grouped[partId].phenotypes.filter(
				(p) => !commonIds.has(p.id),
			);
		}

		return { grouped, common: common.slice(0, limit) };
	}

	/**
	 * Search for diseases matching a phenotype profile using semantic similarity
	 */
	async getPhenotypeProfile(
		phenotypeIds: string[],
		options: {
			searchGroup?: string;
			metric?: string;
			limit?: number;
		} = {},
	): Promise<SimilarityMatch[]> {
		return this.request("/phenotype/profile-search", {
			method: "POST",
			body: JSON.stringify({
				phenotype_ids: phenotypeIds,
				search_group: options.searchGroup || "Human Diseases",
				metric: options.metric || "ancestor_information_content",
				limit: options.limit || 10,
			}),
		});
	}

	/**
	 * Alias for getPhenotypeProfile for backward compatibility
	 */
	async findSimilarDiseases(
		phenotypeIds: string[],
		options: {
			metric?: string;
			limit?: number;
		} = {},
	): Promise<SimilarityMatch[]> {
		return this.getPhenotypeProfile(phenotypeIds, {
			searchGroup: "Human Diseases",
			metric: options.metric,
			limit: options.limit,
		});
	}

	async getPhenotypeDiseases(
		phenotypeId: string,
		options: { limit?: number; offset?: number } = {},
	): Promise<AssociationsResult> {
		const params = new URLSearchParams();
		if (options.limit) params.set("limit", options.limit.toString());
		if (options.offset) params.set("offset", options.offset.toString());
		return this.request(
			`/phenotype/${encodeURIComponent(phenotypeId)}/diseases?${params}`,
		);
	}

	async getPhenotypeGenes(
		phenotypeId: string,
		options: { limit?: number; offset?: number } = {},
	): Promise<AssociationsResult> {
		const params = new URLSearchParams();
		if (options.limit) params.set("limit", options.limit.toString());
		if (options.offset) params.set("offset", options.offset.toString());
		return this.request(
			`/phenotype/${encodeURIComponent(phenotypeId)}/genes?${params}`,
		);
	}

	// ---------------------------------------------------------------------------
	// HPO Hierarchy (for refinement)
	// ---------------------------------------------------------------------------

	async getHPOChildren(hpoId: string, limit = 100): Promise<HPOChildrenResult> {
		const params = new URLSearchParams({ limit: limit.toString() });
		return this.request(`/hpo/${encodeURIComponent(hpoId)}/children?${params}`);
	}

	/**
	 * Get child terms for a phenotype (for refinement questions)
	 */
	async getChildren(entityId: string, limit = 50): Promise<MonarchEntity[]> {
		try {
			const result = await this.getHPOChildren(entityId, limit);
			return result.children.map((assoc) => ({
				id: assoc.subject,
				name: assoc.subject_label || assoc.subject,
				category: assoc.subject_category || "biolink:PhenotypicFeature",
			}));
		} catch {
			return [];
		}
	}

	// ---------------------------------------------------------------------------
	// Diseases
	// ---------------------------------------------------------------------------

	async getDisease(diseaseId: string): Promise<MonarchEntity> {
		return this.request(`/disease/${encodeURIComponent(diseaseId)}`);
	}

	async getDiseasePhenotypes(
		diseaseId: string,
		options: { limit?: number; offset?: number } = {},
	): Promise<AssociationsResult> {
		const params = new URLSearchParams();
		if (options.limit) params.set("limit", options.limit.toString());
		if (options.offset) params.set("offset", options.offset.toString());
		return this.request(
			`/disease/${encodeURIComponent(diseaseId)}/phenotypes?${params}`,
		);
	}

	async getDiseaseGenes(
		diseaseId: string,
		options: { limit?: number; offset?: number } = {},
	): Promise<AssociationsResult> {
		const params = new URLSearchParams();
		if (options.limit) params.set("limit", options.limit.toString());
		if (options.offset) params.set("offset", options.offset.toString());
		return this.request(
			`/disease/${encodeURIComponent(diseaseId)}/genes?${params}`,
		);
	}

	// ---------------------------------------------------------------------------
	// Genes
	// ---------------------------------------------------------------------------

	async getGene(geneId: string): Promise<MonarchEntity> {
		return this.request(`/gene/${encodeURIComponent(geneId)}`);
	}

	async getGenePhenotypes(
		geneId: string,
		options: { limit?: number; offset?: number } = {},
	): Promise<AssociationsResult> {
		const params = new URLSearchParams();
		if (options.limit) params.set("limit", options.limit.toString());
		if (options.offset) params.set("offset", options.offset.toString());
		return this.request(
			`/gene/${encodeURIComponent(geneId)}/phenotypes?${params}`,
		);
	}

	async getGeneDiseases(
		geneId: string,
		options: { limit?: number; offset?: number } = {},
	): Promise<AssociationsResult> {
		const params = new URLSearchParams();
		if (options.limit) params.set("limit", options.limit.toString());
		if (options.offset) params.set("offset", options.offset.toString());
		return this.request(
			`/gene/${encodeURIComponent(geneId)}/diseases?${params}`,
		);
	}

	// ---------------------------------------------------------------------------
	// Similarity
	// ---------------------------------------------------------------------------

	async compareTermsets(
		subjects: string[],
		objects: string[],
		metric = "ancestor_information_content",
	): Promise<unknown> {
		return this.request("/similarity/compare", {
			method: "POST",
			body: JSON.stringify({ subjects, objects, metric }),
		});
	}

	async findSimilarTerms(
		termset: string[],
		searchGroup: string,
		options: {
			metric?: string;
			directionality?: string;
			limit?: number;
		} = {},
	): Promise<SimilarityMatch[]> {
		return this.request("/similarity/search", {
			method: "POST",
			body: JSON.stringify({
				termset,
				search_group: searchGroup,
				metric: options.metric || "ancestor_information_content",
				directionality: options.directionality || "bidirectional",
				limit: options.limit || 10,
			}),
		});
	}

	// ---------------------------------------------------------------------------
	// Chat (LLM Q&A)
	// ---------------------------------------------------------------------------

	async chat(request: ChatRequest): Promise<ChatResponse> {
		return this.request("/chat", {
			method: "POST",
			body: JSON.stringify(request),
		});
	}

	// ---------------------------------------------------------------------------
	// Cache Management
	// ---------------------------------------------------------------------------

	clearCache(): void {
		this.cache.clear();
	}
}

// ---------------------------------------------------------------------------
// Singleton Export
// ---------------------------------------------------------------------------

export const monarchAPI = new MonarchAPIClient();

// Also export as monarchService for backward compatibility
export const monarchService = monarchAPI;

export { MonarchAPIClient };

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Calculate confidence percentage from similarity score
 *
 * Monarch API uses ancestor_information_content metric which typically returns:
 * - Scores from 0 to ~25+ depending on phenotype overlap
 * - Higher scores = better matches
 *
 * This function normalizes scores to a 0-100% confidence range using:
 * 1. A logarithmic scale for better distribution
 * 2. Relative scoring based on a reference maximum
 */
export function calculateConfidence(score: number, maxScore?: number): number {
	if (score <= 0) return 0;

	// Reference score for scaling (typical good match)
	const referenceMax = maxScore ?? 15;

	// Use a sigmoid-like function to map scores to 0-100%
	// This gives better distribution: low scores stay low, high scores approach 100%
	// The formula: 100 * (1 - e^(-score/k)) where k controls the curve steepness
	const k = referenceMax / 2.5; // Adjust steepness based on reference max
	const normalizedScore = 100 * (1 - Math.exp(-score / k));

	// Round to 2 decimal places and cap at 99%
	return Math.min(99, Math.round(normalizedScore * 100) / 100);
}

/**
 * Calculate confidence for a list of similarity results
 * Uses the maximum score as reference for relative scoring
 */
export function calculateConfidenceWithContext(
	score: number,
	allScores: number[],
	rank: number,
): number {
	if (score <= 0 || allScores.length === 0) return 0;

	const maxScore = Math.max(...allScores);
	const minScore = Math.min(...allScores);
	const scoreRange = maxScore - minScore;

	// Base confidence from the score itself
	let confidence: number;

	if (scoreRange > 0) {
		// Relative scoring: normalize within the result set
		// Map to 50-95% range for results (leaving room for truly perfect matches)
		const relativePosition = (score - minScore) / scoreRange;
		confidence = 50 + relativePosition * 45;
	} else {
		// All scores are the same, use absolute scoring
		confidence = calculateConfidence(score, maxScore);
	}

	// Apply a small rank decay (top results slightly preferred)
	const rankDecay = 0.995 ** rank;
	confidence = confidence * rankDecay;

	// Round to 2 decimal places
	return Math.round(confidence * 100) / 100;
}

/**
 * Calculate match confidence with rank decay
 */
export function calculateMatchConfidence(score: number, rank: number): number {
	const rankDecay = 0.97 ** rank;
	const confidence = score * rankDecay * 100;
	return Math.round(Math.min(99, Math.max(1, confidence)));
}

/**
 * Check if an entity is an HPO phenotype
 */
export function isHPO(entityId: string): boolean {
	return entityId.startsWith("HP:");
}

/**
 * Check if an entity is a MONDO disease
 */
export function isMONDO(entityId: string): boolean {
	return entityId.startsWith("MONDO:");
}

/**
 * Check if an entity is a UBERON anatomy
 */
export function isUBERON(entityId: string): boolean {
	return entityId.startsWith("UBERON:");
}

/**
 * Check if an entity is a phenotype
 */
export function isPhenotype(id: string): boolean {
	return id.startsWith("HP:");
}

/**
 * Check if an entity is a disease
 */
export function isDisease(id: string): boolean {
	return id.startsWith("MONDO:") || id.startsWith("OMIM:");
}

/**
 * Check if an entity is an anatomical entity
 */
export function isAnatomicalEntity(id: string): boolean {
	return id.startsWith("UBERON:");
}

/**
 * Get Monarch Initiative URL for an entity
 */
export function getMonarchURL(entityId: string): string {
	const type = isHPO(entityId)
		? "phenotype"
		: isMONDO(entityId)
			? "disease"
			: "entity";
	return `https://monarchinitiative.org/${type}/${entityId}`;
}

/**
 * Format entity ID for display
 */
export function formatEntityId(id: string): string {
	return id.replace(":", " ");
}

/**
 * Get the namespace prefix from an entity ID
 */
export function getEntityNamespace(id: string): string {
	return id.split(":")[0];
}
