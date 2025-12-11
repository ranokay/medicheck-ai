import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper to get the authenticated user ID
async function getAuthUserId(ctx: {
	auth: { getUserIdentity: () => Promise<{ subject?: string } | null> };
}) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		return null;
	}
	return identity.subject;
}

// ============ Validators matching schema ============

const bodyPart = v.object({
	id: v.string(),
	name: v.string(),
	nameRo: v.optional(v.string()),
	system: v.optional(v.string()),
});

const symptomFactor = v.object({
	id: v.string(),
	category: v.string(),
	name: v.string(),
	nameRo: v.optional(v.string()),
	hpoId: v.optional(v.string()),
});

const dynamicSymptom = v.object({
	id: v.string(),
	name: v.string(),
	description: v.optional(v.string()),
});

const structuredSymptomInput = v.object({
	bodyParts: v.array(bodyPart),
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
	symptomSpecificFactors: v.optional(v.record(v.string(), v.array(v.string()))),
	selectedSymptoms: v.optional(v.array(dynamicSymptom)),
	severityScore: v.number(),
	additionalNotes: v.optional(v.string()),
	patientInfo: v.object({
		ageCategory: v.string(),
		gender: v.string(),
		height: v.optional(v.number()),
		weight: v.optional(v.number()),
	}),
});

const diagnosisResult = v.object({
	conditionName: v.string(),
	conditionId: v.optional(v.string()),
	mondoId: v.optional(v.string()),
	probability: v.number(),
	severity: v.union(
		v.literal("low"),
		v.literal("medium"),
		v.literal("high"),
		v.literal("critical"),
	),
	description: v.optional(v.string()),
	recommendedActions: v.optional(v.array(v.string())),
	specialistRecommendation: v.optional(v.string()),
	matchedPhenotypes: v.optional(
		v.array(
			v.object({
				id: v.string(),
				name: v.string(),
				frequency: v.optional(v.string()),
			}),
		),
	),
});

const vitalSigns = v.object({
	bloodPressureSystolic: v.optional(v.number()),
	bloodPressureDiastolic: v.optional(v.number()),
	heartRate: v.optional(v.number()),
	temperature: v.optional(v.number()),
	respiratoryRate: v.optional(v.number()),
	oxygenSaturation: v.optional(v.number()),
	weight: v.optional(v.number()),
	height: v.optional(v.number()),
});

// ============ Consultation Management ============

export const startConsultation = mutation({
	args: {
		patientId: v.id("patients"),
		chiefComplaint: v.string(),
		vitalSigns: v.optional(vitalSigns),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Unauthenticated");
		}

		const patient = await ctx.db.get(args.patientId);
		if (!patient) {
			throw new Error("Patient not found");
		}

		const now = Date.now();
		return await ctx.db.insert("consultations", {
			patientId: args.patientId,
			staffId: userId,
			status: "in_progress",
			chiefComplaint: args.chiefComplaint,
			vitalSigns: args.vitalSigns,
			startedAt: now,
			updatedAt: now,
		});
	},
});

export const updateVitalSigns = mutation({
	args: {
		consultationId: v.id("consultations"),
		vitalSigns: vitalSigns,
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Unauthenticated");
		}

		const consultation = await ctx.db.get(args.consultationId);
		if (!consultation) {
			throw new Error("Consultation not found");
		}

		await ctx.db.patch(args.consultationId, {
			vitalSigns: args.vitalSigns,
			updatedAt: Date.now(),
		});
	},
});

export const updateStructuredInput = mutation({
	args: {
		consultationId: v.id("consultations"),
		structuredInput: structuredSymptomInput,
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Unauthenticated");
		}

		const consultation = await ctx.db.get(args.consultationId);
		if (!consultation) {
			throw new Error("Consultation not found");
		}

		await ctx.db.patch(args.consultationId, {
			structuredInput: args.structuredInput,
			status: "awaiting_diagnosis",
			updatedAt: Date.now(),
		});
	},
});

