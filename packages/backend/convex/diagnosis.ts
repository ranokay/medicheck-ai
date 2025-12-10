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

// ============ API Key Management ============

export const getApiKey = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		const apiKeyDoc = await ctx.db
			.query("userApiKeys")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();

		return apiKeyDoc?.apiKey ?? null;
	},
});

export const saveApiKey = mutation({
	args: { apiKey: v.string() },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Unauthenticated");
		}

		const existing = await ctx.db
			.query("userApiKeys")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();

		const now = Date.now();

		if (existing) {
			await ctx.db.patch(existing._id, {
				apiKey: args.apiKey,
				updatedAt: now,
			});
			return existing._id;
		}

		return await ctx.db.insert("userApiKeys", {
			userId,
			apiKey: args.apiKey,
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const deleteApiKey = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Unauthenticated");
		}

		const existing = await ctx.db
			.query("userApiKeys")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();

		if (existing) {
			await ctx.db.delete(existing._id);
		}

		return { success: true };
	},
});

// ============ User Profile Management ============

export const getUserProfile = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		return await ctx.db
			.query("userProfiles")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();
	},
});

export const saveUserProfile = mutation({
	args: {
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
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Unauthenticated");
		}

		const existing = await ctx.db
			.query("userProfiles")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();

		const now = Date.now();

		if (existing) {
			await ctx.db.patch(existing._id, {
				...args,
				updatedAt: now,
			});
			return existing._id;
		}

		return await ctx.db.insert("userProfiles", {
			userId,
			...args,
			createdAt: now,
			updatedAt: now,
		});
	},
});

// ============ Diagnosis Management ============

export const saveDiagnosis = mutation({
	args: {
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
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Unauthenticated");
		}

		return await ctx.db.insert("diagnoses", {
			userId,
			symptoms: args.symptoms,
			patientInfo: args.patientInfo,
			result: args.result,
			language: args.language,
			createdAt: Date.now(),
		});
	},
});

export const getDiagnoses = query({
	args: {
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		const limit = args.limit ?? 20;

		return await ctx.db
			.query("diagnoses")
			.withIndex("by_userId_createdAt", (q) => q.eq("userId", userId))
			.order("desc")
			.take(limit);
	},
});

export const getDiagnosis = query({
	args: {
		id: v.id("diagnoses"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		const diagnosis = await ctx.db.get(args.id);
		if (!diagnosis || diagnosis.userId !== userId) {
			return null;
		}

		return diagnosis;
	},
});

export const deleteDiagnosis = mutation({
	args: {
		id: v.id("diagnoses"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Unauthenticated");
		}

		const diagnosis = await ctx.db.get(args.id);
		if (!diagnosis || diagnosis.userId !== userId) {
			throw new Error("Diagnosis not found or access denied");
		}

		await ctx.db.delete(args.id);
		return { success: true };
	},
});
