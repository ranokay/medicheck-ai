import type {
	Doc,
	Id,
} from "@medicheck-ai/backend/convex/_generated/dataModel";

// Patient types
export type Patient = Doc<"patients">;
export type PatientId = Id<"patients">;

// Consultation types
export type Consultation = Doc<"consultations">;
export type ConsultationId = Id<"consultations">;
export type ConsultationStatus = Consultation["status"];

// Staff types
export type MedicalStaff = Doc<"medicalStaff">;
export type StaffRole = MedicalStaff["role"];

// Diagnosis result
export interface DiagnosisResult {
	conditionName: string;
	conditionId?: string;
	mondoId?: string;
	probability: number;
	severity: "low" | "medium" | "high" | "critical";
	description?: string;
	recommendedActions?: string[];
	specialistRecommendation?: string;
	matchedPhenotypes?: Array<{
		id: string;
		name: string;
		frequency?: string;
	}>;
}

// Vital signs
export interface VitalSigns {
	bloodPressureSystolic?: number;
	bloodPressureDiastolic?: number;
	heartRate?: number;
	temperature?: number;
	respiratoryRate?: number;
	oxygenSaturation?: number;
	weight?: number;
	height?: number;
}

// Helper function to calculate age from date of birth
export function calculateAge(dateOfBirth: string): number {
	const today = new Date();
	const birthDate = new Date(dateOfBirth);
	let age = today.getFullYear() - birthDate.getFullYear();
	const monthDiff = today.getMonth() - birthDate.getMonth();
	if (
		monthDiff < 0 ||
		(monthDiff === 0 && today.getDate() < birthDate.getDate())
	) {
		age--;
	}
	return age;
}