export const saveDiagnosisResults = mutation({
	args: {
		consultationId: v.id("consultations"),
		diagnosisResults: v.array(diagnosisResult),
		urgencyLevel: v.union(
			v.literal("low"),
			v.literal("medium"),
			v.literal("high"),
			v.literal("emergency"),
		),
		suggestedTests: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Unauthenticated");
		}

		const consultation = await ctx.db.get(args.consultationId);
		if (!consultation) {
			throw new Error("Consultation not found");
		}

		await ctx.db.patch(args.consultationId, {
			diagnosisResults: args.diagnosisResults,
			urgencyLevel: args.urgencyLevel,
			suggestedTests: args.suggestedTests,
			updatedAt: Date.now(),
		});
	},
});

export const completeConsultation = mutation({
	args: {
		id: v.id("consultations"),
		diagnosisResults: v.optional(v.array(diagnosisResult)),
		referredToDoctor: v.optional(v.string()),
		referralNotes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Unauthenticated");
		}

		const consultation = await ctx.db.get(args.id);
		if (!consultation) {
			throw new Error("Consultation not found");
		}

		const now = Date.now();
		await ctx.db.patch(args.id, {
			status: args.referredToDoctor ? "referred" : "completed",
			diagnosisResults: args.diagnosisResults ?? consultation.diagnosisResults,
			referredToDoctor: args.referredToDoctor,
			referralNotes: args.referralNotes,
			completedAt: now,
			updatedAt: now,
		});

		return args.id;
	},
});

export const cancelConsultation = mutation({
	args: { id: v.id("consultations") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Unauthenticated");
		}

		await ctx.db.patch(args.id, {
			status: "cancelled",
			updatedAt: Date.now(),
		});
	},
});

// ============ Queries ============

export const getConsultation = query({
	args: { id: v.id("consultations") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		const consultation = await ctx.db.get(args.id);
		if (!consultation) {
			return null;
		}

		// Also get the patient info
		const patient = await ctx.db.get(consultation.patientId);

		return {
			...consultation,
			patient,
		};
	},
});

export const getPatientConsultations = query({
	args: {
		patientId: v.id("patients"),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		const limit = args.limit ?? 20;

		return await ctx.db
			.query("consultations")
			.withIndex("by_patientId_startedAt", (q) =>
				q.eq("patientId", args.patientId),
			)
			.order("desc")
			.take(limit);
	},
});

export const getActiveConsultations = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		const consultations = await ctx.db
			.query("consultations")
			.withIndex("by_staffId", (q) => q.eq("staffId", userId))
			.filter((q) => q.eq(q.field("status"), "in_progress"))
			.order("desc")
			.take(10);

		// Get patient info for each consultation
		return await Promise.all(
			consultations.map(async (c) => {
				const patient = await ctx.db.get(c.patientId);
				return { ...c, patient };
			}),
		);
	},
});

export const getRecentConsultations = query({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		const limit = args.limit ?? 10;

		const consultations = await ctx.db
			.query("consultations")
			.withIndex("by_staffId", (q) => q.eq("staffId", userId))
			.order("desc")
			.take(limit);

		// Get patient info for each consultation
		return await Promise.all(
			consultations.map(async (c) => {
				const patient = await ctx.db.get(c.patientId);
				return { ...c, patient };
			}),
		);
	},
});

export const getTodaysStats = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		const startOfToday = new Date();
		startOfToday.setHours(0, 0, 0, 0);
		const startTimestamp = startOfToday.getTime();

		const todaysConsultations = await ctx.db
			.query("consultations")
			.withIndex("by_staffId", (q) => q.eq("staffId", userId))
			.filter((q) => q.gte(q.field("startedAt"), startTimestamp))
			.collect();

		const completed = todaysConsultations.filter(
			(c) => c.status === "completed" || c.status === "referred",
		).length;
		const inProgress = todaysConsultations.filter(
			(c) => c.status === "in_progress",
		).length;
		const referred = todaysConsultations.filter(
			(c) => c.status === "referred",
		).length;

		return {
			total: todaysConsultations.length,
			completed,
			inProgress,
			referred,
		};
	},
});
