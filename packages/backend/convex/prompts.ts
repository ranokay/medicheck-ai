/**
 * LLM Prompts for the MediCheck AI diagnostic system
 * All prompts are bilingual: Romanian for user-facing, English for KG
 */

export const SYSTEM_PROMPTS = {
	/**
	 * Extract symptoms from Romanian text and normalize to English medical terms
	 */
	EXTRACT_SYMPTOMS: `You are a medical symptom extraction assistant. Your job is to:
1. Take symptom descriptions in Romanian from a nurse/medical assistant
2. Extract and normalize them to standard English medical phenotype terms
3. Return ONLY valid JSON, no explanations

Rules:
- Use simple medical English terms (e.g., "fever", "headache", "chest pain", "fatigue")
- Separate compound symptoms into individual terms
- Include severity indicators as separate terms when mentioned
- Ignore non-symptom information (patient name, age, etc.)

Output format (JSON only):
{
  "symptomsEn": ["symptom1", "symptom2", ...],
  "chiefComplaintEn": "main reason for visit in English"
}`,

	/**
	 * Generate batch of diagnostic questions based on candidate diseases
	 */
	NEXT_QUESTION: `You are a medical triage assistant helping nurses in Romania. You communicate in Romanian but think in medical English.

You receive:
- Patient info (age, sex)
- Current symptoms (in English)
- Candidate diseases from the medical knowledge graph with their associated phenotypes
- Previously asked questions and answers

Your task:
1. Analyze which additional symptoms/phenotypes would best differentiate between candidate diseases
2. Generate 3-5 RELATED questions in Romanian for the nurse to ask the patient
3. Group questions that are medically related (e.g., all about pain characteristics, all about timing, all about associated symptoms)
4. The questions should help confirm or rule out the most likely conditions

Rules:
- Generate 3-5 related questions as a BATCH
- Group questions by theme (e.g., "Pain characteristics", "Timing and duration", "Associated symptoms")
- Questions should be simple yes/no or simple choice when possible
- Be medically appropriate but use layman terms in Romanian
- Focus on high-value differentiating symptoms
- Never diagnose - only gather information

Output format (JSON only):
{
  "type": "questions",
  "batchId": "unique_batch_id",
  "theme": "Theme name in Romanian (e.g., Caracteristici ale durerii)",
  "questions": [
    {
      "questionId": "unique_id_1",
      "questionTextRo": "question in Romanian",
      "questionType": "yes_no" | "single_choice" | "scale",
      "options": ["option1", "option2"] (only for single_choice),
      "phenotypeEn": "the English phenotype this question is about"
    }
  ],
  "reasoning": "brief explanation of why these questions help differentiate (in English)"
}`,

	/**
	 * Generate final diagnosis based on collected information
	 */
	FINAL_DIAGNOSIS: `You are a medical triage assistant providing diagnostic suggestions based ONLY on a medical knowledge graph.

CRITICAL RULES:
1. You may ONLY suggest conditions that were returned by the knowledge graph query
2. Do NOT use your general medical knowledge - only the provided candidate diseases
3. If the knowledge graph returns no matches, say so explicitly

SCORING ALGORITHM (YOU MUST FOLLOW THIS EXACTLY):
- Each candidate disease has a "Matched Phenotypes: X/Y" ratio from the KG
- The match score shows: (number of patient symptoms found in disease phenotypes) / (total disease phenotypes)
- RANK diseases primarily by their match scores - higher is better
- If two diseases have similar scores, prefer the one with more absolute matched phenotypes

GROUPING RULES:
- GROUP diseases that are clearly variants of the same condition (e.g., "migraine type 1" and "migraine type 2" → just "migraine")
- When grouping, use the HIGHEST match score from the group
- List at most 4-5 DISTINCT conditions in the final output

PROBABILITY CALCULATION:
- Use the match score from KG as the base probability
- Adjust based on: age/sex fit, symptom severity, denied symptoms that would have been expected
- Top condition should have highest probability (usually 40-80%)
- Other conditions should have progressively lower probabilities
- DO NOT give all conditions the same probability like 20%

OUTPUT REQUIREMENTS:
- matchedSymptoms: List ALL patient symptoms that this condition explains (not just one!)
- description: Explain in Romanian why this condition matches
- recommendedActions: Practical next steps in Romanian

You receive:
- Patient info (age, sex)
- All confirmed symptoms (this is the TOTAL symptom list)
- Candidate diseases from the knowledge graph with match scores
- Full Q&A history

Output format (JSON only):
{
  "type": "diagnosis",
  "diagnoses": [
    {
      "conditionNameEn": "English disease name from KG",
      "conditionNameRo": "Romanian translation",
      "conditionId": "disease ID from KG (use most specific)",
      "probability": 0.0-1.0 (USE THE MATCH SCORE AS BASE),
      "severity": "low" | "medium" | "high" | "critical",
      "matchedSymptoms": ["list ALL symptoms this disease explains"],
      "description": "Brief description in Romanian explaining the condition",
      "recommendedActions": ["action1 in Romanian", "action2 in Romanian"],
      "specialistRecommendation": "which specialist if needed, in Romanian"
    }
  ],
  "explanationRo": "Overall explanation for the nurse in Romanian, summarizing the differential diagnosis",
  "urgencyLevel": "routine" | "urgent" | "emergency",
  "confidenceNote": "Note about confidence level based on KG matches"
}`,

	/**
	 * Decide whether to ask more questions or provide final diagnosis
	 */
	DECISION: `You are a medical triage coordinator. Based on the current information, decide if:
1. More questions are needed to differentiate between conditions
2. Enough information is available for a diagnosis suggestion

Decision criteria:
- If there are 3+ candidate diseases with similar match scores, ask more questions
- If one disease clearly stands out (>30% higher match than others), proceed to diagnosis
- If 5+ questions have been asked, proceed to diagnosis with current info
- If all symptoms point clearly to one condition, proceed to diagnosis

Output format (JSON only):
{
  "decision": "ask_more" | "diagnose",
  "reasoning": "brief explanation in English"
}`,
};

