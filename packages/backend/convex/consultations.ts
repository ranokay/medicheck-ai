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

// Validators matching schema
const symptomEntry = v.object({
	name: v.string(),
	severity: v.optional(
		v.union(v.literal("mild"), v.literal("moderate"), v.literal("severe")),
	),
	duration: v.optional(v.string()),
	notes: v.optional(v.string()),
});

const diagnosisResult = v.object({
	conditionName: v.string(),
	conditionId: v.optional(v.string()),
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

const currentQuestion = v.object({
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
});

// ============ Consultation Management ============

export const startConsultation = mutation({
	args: {
		patientId: v.id("patients"),
		chiefComplaint: v.string(),
		symptoms: v.optional(v.array(symptomEntry)),
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
			symptoms: args.symptoms ?? [],
			questionsAnswered: [],
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

export const updateConsultation = mutation({
	args: {
		id: v.id("consultations"),
		symptoms: v.optional(v.array(symptomEntry)),
		vitalSigns: v.optional(vitalSigns),
		chiefComplaint: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Unauthenticated");
		}

		const { id, ...updates } = args;
		const consultation = await ctx.db.get(id);
		if (!consultation) {
			throw new Error("Consultation not found");
		}

		await ctx.db.patch(id, {
			...updates,
			updatedAt: Date.now(),
		});

		return id;
	},
});

export const addSymptom = mutation({
	args: {
		consultationId: v.id("consultations"),
		symptom: symptomEntry,
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
			symptoms: [...consultation.symptoms, args.symptom],
			updatedAt: Date.now(),
		});
	},
});

export const removeSymptom = mutation({
	args: {
		consultationId: v.id("consultations"),
		symptomName: v.string(),
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
			symptoms: consultation.symptoms.filter(
				(s) => s.name !== args.symptomName,
			),
			updatedAt: Date.now(),
		});
	},
});

export const setCurrentQuestion = mutation({
	args: {
		consultationId: v.id("consultations"),
		question: currentQuestion,
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Unauthenticated");
		}

		await ctx.db.patch(args.consultationId, {
			currentQuestion: args.question,
			updatedAt: Date.now(),
		});
	},
});

export const answerQuestion = mutation({
	args: {
		consultationId: v.id("consultations"),
		answer: v.any(),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Unauthenticated");
		}

		const consultation = await ctx.db.get(args.consultationId);
		if (!consultation || !consultation.currentQuestion) {
			throw new Error("No current question to answer");
		}

		const questionAnswer = {
			questionId: consultation.currentQuestion.questionId,
			question: consultation.currentQuestion.question,
			questionType: consultation.currentQuestion.questionType,
			answer: args.answer,
			answeredAt: Date.now(),
		};

		await ctx.db.patch(args.consultationId, {
			questionsAnswered: [...consultation.questionsAnswered, questionAnswer],
			currentQuestion: undefined,
			updatedAt: Date.now(),
		});

		return questionAnswer;
	},
});

export const completeConsultation = mutation({
	args: {
		id: v.id("consultations"),
		diagnosisResults: v.array(diagnosisResult),
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
			diagnosisResults: args.diagnosisResults,
			referredToDoctor: args.referredToDoctor,
			referralNotes: args.referralNotes,
			currentQuestion: undefined,
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
