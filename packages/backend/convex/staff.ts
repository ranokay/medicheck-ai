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

// ============ Medical Staff Management ============

export const createStaffProfile = mutation({
	args: {
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
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Unauthenticated");
		}

		// Check if profile already exists
		const existing = await ctx.db
			.query("medicalStaff")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();

		if (existing) {
			throw new Error("Staff profile already exists");
		}

		const now = Date.now();
		return await ctx.db.insert("medicalStaff", {
			userId,
			...args,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const updateStaffProfile = mutation({
	args: {
		firstName: v.optional(v.string()),
		lastName: v.optional(v.string()),
		specialization: v.optional(v.string()),
		licenseNumber: v.optional(v.string()),
		clinicId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Unauthenticated");
		}

		const existing = await ctx.db
			.query("medicalStaff")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();

		if (!existing) {
			throw new Error("Staff profile not found");
		}

		await ctx.db.patch(existing._id, {
			...args,
			updatedAt: Date.now(),
		});

		return existing._id;
	},
});

export const getMyStaffProfile = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		return await ctx.db
			.query("medicalStaff")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();
	},
});

export const hasStaffProfile = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return false;
		}

		const profile = await ctx.db
			.query("medicalStaff")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();

		return profile !== null;
	},
});

export const getDoctors = query({
	args: { clinicId: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		let query = ctx.db
			.query("medicalStaff")
			.withIndex("by_role", (q) => q.eq("role", "doctor"));

		if (args.clinicId) {
			query = query.filter((q) => q.eq(q.field("clinicId"), args.clinicId));
		}

		return await query.filter((q) => q.eq(q.field("isActive"), true)).collect();
	},
});
