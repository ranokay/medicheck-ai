import { openai } from "@ai-sdk/openai";
import { Agent, createThread } from "@convex-dev/agent";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";
import {
	buildDiagnosisPrompt,
	buildExtractSymptomsPrompt,
	buildNextQuestionPrompt,
	SYSTEM_PROMPTS,
} from "./prompts";

// ============ Monarch REST API Client ============

interface CandidateDisease {
	id: string;
	name: string;
	description?: string;
	matchedPhenotypes: number;
	totalPhenotypes: number;
	matchScore: number;
}

interface RelatedPhenotype {
	id: string;
	name: string;
	description?: string;
	diseaseCount: number;
	diseaseNames: string[];
}

// Return type interfaces for actions
interface ExtractedSymptoms {
	symptomsEn: string[];
	chiefComplaintEn: string;
}

interface KGQueryResult {
	diseases: CandidateDisease[];
}

interface GeneratedQuestion {
	questionId: string;
	questionTextRo: string;
	questionType: "yes_no" | "single_choice" | "scale";
	options?: string[];
	phenotypeEn: string;
}

interface GeneratedQuestionBatch {
	type: "questions";
	batchId: string;
	theme: string;
	questions: GeneratedQuestion[];
	reasoning: string;
}

interface GeneratedDiagnosis {
	type: "diagnosis";
	diagnoses: Array<{
		conditionNameEn: string;
		conditionNameRo: string;
		conditionId: string;
		probability: number;
		severity: "low" | "medium" | "high" | "critical";
		matchedSymptoms: string[];
		description: string;
		recommendedActions: string[];
		specialistRecommendation?: string;
	}>;
	explanationRo: string;
	urgencyLevel: "routine" | "urgent" | "emergency";
	confidenceNote: string;
}

interface DecisionResult {
	decision: "diagnose" | "ask_more";
	reasoning: string;
}

// ============ Monarch REST API Client ============

const MONARCH_API_BASE = "https://api.monarchinitiative.org/v3/api";

/**
 * Monarch API response types
 */
interface MonarchSearchResult {
	id: string;
	name: string;
	category: string;
	description?: string;
}

interface MonarchSemsimResult {
	subject: {
		id: string;
		name: string;
		category: string;
	};
	score: number;
	similarity: {
		ancestor_id: string;
		ancestor_information_content: number;
		jaccard_similarity: number;
		phenodigm_score: number;
	};
}

interface MonarchAssociation {
	// Association API returns flat fields, not nested objects
	subject: string;
	subject_label?: string;
	subject_category?: string;
	object: string;
	object_label?: string;
	object_category?: string;
	predicate: string;
}

/**
 * Search for phenotype terms in Monarch
 */
async function searchPhenotypes(
	terms: string[],
): Promise<MonarchSearchResult[]> {
	const results: MonarchSearchResult[] = [];

	console.log("Searching Monarch for phenotype terms:", terms);

	for (const term of terms) {
		try {
			const params = new URLSearchParams({
				q: term,
				category: "biolink:PhenotypicFeature",
				limit: "5",
			});

			const url = `${MONARCH_API_BASE}/search?${params}`;
			console.log("Fetching:", url);

			const response = await fetch(url);

			if (!response.ok) {
				console.error(
					`Monarch search failed for "${term}": ${response.status}`,
				);
				const errorText = await response.text();
				console.error("Response:", errorText);
				continue;
			}

			const data = (await response.json()) as { items: MonarchSearchResult[] };
			console.log(
				`Monarch search results for "${term}":`,
				JSON.stringify(data.items?.slice(0, 2)),
			);

			if (data.items && data.items.length > 0) {
				results.push(...data.items);
			}
		} catch (error) {
			console.error(`Monarch search error for "${term}":`, error);
		}
	}

	// Deduplicate by ID
	const seen = new Set<string>();
	return results.filter((r) => {
		if (seen.has(r.id)) return false;
		seen.add(r.id);
		return true;
	});
}

/**
 * Use semantic similarity to find diseases matching phenotypes
 */