// Format date for display
export function formatDate(timestamp: number): string {
	return new Date(timestamp).toLocaleDateString("ro-RO", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

// Format date and time
export function formatDateTime(timestamp: number): string {
	return new Date(timestamp).toLocaleString("ro-RO", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

// Get severity color
export function getSeverityColor(severity: string): string {
	switch (severity) {
		case "critical":
			return "text-red-600 bg-red-100 dark:bg-red-900/30";
		case "high":
			return "text-orange-600 bg-orange-100 dark:bg-orange-900/30";
		case "medium":
			return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
		case "low":
			return "text-green-600 bg-green-100 dark:bg-green-900/30";
		default:
			return "text-gray-600 bg-gray-100 dark:bg-gray-900/30";
	}
}

// Get status color
export function getStatusColor(status: ConsultationStatus): string {
	switch (status) {
		case "in_progress":
			return "text-blue-600 bg-blue-100 dark:bg-blue-900/30";
		case "awaiting_diagnosis":
			return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
		case "completed":
			return "text-green-600 bg-green-100 dark:bg-green-900/30";
		case "referred":
			return "text-purple-600 bg-purple-100 dark:bg-purple-900/30";
		case "cancelled":
			return "text-gray-600 bg-gray-100 dark:bg-gray-900/30";
		default:
			return "text-gray-600 bg-gray-100 dark:bg-gray-900/30";
	}
}

// Get status label
export function getStatusLabel(status: ConsultationStatus): string {
	switch (status) {
		case "in_progress":
			return "În Desfășurare";
		case "awaiting_diagnosis":
			return "Așteaptă Diagnostic";
		case "completed":
			return "Finalizat";
		case "referred":
			return "Trimis la Medic";
		case "cancelled":
			return "Anulat";
		default:
			return status;
	}
}

// ============ Decision Graph Types ============

/**
 * A selected phenotype in the decision graph
 */
export interface SelectedPhenotype {
	id: string; // HPO ID (e.g., "HP:0002315")
	name: string;
	description?: string | null;
	addedAt: number; // timestamp
	source: "search" | "refinement" | "suggestion";
	parentId?: string; // If from refinement, the parent phenotype ID
}

/**
 * Refinement question for a phenotype
 * These are child HPO terms that help narrow down the symptom
 */
export interface RefinementQuestion {
	phenotypeId: string; // Parent phenotype
	phenotypeName: string;
	childTerms: Array<{
		id: string;
		name: string;
		description?: string | null;
	}>;
	answered: boolean;
	selectedChildIds: string[];
}

/**
 * Disease match from semantic similarity search
 */
export interface DiseaseMatch {
	id: string; // MONDO ID
	name: string;
	description?: string | null;
	score: number; // Similarity score (0-1)
	confidence: number; // Calculated confidence percentage
	matchedPhenotypes: string[]; // HPO IDs that contributed to match
	urgencyLevel: "low" | "medium" | "high" | "emergency";
}

/**
 * Complete state of the decision graph symptom checker
 */
export interface DecisionGraphState {
	// Step 1: Phenotype selection
	selectedPhenotypes: SelectedPhenotype[];

	// Step 2: Refinement questions
	refinementQuestions: RefinementQuestion[];
	currentRefinementIndex: number;

	// Step 3: Diagnosis results
	diagnosisResults: DiseaseMatch[];
	diagnosisTimestamp?: number;

	// Step 4: LLM Chat (post-diagnosis Q&A)
	chatMessages: ChatMessage[];

	// UI state
	currentStep: "search" | "refine" | "results" | "chat";
	isLoading: boolean;
	error?: string;

	// Patient context
	patientInfo?: {
		ageCategory?: string;
		biologicalSex?: string;
	};
}

/**
 * Chat message for LLM interaction (post-diagnosis only)
 */
export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: number;
}

/**
 * Actions for the decision graph reducer
 */
export type DecisionGraphAction =
	| { type: "ADD_PHENOTYPE"; phenotype: SelectedPhenotype }
	| { type: "REMOVE_PHENOTYPE"; phenotypeId: string }
	| { type: "SET_REFINEMENT_QUESTIONS"; questions: RefinementQuestion[] }
	| {
			type: "ANSWER_REFINEMENT";
			questionIndex: number;
			selectedChildIds: string[];
	  }
	| { type: "SKIP_REFINEMENT"; questionIndex: number }
	| { type: "SET_DIAGNOSIS_RESULTS"; results: DiseaseMatch[] }
	| { type: "ADD_CHAT_MESSAGE"; message: ChatMessage }
	| { type: "SET_STEP"; step: DecisionGraphState["currentStep"] }
	| { type: "SET_LOADING"; isLoading: boolean }
	| { type: "SET_ERROR"; error: string }
	| { type: "CLEAR_ERROR" }
	| { type: "SET_PATIENT_INFO"; info: DecisionGraphState["patientInfo"] }
	| { type: "RESET" };

/**
 * Initial state for decision graph
 */
export const initialDecisionGraphState: DecisionGraphState = {
	selectedPhenotypes: [],
	refinementQuestions: [],
	currentRefinementIndex: 0,
	diagnosisResults: [],
	chatMessages: [],
	currentStep: "search",
	isLoading: false,
};

/**
 * Reducer for decision graph state
 */
export function decisionGraphReducer(
	state: DecisionGraphState,
	action: DecisionGraphAction,
): DecisionGraphState {
	switch (action.type) {
		case "ADD_PHENOTYPE":
			// Prevent duplicates
			if (state.selectedPhenotypes.some((p) => p.id === action.phenotype.id)) {
				return state;
			}
			return {
				...state,
				selectedPhenotypes: [...state.selectedPhenotypes, action.phenotype],
			};

		case "REMOVE_PHENOTYPE":
			return {
				...state,
				selectedPhenotypes: state.selectedPhenotypes.filter(
					(p) => p.id !== action.phenotypeId,
				),
				// Also remove any refinements from this phenotype
				refinementQuestions: state.refinementQuestions.filter(
					(q) => q.phenotypeId !== action.phenotypeId,
				),
			};

		case "SET_REFINEMENT_QUESTIONS":
			return {
				...state,
				refinementQuestions: action.questions,
				currentRefinementIndex: 0,
			};

		case "ANSWER_REFINEMENT":
			return {
				...state,
				refinementQuestions: state.refinementQuestions.map((q, i) =>
					i === action.questionIndex
						? {
								...q,
								answered: true,
								selectedChildIds: action.selectedChildIds,
							}
						: q,
				),
				currentRefinementIndex: action.questionIndex + 1,
			};

		case "SKIP_REFINEMENT":
			return {
				...state,
				refinementQuestions: state.refinementQuestions.map((q, i) =>
					i === action.questionIndex ? { ...q, answered: true } : q,
				),
				currentRefinementIndex: action.questionIndex + 1,
			};

		case "SET_DIAGNOSIS_RESULTS":
			return {
				...state,
				diagnosisResults: action.results,
				diagnosisTimestamp: Date.now(),
			};

		case "ADD_CHAT_MESSAGE":
			return {
				...state,
				chatMessages: [...state.chatMessages, action.message],
			};

		case "SET_STEP":
			return {
				...state,
				currentStep: action.step,
			};

		case "SET_LOADING":
			return {
				...state,
				isLoading: action.isLoading,
			};

		case "SET_ERROR":
			return {
				...state,
				error: action.error,
				isLoading: false,
			};

		case "CLEAR_ERROR":
			return {
				...state,
				error: undefined,
			};

		case "SET_PATIENT_INFO":
			return {
				...state,
				patientInfo: action.info,
			};

		case "RESET":
			return initialDecisionGraphState;

		default:
			return state;
	}
}

// ============ Utility Types ============

/**
 * Urgency level calculation based on matched diseases
 */
export type UrgencyLevel = "low" | "medium" | "high" | "emergency";

/**
 * Get urgency color for display
 */
export function getUrgencyColor(urgency: UrgencyLevel): string {
	switch (urgency) {
		case "emergency":
			return "text-red-600 bg-red-100 dark:bg-red-900/30 border-red-500";
		case "high":
			return "text-orange-600 bg-orange-100 dark:bg-orange-900/30 border-orange-500";
		case "medium":
			return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500";
		case "low":
			return "text-green-600 bg-green-100 dark:bg-green-900/30 border-green-500";
	}
}

/**
 * Get urgency label
 */
export function getUrgencyLabel(
	urgency: UrgencyLevel,
	language: "en" | "ro" = "en",
): string {
	const labels = {
		emergency: {
			en: "Emergency - Seek immediate care",
			ro: "Urgență - Solicitați ajutor imediat",
		},
		high: {
			en: "High priority - See a doctor today",
			ro: "Prioritate ridicată - Consultați un medic astăzi",
		},
		medium: {
			en: "Medium priority - Schedule appointment",
			ro: "Prioritate medie - Programați o consultație",
		},
		low: {
			en: "Low priority - Monitor symptoms",
			ro: "Prioritate scăzută - Monitorizați simptomele",
		},
	};
	return labels[urgency][language];
}
