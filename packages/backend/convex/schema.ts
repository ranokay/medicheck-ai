import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	// User API keys for the medical diagnosis API
	userApiKeys: defineTable({
		userId: v.string(),
		apiKey: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_userId", ["userId"]),

	// User health profiles
	userProfiles: defineTable({
		userId: v.string(),
		age: v.optional(v.number()),
		gender: v.optional(v.string()),
		height: v.optional(v.number()),
		weight: v.optional(v.number()),
		medicalHistory: v.optional(v.array(v.string())),
		currentMedications: v.optional(v.array(v.string())),
		allergies: v.optional(v.array(v.string())),
		smokingStatus: v.optional(v.string()),
		alcoholConsumption: v.optional(v.string()),
		exerciseLevel: v.optional(v.string()),
		dietType: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_userId", ["userId"]),

	// Saved diagnoses
	diagnoses: defineTable({
		userId: v.string(),
		symptoms: v.array(v.string()),
		patientInfo: v.object({
			age: v.optional(v.number()),
			gender: v.optional(v.string()),
			height: v.optional(v.number()),
			weight: v.optional(v.number()),
			medicalHistory: v.optional(v.array(v.string())),
			currentMedications: v.optional(v.array(v.string())),
			allergies: v.optional(v.array(v.string())),
			smokingStatus: v.optional(v.string()),
			alcoholConsumption: v.optional(v.string()),
			exerciseLevel: v.optional(v.string()),
			dietType: v.optional(v.string()),
		}),
		result: v.any(),
		language: v.optional(v.string()),
		createdAt: v.number(),
	})
		.index("by_userId", ["userId"])
		.index("by_userId_createdAt", ["userId", "createdAt"]),
});
