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

// ============ Patient Management ============

export const createPatient = mutation({
	args: {
		cnp: v.string(),
		firstName: v.string(),
		lastName: v.string(),
		dateOfBirth: v.string(),
		sex: v.union(v.literal("male"), v.literal("female")),
		phone: v.optional(v.string()),
		email: v.optional(v.string()),
		address: v.optional(v.string()),
		bloodType: v.optional(v.string()),
		knownAllergies: v.optional(v.array(v.string())),
		chronicConditions: v.optional(v.array(v.string())),
		currentMedications: v.optional(v.array(v.string())),
		familyHistory: v.optional(v.array(v.string())),
		smokingStatus: v.optional(
			v.union(v.literal("never"), v.literal("former"), v.literal("current")),
		),
		alcoholConsumption: v.optional(
			v.union(v.literal("none"), v.literal("occasional"), v.literal("regular")),
		),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Unauthenticated");
		}

		// Check if patient with this CNP already exists
		const existing = await ctx.db
			.query("patients")
			.withIndex("by_cnp", (q) => q.eq("cnp", args.cnp))
			.unique();

		if (existing) {
			throw new Error("Patient with this CNP already exists");
		}

		const now = Date.now();
		return await ctx.db.insert("patients", {
			...args,
			createdBy: userId,
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const updatePatient = mutation({
	args: {
		id: v.id("patients"),
		firstName: v.optional(v.string()),
		lastName: v.optional(v.string()),
		dateOfBirth: v.optional(v.string()),
		sex: v.optional(v.union(v.literal("male"), v.literal("female"))),
		phone: v.optional(v.string()),
		email: v.optional(v.string()),
		address: v.optional(v.string()),
		bloodType: v.optional(v.string()),
		knownAllergies: v.optional(v.array(v.string())),
		chronicConditions: v.optional(v.array(v.string())),
		currentMedications: v.optional(v.array(v.string())),
		familyHistory: v.optional(v.array(v.string())),
		smokingStatus: v.optional(
			v.union(v.literal("never"), v.literal("former"), v.literal("current")),
		),
		alcoholConsumption: v.optional(
			v.union(v.literal("none"), v.literal("occasional"), v.literal("regular")),
		),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Unauthenticated");
		}

		const { id, ...updates } = args;
		const patient = await ctx.db.get(id);
		if (!patient) {
			throw new Error("Patient not found");
		}

		await ctx.db.patch(id, {
			...updates,
			updatedAt: Date.now(),
		});

		return id;
	},
});

export const getPatientByCnp = query({
	args: { cnp: v.string() },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		return await ctx.db
			.query("patients")
			.withIndex("by_cnp", (q) => q.eq("cnp", args.cnp))
			.unique();
	},
});

export const getPatient = query({
	args: { id: v.id("patients") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		return await ctx.db.get(args.id);
	},
});

export const searchPatients = query({
	args: {
		query: v.string(),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		const limit = args.limit ?? 20;
		const searchQuery = args.query.trim().toLowerCase();

		if (!searchQuery) {
			// Return recent patients if no search query
			return await ctx.db
				.query("patients")
				.withIndex("by_createdAt")
				.order("desc")
				.take(limit);
		}

		// Check if it looks like a CNP (13 digits)
		if (/^\d{1,13}$/.test(searchQuery)) {
			// Search by CNP prefix
			const patients = await ctx.db
				.query("patients")
				.withIndex("by_cnp")
				.filter((q) => q.gte(q.field("cnp"), searchQuery))
				.take(limit);

			return patients.filter((p) => p.cnp.startsWith(searchQuery));
		}

		// Search by name using the search index
		const results = await ctx.db
			.query("patients")
			.withSearchIndex("search_patients", (q) =>
				q.search("lastName", searchQuery),
			)
			.take(limit);

		return results;
	},
});

export const getRecentPatients = query({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		const limit = args.limit ?? 10;

		// Get recent patient views for this staff member
		const recentViews = await ctx.db
			.query("recentPatientViews")
			.withIndex("by_staffId_viewedAt", (q) => q.eq("staffId", userId))
			.order("desc")
			.take(limit);

		// Get the patient details
		const patients = await Promise.all(
			recentViews.map(async (view) => {
				const patient = await ctx.db.get(view.patientId);
				return patient ? { ...patient, viewedAt: view.viewedAt } : null;
			}),
		);

		return patients.filter((p): p is NonNullable<typeof p> => p !== null);
	},
});

export const recordPatientView = mutation({
	args: { patientId: v.id("patients") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Unauthenticated");
		}

		// Check if there's already a recent view entry
		const existing = await ctx.db
			.query("recentPatientViews")
			.withIndex("by_staffId", (q) => q.eq("staffId", userId))
			.filter((q) => q.eq(q.field("patientId"), args.patientId))
			.first();

		if (existing) {
			// Update the timestamp
			await ctx.db.patch(existing._id, { viewedAt: Date.now() });
		} else {
			// Create new entry
			await ctx.db.insert("recentPatientViews", {
				staffId: userId,
				patientId: args.patientId,
				viewedAt: Date.now(),
			});

			// Clean up old entries (keep only last 20)
			const allViews = await ctx.db
				.query("recentPatientViews")
				.withIndex("by_staffId_viewedAt", (q) => q.eq("staffId", userId))
				.order("desc")
				.collect();

			if (allViews.length > 20) {
				for (const view of allViews.slice(20)) {
					await ctx.db.delete(view._id);
				}
			}
		}
	},
});

// Calculate age from date of birth
export const calculateAge = (dateOfBirth: string): number => {
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
};
