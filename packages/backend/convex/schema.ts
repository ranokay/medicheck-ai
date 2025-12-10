import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Symptom entry with optional details
const symptomEntry = v.object({
	name: v.string(),
	severity: v.optional(
		v.union(v.literal("mild"), v.literal("moderate"), v.literal("severe")),
	),
	duration: v.optional(v.string()), // e.g., "2 days", "1 week"
	notes: v.optional(v.string()),
});

// Question-answer pair for the diagnostic flow
const questionAnswer = v.object({
	questionId: v.string(),
	question: v.string(),
	questionType: v.union(
		v.literal("single_choice"),
		v.literal("multiple_choice"),
		v.literal("yes_no"),
		v.literal("scale"),
		v.literal("text"),
	),
	answer: v.any(), // Can be string, array, number depending on questionType
	answeredAt: v.number(),
});

// Diagnosis result with confidence score
const diagnosisResult = v.object({
	conditionName: v.string(),
	conditionId: v.optional(v.string()),
	probability: v.number(), // 0-100 percentage
	severity: v.union(
		v.literal("low"),
		v.literal("medium"),
		v.literal("high"),
		v.literal("critical"),
	),
	description: v.optional(v.string()),
	recommendedActions: v.optional(v.array(v.string())),
	specialistRecommendation: v.optional(v.string()),
});

export default defineSchema({
	// Medical staff profiles (nurses, doctors, medical assistants)
	medicalStaff: defineTable({
		userId: v.string(), // Links to auth user
		role: v.union(
			v.literal("nurse"),
			v.literal("doctor"),
			v.literal("medical_assistant"),
		),
		firstName: v.string(),
		lastName: v.string(),
		specialization: v.optional(v.string()),
		licenseNumber: v.optional(v.string()),
		clinicId: v.optional(v.string()),
		isActive: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_userId", ["userId"])
		.index("by_role", ["role"])
		.index("by_clinicId", ["clinicId"]),

	// Patient records identified by CNP
	patients: defineTable({
		cnp: v.string(), // Romanian "Cod Numeric Personal" - unique identifier
		firstName: v.string(),
		lastName: v.string(),
		dateOfBirth: v.string(), // ISO date string
		sex: v.union(v.literal("male"), v.literal("female")),
		// Contact info
		phone: v.optional(v.string()),
		email: v.optional(v.string()),
		address: v.optional(v.string()),
		// Medical background
		bloodType: v.optional(v.string()),
		knownAllergies: v.optional(v.array(v.string())),
		chronicConditions: v.optional(v.array(v.string())),
		currentMedications: v.optional(v.array(v.string())),
		familyHistory: v.optional(v.array(v.string())),
		// Lifestyle factors
		smokingStatus: v.optional(
			v.union(v.literal("never"), v.literal("former"), v.literal("current")),
		),
		alcoholConsumption: v.optional(
			v.union(v.literal("none"), v.literal("occasional"), v.literal("regular")),
		),
		// Metadata
		notes: v.optional(v.string()),
		createdBy: v.string(), // Staff userId who created the record
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_cnp", ["cnp"])
		.index("by_lastName", ["lastName"])
		.index("by_createdAt", ["createdAt"])
		.searchIndex("search_patients", {
			searchField: "lastName",
			filterFields: ["cnp"],
		}),

	// Consultations/diagnostic sessions
	consultations: defineTable({
		patientId: v.id("patients"),
		staffId: v.string(), // Staff userId who conducted the consultation
		// Session status
		status: v.union(
			v.literal("in_progress"),
			v.literal("awaiting_diagnosis"),
			v.literal("completed"),
			v.literal("referred"),
			v.literal("cancelled"),
		),
		// Chief complaint - main reason for visit
		chiefComplaint: v.string(),
		// Collected symptoms
		symptoms: v.array(symptomEntry),
		// Q&A flow from the diagnostic engine
		questionsAnswered: v.array(questionAnswer),
		// Current question being asked (for in-progress sessions)
		currentQuestion: v.optional(
			v.object({
				questionId: v.string(),
				question: v.string(),
				questionType: v.union(
					v.literal("single_choice"),
					v.literal("multiple_choice"),
					v.literal("yes_no"),
					v.literal("scale"),
					v.literal("text"),
				),
				options: v.optional(v.array(v.string())),
				scaleMin: v.optional(v.number()),
				scaleMax: v.optional(v.number()),
			}),
		),
		// Final diagnosis results
		diagnosisResults: v.optional(v.array(diagnosisResult)),
		// Which doctor the patient was referred to (if any)
		referredToDoctor: v.optional(v.string()),
		referralNotes: v.optional(v.string()),
		// Vital signs taken during consultation
		vitalSigns: v.optional(
			v.object({
				bloodPressureSystolic: v.optional(v.number()),
				bloodPressureDiastolic: v.optional(v.number()),
				heartRate: v.optional(v.number()),
				temperature: v.optional(v.number()), // Celsius
				respiratoryRate: v.optional(v.number()),
				oxygenSaturation: v.optional(v.number()), // Percentage
				weight: v.optional(v.number()), // kg
				height: v.optional(v.number()), // cm
			}),
		),
		// Timestamps
		startedAt: v.number(),
		completedAt: v.optional(v.number()),
		updatedAt: v.number(),
	})
		.index("by_patientId", ["patientId"])
		.index("by_staffId", ["staffId"])
		.index("by_status", ["status"])
		.index("by_startedAt", ["startedAt"])
		.index("by_patientId_startedAt", ["patientId", "startedAt"]),

	// Quick lookup for recent patients (for the dashboard)
	recentPatientViews: defineTable({
		staffId: v.string(),
		patientId: v.id("patients"),
		viewedAt: v.number(),
	})
		.index("by_staffId", ["staffId"])
		.index("by_staffId_viewedAt", ["staffId", "viewedAt"]),
});