async function fetchCandidateDiseases(
	phenotypes: string[],
): Promise<CandidateDisease[]> {
	console.log("fetchCandidateDiseases called with:", phenotypes);

	if (phenotypes.length === 0) {
		console.log("No phenotypes provided");
		return [];
	}

	try {
		// First, search for phenotype IDs from the text terms
		const phenotypeResults = await searchPhenotypes(phenotypes);
		console.log("Phenotype search results:", phenotypeResults.length, "items");

		if (phenotypeResults.length === 0) {
			console.log("No phenotypes found for terms:", phenotypes);
			return [];
		}

		// Get HPO IDs (Human Phenotype Ontology) - limit to top 5 to avoid API overload
		const hpoIds = phenotypeResults
			.filter((p) => p.id.startsWith("HP:"))
			.slice(0, 5) // Limit to avoid 500 errors
			.map((p) => p.id);

		console.log("HPO IDs found (limited to 5):", hpoIds);

		if (hpoIds.length === 0) {
			console.log(
				"No HPO IDs found in results. Categories found:",
				phenotypeResults.map((p) => `${p.id}: ${p.category}`).join(", "),
			);
			return [];
		}

		// Try semsim/search first with limited IDs
		const termset = hpoIds.join("+");
		const params = new URLSearchParams({
			limit: "20",
		});

		const url = `${MONARCH_API_BASE}/semsim/search/${encodeURIComponent(termset)}/Human%20Diseases?${params}`;
		console.log("Semsim search URL:", url);

		const response = await fetch(url);

		if (response.ok) {
			const data = (await response.json()) as { items: MonarchSemsimResult[] };
			console.log("Semsim results:", data.items?.length || 0, "diseases found");

			if (data.items && data.items.length > 0) {
				// Semsim returns a similarity score - normalize it to 0-1 range
				const maxScore = Math.max(
					...data.items.map(
						(item) => item.score || item.similarity?.phenodigm_score || 0,
					),
				);
				return data.items.map((item) => {
					const rawScore = item.score || item.similarity?.phenodigm_score || 0;
					// Normalize score relative to best match, scaled by symptom coverage
					const normalizedScore =
						maxScore > 0 ? (rawScore / maxScore) * 0.8 + 0.1 : 0.5;
					return {
						id: item.subject.id,
						name: item.subject.name,
						description: undefined,
						matchedPhenotypes: hpoIds.length,
						totalPhenotypes: phenotypes.length,
						matchScore: normalizedScore,
					};
				});
			}
		} else {
			console.log(
				`Semsim search failed with ${response.status}, trying association fallback...`,
			);
		}

		// Fallback: Use association endpoint with object parameter
		// In DiseaseToPhenotypicFeatureAssociation, phenotype is the OBJECT
		// So we query: /association?object=HP:xxx&category=biolink:DiseaseToPhenotypicFeatureAssociation
		console.log(
			"Using association fallback for phenotypes:",
			hpoIds.slice(0, 3),
		);
		const diseases: CandidateDisease[] = [];
		const diseaseMap = new Map<string, CandidateDisease>();

		// Query associations for the first few phenotypes
		for (const hpoId of hpoIds.slice(0, 3)) {
			try {
				// Use the association endpoint with object parameter (phenotype is the object)
				const assocUrl = `${MONARCH_API_BASE}/association?object=${encodeURIComponent(hpoId)}&category=biolink:DiseaseToPhenotypicFeatureAssociation&limit=30`;
				console.log(
					"Fetching disease associations for phenotype:",
					hpoId,
					"URL:",
					assocUrl,
				);

				const assocResponse = await fetch(assocUrl);
				if (!assocResponse.ok) {
					const errorText = await assocResponse.text();
					console.log(
						`Association fetch failed for ${hpoId}: ${assocResponse.status}`,
						errorText.slice(0, 200),
					);
					continue;
				}

				const assocData = (await assocResponse.json()) as {
					items: MonarchAssociation[];
					total: number;
				};
				console.log(
					`Found ${assocData.items?.length || 0} disease associations for phenotype ${hpoId} (total: ${assocData.total || 0})`,
				);

				if (assocData.items) {
					for (const assoc of assocData.items) {
						// In DiseaseToPhenotypicFeatureAssociation, the disease IS the subject
						const diseaseId = assoc.subject;
						const diseaseName = assoc.subject_label;

						if (diseaseId) {
							const existing = diseaseMap.get(diseaseId);
							if (existing) {
								existing.matchedPhenotypes++;
								// Score is proportion of patient's symptoms that match this disease
								// Higher matchedPhenotypes = higher score
								existing.matchScore =
									existing.matchedPhenotypes / phenotypes.length;
							} else {
								diseaseMap.set(diseaseId, {
									id: diseaseId,
									name: diseaseName || "Unknown Disease",
									description: undefined,
									matchedPhenotypes: 1,
									totalPhenotypes: phenotypes.length, // Total patient symptoms
									matchScore: 1 / phenotypes.length,
								});
							}
						}
					}
				}
			} catch (error) {
				console.error(`Association error for ${hpoId}:`, error);
			}
		}

		// Convert map to array and sort by match score
		diseases.push(...diseaseMap.values());
		diseases.sort((a, b) => b.matchScore - a.matchScore);

		console.log("Fallback found", diseases.length, "diseases");
		return diseases.slice(0, 20);
	} catch (error) {
		console.error("Monarch API query failed:", error);
		return [];
	}
}

