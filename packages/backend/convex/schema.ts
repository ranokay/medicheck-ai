import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ============ Body Part & Symptom Ontology Types ============

// Body part with UBERON ontology mapping
const bodyPart = v.object({
	id: v.string(), // UBERON ID
	name: v.string(),
	nameRo: v.optional(v.string()),
	system: v.optional(v.string()), // Body system (cardiovascular, respiratory, etc.)
});

// Symptom factor from HPO-mapped factors
const symptomFactor = v.object({
	id: v.string(),
	category: v.string(), // pain_quality, triggers, relief, accompanying, etc.
	name: v.string(),
	nameRo: v.optional(v.string()),
	hpoId: v.optional(v.string()), // Human Phenotype Ontology ID
});

// Dynamic symptom from Monarch KG
const dynamicSymptom = v.object({
	id: v.string(), // HPO ID
	name: v.string(),
	description: v.optional(v.string()),
});

// ============ Structured Symptom Input ============

// Complete structured symptom input from the symptom checker
const structuredSymptomInput = v.object({
	// Selected body parts with UBERON IDs
	bodyParts: v.array(bodyPart),
	// Selected symptom factors organized by category
	factors: v.object({
		painQuality: v.optional(v.array(symptomFactor)),
		triggers: v.optional(v.array(symptomFactor)),
		relief: v.optional(v.array(symptomFactor)),
		accompanying: v.optional(v.array(symptomFactor)),
		onset: v.optional(v.array(symptomFactor)),
		duration: v.optional(v.array(symptomFactor)),
		frequency: v.optional(v.array(symptomFactor)),
		severity: v.optional(v.array(symptomFactor)),
		locationModifier: v.optional(v.array(symptomFactor)),
	}),
	// Symptom-specific factors (Mayo Clinic style)
	symptomSpecificFactors: v.optional(
		v.record(v.string(), v.array(v.string())), // categoryId -> factorIds
	),
	// Dynamic symptoms from Monarch KG
	selectedSymptoms: v.optional(v.array(dynamicSymptom)),
	// Overall severity score (1-10)
	severityScore: v.number(),
	// Free text notes
	additionalNotes: v.optional(v.string()),
	// Patient demographic info at time of check
	patientInfo: v.object({
		ageCategory: v.string(),
		gender: v.string(),
		height: v.optional(v.number()),
		weight: v.optional(v.number()),
	}),
});

// ============ Diagnosis Result ============

// Diagnosis result with confidence score and ontology mapping
const diagnosisResult = v.object({
	conditionName: v.string(),
	conditionId: v.optional(v.string()),
	mondoId: v.optional(v.string()), // MONDO disease ontology ID
	probability: v.number(), // 0-1 score
	severity: v.union(
		v.literal("low"),
		v.literal("medium"),
		v.literal("high"),
		v.literal("critical"),
	),
	description: v.optional(v.string()),
	recommendedActions: v.optional(v.array(v.string())),
	specialistRecommendation: v.optional(v.string()),
	// Supporting evidence from knowledge graph
	matchedPhenotypes: v.optional(
		v.array(
			v.object({
				id: v.string(), // HPO ID
				name: v.string(),
				frequency: v.optional(v.string()),
			}),
		),
	),
});

// ============ Vital Signs ============

const vitalSigns = v.object({
	bloodPressureSystolic: v.optional(v.number()),
	bloodPressureDiastolic: v.optional(v.number()),
	heartRate: v.optional(v.number()),
	temperature: v.optional(v.number()), // Celsius
	respiratoryRate: v.optional(v.number()),
	oxygenSaturation: v.optional(v.number()), // Percentage
	weight: v.optional(v.number()), // kg
	height: v.optional(v.number()), // cm
});

// ============ Chat History ============

// Chat message from the diagnosis chat
const chatMessage = v.object({
	role: v.union(v.literal("user"), v.literal("assistant")),
	content: v.string(),
	timestamp: v.number(),
});

// ============ Schema Definition ============

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
		// Structured symptom input from symptom checker
		structuredInput: v.optional(structuredSymptomInput),
		// Vital signs taken during consultation
		vitalSigns: v.optional(vitalSigns),
		// Final diagnosis results from KG
		diagnosisResults: v.optional(v.array(diagnosisResult)),
		// Urgency level from diagnosis
		urgencyLevel: v.optional(
			v.union(
				v.literal("low"),
				v.literal("medium"),
				v.literal("high"),
				v.literal("emergency"),
			),
		),
		// Suggested additional tests
		suggestedTests: v.optional(v.array(v.string())),
		// Chat history from diagnosis Q&A
		chatHistory: v.optional(v.array(chatMessage)),
		// Referral info
		referredToDoctor: v.optional(v.string()),
		referralNotes: v.optional(v.string()),
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
