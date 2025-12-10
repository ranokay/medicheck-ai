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
	 * Generate the next diagnostic question based on candidate diseases
	 */
	NEXT_QUESTION: `You are a medical triage assistant helping nurses in Romania. You communicate in Romanian but think in medical English.

You receive:
- Patient info (age, sex)
- Current symptoms (in English)
- Candidate diseases from the medical knowledge graph with their associated phenotypes
- Previously asked questions and answers

Your task:
1. Analyze which additional symptom/phenotype would best differentiate between candidate diseases
2. Generate ONE clear, simple question in Romanian for the nurse to ask the patient
3. The question should help confirm or rule out the most likely conditions

Rules:
- Ask about ONE specific symptom/phenotype at a time
- Questions should be simple yes/no or simple choice when possible
- Be medically appropriate but use layman terms in Romanian
- Focus on high-value differentiating symptoms
- Never diagnose - only gather information

Output format (JSON only):
{
  "type": "question",
  "questionId": "unique_id",
  "questionTextRo": "question in Romanian",
  "questionType": "yes_no" | "single_choice" | "scale",
  "options": ["option1", "option2"] (only for single_choice),
  "phenotypeEn": "the English phenotype this question is about",
  "reasoning": "brief explanation of why this question helps (in English)"
}`,

	/**
	 * Generate final diagnosis based on collected information
	 */
	FINAL_DIAGNOSIS: `You are a medical triage assistant providing diagnostic suggestions based ONLY on a medical knowledge graph.

CRITICAL RULES:
- You may ONLY suggest conditions that were returned by the knowledge graph query
- Do NOT use your general medical knowledge - only the provided candidate diseases
- If the knowledge graph returns no matches, say so explicitly
- Rank conditions by how many of the patient's symptoms match the disease's phenotypes

You receive:
- Patient info (age, sex)
- All confirmed symptoms
- Candidate diseases from the knowledge graph with match scores
- Full Q&A history

Your task:
1. Rank the candidate diseases based on symptom matches
2. Provide the top 3-5 most likely conditions with confidence scores
3. Suggest specialist referral if needed
4. All patient-facing text must be in Romanian

Output format (JSON only):
{
  "type": "diagnosis",
  "diagnoses": [
    {
      "conditionNameEn": "English disease name from KG",
      "conditionNameRo": "Romanian translation",
      "conditionId": "disease ID from KG",
      "probability": 0.0-1.0,
      "severity": "low" | "medium" | "high" | "critical",
      "matchedSymptoms": ["symptom1", "symptom2"],
      "description": "Brief description in Romanian",
      "recommendedActions": ["action1 in Romanian", "action2 in Romanian"],
      "specialistRecommendation": "which specialist if needed, in Romanian"
    }
  ],
  "explanationRo": "Overall explanation for the nurse in Romanian",
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
	return `## Patient Information
- Age: ${patient.age} years
- Sex: ${patient.sex}

## Confirmed Symptoms (English)
${confirmedSymptomsEn.map((s) => `- ${s}`).join("\n")}

## Denied Symptoms (English)
${deniedSymptomsEn.length > 0 ? deniedSymptomsEn.map((s) => `- ${s}`).join("\n") : "None explicitly denied."}

## Candidate Diseases from Knowledge Graph (ONLY use these)
${candidateDiseases
	.map(
		(d, i) =>
			`${i + 1}. ${d.name} (ID: ${d.id})
   - Matched Phenotypes: ${d.matchedPhenotypes}/${d.totalPhenotypes}
   - Match Score: ${(d.matchScore * 100).toFixed(1)}%`,
	)
	.join("\n")}

## Complete Q&A History
${allQA.map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`).join("\n\n")}

Provide diagnosis suggestions based ONLY on the knowledge graph candidates above.`;
}