/**
 * Get related phenotypes for the given diseases to generate follow-up questions
 * Uses the /association endpoint which properly handles MONDO disease IDs
 */
async function fetchRelatedPhenotypes(
	diseaseIds: string[],
	excludePhenotypes: string[],
): Promise<RelatedPhenotype[]> {
	if (diseaseIds.length === 0) {
		return [];
	}

	const results: RelatedPhenotype[] = [];
	const excludeLower = new Set(excludePhenotypes.map((p) => p.toLowerCase()));

	// Query associations for each disease (limit to first 3 to avoid rate limits)
	// Use /association endpoint with subject= parameter for MONDO IDs
	for (const diseaseId of diseaseIds.slice(0, 3)) {
		try {
			const params = new URLSearchParams({
				subject: diseaseId,
				category: "biolink:DiseaseToPhenotypicFeatureAssociation",
				limit: "20",
			});

			const url = `${MONARCH_API_BASE}/association?${params}`;
			console.log(`Fetching phenotypes for disease ${diseaseId}:`, url);

			const response = await fetch(url);

			if (!response.ok) {
				console.error(
					`Monarch phenotype fetch failed for ${diseaseId}: ${response.status}`,
				);
				continue;
			}

			const data = (await response.json()) as {
				items: MonarchAssociation[];
				total: number;
			};

			if (data.items) {
				for (const assoc of data.items) {
					// The object is the phenotype (HP:xxxx)
					const phenotypeId = assoc.object || "";
					const phenotypeName = assoc.object_label || "";

					if (
						phenotypeId.startsWith("HP:") &&
						!excludeLower.has(phenotypeName.toLowerCase())
					) {
						// Check if already in results
						const existing = results.find((r) => r.id === phenotypeId);
						if (existing) {
							existing.diseaseCount++;
							if (!existing.diseaseNames.includes(diseaseId)) {
								existing.diseaseNames.push(diseaseId);
							}
						} else {
							results.push({
								id: phenotypeId,
								name: phenotypeName,
								description: undefined,
								diseaseCount: 1,
								diseaseNames: [diseaseId],
							});
						}
					}
				}
			}
		} catch (error) {
			console.error(`Monarch phenotype fetch error for ${diseaseId}:`, error);
		}
	}

	// Sort by disease count and return top results
	return results.sort((a, b) => b.diseaseCount - a.diseaseCount).slice(0, 15);
}

// ============ AI Agents using Convex Agent SDK ============

/**
 * Symptom Extractor Agent - Extracts and normalizes symptoms from Romanian text to English
 */
const symptomExtractorAgent = new Agent(components.agent, {
	name: "Symptom Extractor",
	languageModel: openai("gpt-4o-mini"),
	instructions: SYSTEM_PROMPTS.EXTRACT_SYMPTOMS,
});

/**
 * Question Generator Agent - Generates follow-up questions in Romanian
 */
const questionGeneratorAgent = new Agent(components.agent, {
	name: "Question Generator",
	languageModel: openai("gpt-4o-mini"),
	instructions: SYSTEM_PROMPTS.NEXT_QUESTION,
});

/**
 * Diagnosis Agent - Generates final diagnosis based on symptoms and KG data
 */
const diagnosisAgent = new Agent(components.agent, {
	name: "Diagnosis Generator",
	languageModel: openai("gpt-4o-mini"),
	instructions: SYSTEM_PROMPTS.FINAL_DIAGNOSIS,
});

