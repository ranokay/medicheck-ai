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

// Symptom entry
export interface SymptomEntry {
	name: string;
	severity?: "mild" | "moderate" | "severe";
	duration?: string;
	notes?: string;
}

// Question types
export type QuestionType =
	| "single_choice"
	| "multiple_choice"
	| "yes_no"
	| "scale"
	| "text";

export interface CurrentQuestion {
	questionId: string;
	question: string;
	questionType: QuestionType;
	options?: string[];
	scaleMin?: number;
	scaleMax?: number;
}

export interface QuestionAnswer {
	questionId: string;
	question: string;
	questionType: QuestionType;
	answer: unknown;
	answeredAt: number;
}

// Diagnosis result
export interface DiagnosisResult {
	conditionName: string;
	conditionId?: string;
	probability: number;
	severity: "low" | "medium" | "high" | "critical";
	description?: string;
	recommendedActions?: string[];
	specialistRecommendation?: string;
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

// Consultation with patient info
export interface ConsultationWithPatient extends Consultation {
	patient: Patient | null;
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