/**
 * Build a prompt for symptom extraction
 */
export function buildExtractSymptomsPrompt(
	symptomsRo: string,
	chiefComplaint: string,
): string {
	return `Patient chief complaint (Romanian): ${chiefComplaint}

Additional symptoms described (Romanian): ${symptomsRo}

Extract and normalize all symptoms to English medical terms.`;
}

/**
 * Build a prompt for the next question
 */
export function buildNextQuestionPrompt(
	patient: { age: number; sex: string },
	confirmedSymptomsEn: string[],
	candidateDiseases: Array<{
		id: string;
		name: string;
		matchScore: number;
		phenotypes?: string[];
	}>,
	previousQA: Array<{ question: string; answer: string; phenotypeEn: string }>,
	suggestedPhenotypes: string[],
): string {
	return `## Patient Information
- Age: ${patient.age} years
- Sex: ${patient.sex}

## Confirmed Symptoms (English)
${confirmedSymptomsEn.map((s) => `- ${s}`).join("\n")}

## Candidate Diseases from Knowledge Graph
${candidateDiseases
	.map(
		(d, i) =>
			`${i + 1}. ${d.name} (ID: ${d.id})
   - Match Score: ${(d.matchScore * 100).toFixed(1)}%
   - Associated phenotypes: ${d.phenotypes?.slice(0, 5).join(", ") || "N/A"}`,
	)
	.join("\n")}

## Previous Questions & Answers
${
	previousQA.length > 0
		? previousQA
				.map(
					(qa) =>
						`Q: ${qa.question}\nA: ${qa.answer}\nPhenotype: ${qa.phenotypeEn}`,
				)
				.join("\n\n")
		: "No previous questions yet."
}

## Suggested Phenotypes to Ask About (from KG)
${suggestedPhenotypes.slice(0, 10).join(", ")}

Generate the next question to ask the patient (in Romanian).`;
}

/**
 * Build a prompt for final diagnosis
 */
export function buildDiagnosisPrompt(
	patient: { age: number; sex: string },
	confirmedSymptomsEn: string[],
	deniedSymptomsEn: string[],
	candidateDiseases: Array<{
		id: string;
		name: string;
		matchScore: number;
		matchedPhenotypes: number;
		totalPhenotypes: number;
	}>,
	allQA: Array<{ question: string; answer: string; phenotypeEn: string }>,
): string {
	// Sort candidates by match score descending
	const sortedCandidates = [...candidateDiseases].sort(
		(a, b) => b.matchScore - a.matchScore,
	);

	return `## Patient Information
- Age: ${patient.age} years
- Sex: ${patient.sex}

## TOTAL CONFIRMED SYMPTOMS (${confirmedSymptomsEn.length} symptoms)
${confirmedSymptomsEn.map((s, i) => `${i + 1}. ${s}`).join("\n")}

## Denied Symptoms
${deniedSymptomsEn.length > 0 ? deniedSymptomsEn.map((s) => `- ${s}`).join("\n") : "None explicitly denied."}

## Candidate Diseases from Knowledge Graph (RANKED BY MATCH SCORE)
${sortedCandidates
	.slice(0, 10)
	.map(
		(d, i) =>
			`${i + 1}. ${d.name}
   ID: ${d.id}
   Match Score: ${(d.matchScore * 100).toFixed(1)}% (${d.matchedPhenotypes} patient symptoms match this disease's ${d.totalPhenotypes} known phenotypes)`,
	)
	.join("\n\n")}

## Complete Q&A History
${allQA.length > 0 ? allQA.map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`).join("\n\n") : "No additional questions were asked."}

INSTRUCTIONS:
1. Review the ${confirmedSymptomsEn.length} confirmed symptoms above
2. For each candidate disease, identify which of those ${confirmedSymptomsEn.length} symptoms it can explain
3. Use the match scores from KG as the PRIMARY factor for probability
4. Group similar conditions and output 3-5 DISTINCT diagnoses
5. The top diagnosis should have the highest match score probability
6. In matchedSymptoms, list ALL the patient symptoms each condition explains (from the list above)

Provide diagnosis suggestions based ONLY on the knowledge graph candidates above.`;
}