// ============ AI Actions ============

/**
 * Helper function to safely parse JSON from LLM responses
 */
function parseJSON<T>(text: string): T {
	// Try to extract JSON from the response (LLM might include extra text)
	const jsonMatch = text.match(/\{[\s\S]*\}/);
	if (jsonMatch) {
		return JSON.parse(jsonMatch[0]) as T;
	}
	return JSON.parse(text) as T;
}

/**
 * Extract and normalize symptoms from Romanian text using AI Agent
 */
export const extractSymptoms = internalAction({
	args: {
		chiefComplaint: v.string(),
		symptomsText: v.string(),
	},
	handler: async (ctx, args) => {
		const userPrompt = buildExtractSymptomsPrompt(
			args.symptomsText,
			args.chiefComplaint,
		);

		const threadId = await createThread(ctx, components.agent);
		const result = await symptomExtractorAgent.generateText(
			ctx,
			{ threadId },
			{ prompt: userPrompt },
		);

		try {
			const parsed = JSON.parse(result.text) as {
				symptomsEn: string[];
				chiefComplaintEn: string;
			};
			return parsed;
		} catch {
			console.error("Failed to parse symptom extraction result:", result.text);
			// Return a fallback
			return {
				symptomsEn: [args.chiefComplaint],
				chiefComplaintEn: args.chiefComplaint,
			};
		}
	},
});

/**
 * Get candidate diseases from KG based on symptoms
 */
export const getCandidateDiseases = internalAction({
	args: {
		symptomsEn: v.array(v.string()),
	},
	handler: async (_ctx, args) => {
		const diseases = await fetchCandidateDiseases(args.symptomsEn);
		return { diseases };
	},
});

/**
 * Generate the next diagnostic question
 */
export const generateNextQuestion = internalAction({
	args: {
		patientAge: v.number(),
		patientSex: v.string(),
		confirmedSymptomsEn: v.array(v.string()),
		candidateDiseases: v.array(
			v.object({
				id: v.string(),
				name: v.string(),
				matchScore: v.number(),
				phenotypes: v.optional(v.array(v.string())),
			}),
		),
		previousQA: v.array(
			v.object({
				question: v.string(),
				answer: v.string(),
				phenotypeEn: v.string(),
			}),
		),
		suggestedPhenotypes: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		const userPrompt = buildNextQuestionPrompt(
			{ age: args.patientAge, sex: args.patientSex },
			args.confirmedSymptomsEn,
			args.candidateDiseases,
			args.previousQA,
			args.suggestedPhenotypes,
		);

		const threadId = await createThread(ctx, components.agent);
		const result = await questionGeneratorAgent.generateText(
			ctx,
			{ threadId },
			{ prompt: userPrompt },
		);

		// New batch format with multiple questions
		const parsed = parseJSON<{
			type: "questions";
			batchId: string;
			theme: string;
			questions: Array<{
				questionId: string;
				questionTextRo: string;
				questionType: "yes_no" | "single_choice" | "scale";
				options?: string[];
				phenotypeEn: string;
			}>;
			reasoning: string;
		}>(result.text);

		return parsed;
	},
});

/**
 * Generate final diagnosis based on KG results
 */
export const generateDiagnosis = internalAction({
	args: {
		patientAge: v.number(),
		patientSex: v.string(),
		confirmedSymptomsEn: v.array(v.string()),
		deniedSymptomsEn: v.array(v.string()),
		candidateDiseases: v.array(
			v.object({
				id: v.string(),
				name: v.string(),
				matchScore: v.number(),
				matchedPhenotypes: v.number(),
				totalPhenotypes: v.number(),
			}),
		),
		allQA: v.array(
			v.object({
				question: v.string(),
				answer: v.string(),
				phenotypeEn: v.string(),
			}),
		),
	},
	handler: async (ctx, args) => {
		const userPrompt = buildDiagnosisPrompt(
			{ age: args.patientAge, sex: args.patientSex },
			args.confirmedSymptomsEn,
			args.deniedSymptomsEn,
			args.candidateDiseases,
			args.allQA,
		);

		const threadId = await createThread(ctx, components.agent);
		const result = await diagnosisAgent.generateText(
			ctx,
			{ threadId },
			{ prompt: userPrompt },
		);

		const parsed = parseJSON<{
			type: "diagnosis";
			diagnoses: Array<{
				conditionNameEn: string;
				conditionNameRo: string;
				conditionId: string;
				probability: number;
				severity: "low" | "medium" | "high" | "critical";
				matchedSymptoms: string[];
				description: string;
				recommendedActions: string[];
				specialistRecommendation?: string;
			}>;
			explanationRo: string;
			urgencyLevel: "routine" | "urgent" | "emergency";
			confidenceNote: string;
		}>(result.text);

		return parsed;
	},
});

/**
 * Decide whether to ask more questions or generate diagnosis
 */
export const decideNextStep = internalAction({
	args: {
		candidateDiseases: v.array(
			v.object({
				id: v.string(),
				name: v.string(),
				matchScore: v.number(),
			}),
		),
		questionsAsked: v.number(),
	},
	handler: async (_ctx, args) => {
		// Simple heuristic decision (can be enhanced with LLM)
		const topScore = args.candidateDiseases[0]?.matchScore || 0;
		const secondScore = args.candidateDiseases[1]?.matchScore || 0;

		// If top candidate is significantly better, diagnose
		if (topScore > 0.5 && topScore - secondScore > 0.2) {
			return {
				decision: "diagnose" as const,
				reasoning: "Clear top candidate",
			};
		}

		// If we've asked enough questions, diagnose
		if (args.questionsAsked >= 5) {
			return {
				decision: "diagnose" as const,
				reasoning: "Maximum questions reached",
			};
		}

		// If no good candidates, diagnose with low confidence
		if (args.candidateDiseases.length === 0 || topScore < 0.1) {
			return {
				decision: "diagnose" as const,
				reasoning: "No strong candidates from KG",
			};
		}

		return {
			decision: "ask_more" as const,
			reasoning: "Need more information to differentiate",
		};
	},
});

// ============ Main Orchestration Actions ============

/**
 * Start a new AI-powered diagnostic session
 * Called when nurse submits initial patient info and symptoms
 */
export const startDiagnosticSession = action({
	args: {
		consultationId: v.id("consultations"),
		patientAge: v.number(),
		patientSex: v.string(),
		chiefComplaint: v.string(),
		initialSymptomsRo: v.string(),
	},
	handler: async (
		ctx,
		args,
	): Promise<
		| {
				status: "no_matches";
				message: string;
				symptomsEn: string[];
				chiefComplaintEn: string;
		  }
		| ({
				status: "diagnosis";
				symptomsEn: string[];
				chiefComplaintEn: string;
				candidateDiseases: CandidateDisease[];
		  } & GeneratedDiagnosis)
		| {
				status: "questions";
				questionBatch: GeneratedQuestionBatch;
				symptomsEn: string[];
				chiefComplaintEn: string;
				candidateDiseases: CandidateDisease[];
				suggestedPhenotypes: RelatedPhenotype[];
		  }
	> => {
		// Step 1: Extract and normalize symptoms to English
		const extracted = (await ctx.runAction(internal.ai.extractSymptoms, {
			chiefComplaint: args.chiefComplaint,
			symptomsText: args.initialSymptomsRo,
		})) as ExtractedSymptoms;

		// Step 2: Query KG for candidate diseases
		const kgResult = (await ctx.runAction(internal.ai.getCandidateDiseases, {
			symptomsEn: extracted.symptomsEn,
		})) as KGQueryResult;

		if (kgResult.diseases.length === 0) {
			// No matches in KG - return with low confidence
			return {
				status: "no_matches" as const,
				message:
					"Nu s-au găsit afecțiuni în baza de cunoștințe pentru aceste simptome.",
				symptomsEn: extracted.symptomsEn,
				chiefComplaintEn: extracted.chiefComplaintEn,
			};
		}

		// Step 3: Get related phenotypes for follow-up questions
		const diseaseIds = kgResult.diseases
			.slice(0, 5)
			.map((d: CandidateDisease) => d.id);
		const relatedPhenotypes = await fetchRelatedPhenotypes(
			diseaseIds,
			extracted.symptomsEn,
		);

		// Step 4: Decide whether to ask questions or go straight to diagnosis
		const decision = (await ctx.runAction(internal.ai.decideNextStep, {
			candidateDiseases: kgResult.diseases.map((d: CandidateDisease) => ({
				id: d.id,
				name: d.name,
				matchScore: d.matchScore,
			})),
			questionsAsked: 0,
		})) as DecisionResult;

		if (decision.decision === "diagnose") {
			// Go straight to diagnosis
			const diagnosis = (await ctx.runAction(internal.ai.generateDiagnosis, {
				patientAge: args.patientAge,
				patientSex: args.patientSex,
				confirmedSymptomsEn: extracted.symptomsEn,
				deniedSymptomsEn: [],
				candidateDiseases: kgResult.diseases
					.slice(0, 10)
					.map((d: CandidateDisease) => ({
						id: d.id,
						name: d.name,
						matchScore: d.matchScore,
						matchedPhenotypes: d.matchedPhenotypes,
						totalPhenotypes: d.totalPhenotypes,
					})),
				allQA: [],
			})) as GeneratedDiagnosis;

			return {
				status: "diagnosis" as const,
				...diagnosis,
				symptomsEn: extracted.symptomsEn,
				chiefComplaintEn: extracted.chiefComplaintEn,
				candidateDiseases: kgResult.diseases,
			};
		}

		// Step 5: Generate first batch of questions
		const questionBatch = (await ctx.runAction(
			internal.ai.generateNextQuestion,
			{
				patientAge: args.patientAge,
				patientSex: args.patientSex,
				confirmedSymptomsEn: extracted.symptomsEn,
				candidateDiseases: kgResult.diseases
					.slice(0, 5)
					.map((d: CandidateDisease) => ({
						id: d.id,
						name: d.name,
						matchScore: d.matchScore,
					})),
				previousQA: [],
				suggestedPhenotypes: relatedPhenotypes.map(
					(p: RelatedPhenotype) => p.name,
				),
			},
		)) as GeneratedQuestionBatch;

		return {
			status: "questions" as const,
			questionBatch,
			symptomsEn: extracted.symptomsEn,
			chiefComplaintEn: extracted.chiefComplaintEn,
			candidateDiseases: kgResult.diseases,
			suggestedPhenotypes: relatedPhenotypes,
		};
	},
});

/**
 * Process an answer and get the next question or diagnosis
 */
// Type for disease in args
type ArgDisease = {
	id: string;
	name: string;
	matchScore: number;
	matchedPhenotypes: number;
	totalPhenotypes: number;
};

type QAEntry = {
	question: string;
	answer: string;
	phenotypeEn: string;
};

export const processAnswer = action({
	args: {
		consultationId: v.id("consultations"),
		patientAge: v.number(),
		patientSex: v.string(),
		currentSymptomsEn: v.array(v.string()),
		deniedSymptomsEn: v.array(v.string()),
		candidateDiseases: v.array(
			v.object({
				id: v.string(),
				name: v.string(),
				matchScore: v.number(),
				matchedPhenotypes: v.number(),
				totalPhenotypes: v.number(),
			}),
		),
		previousQA: v.array(
			v.object({
				question: v.string(),
				answer: v.string(),
				phenotypeEn: v.string(),
			}),
		),
		// Batch answers from all questions in the batch
		batchAnswers: v.array(
			v.object({
				question: v.string(),
				answer: v.string(),
				phenotypeEn: v.string(),
				isConfirmed: v.boolean(), // true if patient has this symptom
			}),
		),
		// Optional additional notes from the nurse
		additionalNotes: v.optional(v.string()),
	},
	handler: async (
		ctx,
		args,
	): Promise<
		| ({
				status: "diagnosis";
				symptomsEn: string[];
				deniedSymptomsEn: string[];
				candidateDiseases: ArgDisease[];
				allQA: QAEntry[];
		  } & GeneratedDiagnosis)
		| {
				status: "questions";
				questionBatch: GeneratedQuestionBatch;
				symptomsEn: string[];
				deniedSymptomsEn: string[];
				candidateDiseases: ArgDisease[];
				suggestedPhenotypes: RelatedPhenotype[];
				allQA: QAEntry[];
		  }
	> => {
		// Update symptoms based on all batch answers
		const confirmedPhenotypes = args.batchAnswers
			.filter((a) => a.isConfirmed)
			.map((a) => a.phenotypeEn);
		const deniedPhenotypes = args.batchAnswers
			.filter((a) => !a.isConfirmed)
			.map((a) => a.phenotypeEn);

		const updatedSymptomsEn = [
			...args.currentSymptomsEn,
			...confirmedPhenotypes,
		];
		const updatedDeniedEn = [...args.deniedSymptomsEn, ...deniedPhenotypes];

		const newQAEntries: QAEntry[] = args.batchAnswers.map((answer) => ({
			question: answer.question,
			answer: answer.answer,
			phenotypeEn: answer.phenotypeEn,
		}));

		// If nurse provided additional notes, extract symptoms from them
		if (args.additionalNotes?.trim()) {
			const extracted = (await ctx.runAction(internal.ai.extractSymptoms, {
				chiefComplaint: "",
				symptomsText: args.additionalNotes,
			})) as ExtractedSymptoms;

			// Add newly extracted symptoms (dedup)
			const existingLower = new Set(
				updatedSymptomsEn.map((s) => s.toLowerCase()),
			);
			for (const symptom of extracted.symptomsEn) {
				if (!existingLower.has(symptom.toLowerCase())) {
					updatedSymptomsEn.push(symptom);
					existingLower.add(symptom.toLowerCase());
				}
			}

			// Add a QA entry for the notes
			newQAEntries.push({
				question: "Note suplimentare de la asistent",
				answer: args.additionalNotes,
				phenotypeEn: extracted.symptomsEn.join(", "),
			});
		}

		const allQA: QAEntry[] = [...args.previousQA, ...newQAEntries];

		// Always re-query KG with all symptoms to get updated candidate diseases
		const kgResult = (await ctx.runAction(internal.ai.getCandidateDiseases, {
			symptomsEn: updatedSymptomsEn,
		})) as KGQueryResult;
		const diseases: ArgDisease[] = kgResult.diseases.map(
			(d: CandidateDisease) => ({
				id: d.id,
				name: d.name,
				matchScore: d.matchScore,
				matchedPhenotypes: d.matchedPhenotypes,
				totalPhenotypes: d.totalPhenotypes,
			}),
		);

		// Decide next step
		const decision = (await ctx.runAction(internal.ai.decideNextStep, {
			candidateDiseases: diseases.map((d: ArgDisease) => ({
				id: d.id,
				name: d.name,
				matchScore: d.matchScore,
			})),
			questionsAsked: allQA.length,
		})) as DecisionResult;

		if (decision.decision === "diagnose") {
			// Generate final diagnosis
			const diagnosis = (await ctx.runAction(internal.ai.generateDiagnosis, {
				patientAge: args.patientAge,
				patientSex: args.patientSex,
				confirmedSymptomsEn: updatedSymptomsEn,
				deniedSymptomsEn: updatedDeniedEn,
				candidateDiseases: diseases.slice(0, 10),
				allQA,
			})) as GeneratedDiagnosis;

			return {
				status: "diagnosis" as const,
				...diagnosis,
				symptomsEn: updatedSymptomsEn,
				deniedSymptomsEn: updatedDeniedEn,
				candidateDiseases: diseases,
				allQA,
			};
		}

		// Generate next batch of questions
		const diseaseIds = diseases.slice(0, 5).map((d: ArgDisease) => d.id);
		const relatedPhenotypes = await fetchRelatedPhenotypes(diseaseIds, [
			...updatedSymptomsEn,
			...updatedDeniedEn,
		]);

		const questionBatch = (await ctx.runAction(
			internal.ai.generateNextQuestion,
			{
				patientAge: args.patientAge,
				patientSex: args.patientSex,
				confirmedSymptomsEn: updatedSymptomsEn,
				candidateDiseases: diseases.slice(0, 5).map((d: ArgDisease) => ({
					id: d.id,
					name: d.name,
					matchScore: d.matchScore,
				})),
				previousQA: allQA,
				suggestedPhenotypes: relatedPhenotypes.map(
					(p: RelatedPhenotype) => p.name,
				),
			},
		)) as GeneratedQuestionBatch;

		return {
			status: "questions" as const,
			questionBatch,
			symptomsEn: updatedSymptomsEn,
			deniedSymptomsEn: updatedDeniedEn,
			candidateDiseases: diseases,
			suggestedPhenotypes: relatedPhenotypes,
			allQA,
		};
	},
});
