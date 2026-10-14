import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import type { AiPlanOperation } from "./lib/aiOps";
import { applyPlanOperations } from "./lib/applyOps";
import {
	assertValidStops,
	clampPlanTitle,
	createStopId,
	DEFAULT_VISIT_MINUTES,
	generateEditToken,
	getSeedForDuration,
	hashEditKey,
	inferPlanTitleSource,
	isPlannerPoiId,
	MAX_PLAN_STOPS,
	type PlanStop,
} from "./lib/poi";
import { durationValidator, localeValidator } from "./lib/validators";
import { rateLimiter } from "./rateLimits";

type PublicPlan = Omit<Doc<"plans">, "editKeyHash"> & { id: Id<"plans"> };

const aiOperationValidator = v.union(
	v.object({
		type: v.literal("addStop"),
		poiId: v.string(),
		afterStopId: v.optional(v.string()),
	}),
	v.object({
		type: v.literal("removeStop"),
		stopId: v.string(),
	}),
	v.object({
		type: v.literal("reorder"),
		stopId: v.string(),
		afterStopId: v.optional(v.string()),
	}),
	v.object({
		type: v.literal("setDuration"),
		stopId: v.string(),
		visitDurationMinutes: v.number(),
	}),
);

function toPublicPlan(plan: Doc<"plans">): PublicPlan {
	const { editKeyHash: _editKeyHash, ...rest } = plan;
	return { ...rest, id: plan._id };
}

async function requireEditablePlan(
	ctx: { db: { get: (id: Id<"plans">) => Promise<Doc<"plans"> | null> } },
	args: { planId: Id<"plans">; editToken: string; expectedVersion: number },
) {
	const plan = await ctx.db.get(args.planId);
	if (!plan) {
		throw new ConvexError({ code: "NOT_FOUND", message: "Plan not found." });
	}

	const tokenHash = await hashEditKey(args.editToken);
	if (tokenHash !== plan.editKeyHash) {
		throw new ConvexError({ code: "FORBIDDEN", message: "Edit capability is invalid." });
	}

	if (plan.version !== args.expectedVersion) {
		throw new ConvexError({
			code: "VERSION_CONFLICT",
			message: "Plan changed. Refresh and try again.",
			version: plan.version,
		});
	}

	return plan;
}

function indexOfStop(stops: PlanStop[], stopId: string) {
	return stops.findIndex((stop) => stop.id === stopId);
}

export const getPlan = query({
	args: { planId: v.string() },
	handler: async (ctx, args) => {
		const planId = ctx.db.normalizeId("plans", args.planId);
		if (!planId) return null;
		const plan = await ctx.db.get(planId);
		if (!plan) return null;
		return toPublicPlan(plan);
	},
});

export const getPlanForAi = internalQuery({
	args: { planId: v.id("plans") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.planId);
	},
});

export const createPlan = mutation({
	args: {
		duration: durationValidator,
		locale: localeValidator,
		title: v.optional(v.string()),
		deviceKey: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const deviceKey = args.deviceKey?.trim() || "anonymous";
		const deviceLimit = await rateLimiter.limit(ctx, "createPlan", { key: deviceKey });
		if (!deviceLimit.ok) {
			throw new ConvexError({
				code: "RATE_LIMITED",
				message: "Too many plans created. Try again later.",
				retryAfter: deviceLimit.retryAfter,
			});
		}

		const globalLimit = await rateLimiter.limit(ctx, "createPlanGlobal");
		if (!globalLimit.ok) {
			throw new ConvexError({
				code: "RATE_LIMITED",
				message: "Plan creation is temporarily limited. Try again later.",
				retryAfter: globalLimit.retryAfter,
			});
		}

		const seed = getSeedForDuration(args.duration, args.locale);
		const stops: PlanStop[] = seed.stops.map((stop) => ({
			id: createStopId(),
			poiId: stop.poiId,
			visitDurationMinutes: stop.visitDurationMinutes,
		}));
		assertValidStops(stops);

		const editToken = generateEditToken();
		const editKeyHash = await hashEditKey(editToken);
		const now = Date.now();
		const customTitle = args.title?.trim();
		const title = clampPlanTitle(customTitle || seed.title);
		const titleSource = customTitle ? "user" : "seed";

		const planId = await ctx.db.insert("plans", {
			duration: args.duration,
			title,
			titleSource,
			locale: args.locale,
			stops,
			editKeyHash,
			version: 1,
			createdAt: now,
			updatedAt: now,
		});

		return { planId, editToken, version: 1 };
	},
});

export const updateTitle = mutation({
	args: {
		planId: v.id("plans"),
		editToken: v.string(),
		expectedVersion: v.number(),
		title: v.string(),
	},
	handler: async (ctx, args) => {
		const plan = await requireEditablePlan(ctx, args);
		await rateLimiter.limit(ctx, "editPlan", { key: String(args.planId), throws: true });

		const title = clampPlanTitle(args.title);
		if (!title) {
			throw new ConvexError({ code: "VALIDATION_ERROR", message: "Title cannot be empty." });
		}

		const version = plan.version + 1;
		const updatedAt = Date.now();
		await ctx.db.patch(plan._id, { title, titleSource: "user", version, updatedAt });
		return { version, updatedAt };
	},
});

export const addStop = mutation({
	args: {
		planId: v.id("plans"),
		editToken: v.string(),
		expectedVersion: v.number(),
		poiId: v.string(),
		afterStopId: v.optional(v.string()),
		visitDurationMinutes: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const plan = await requireEditablePlan(ctx, args);
		await rateLimiter.limit(ctx, "editPlan", { key: String(args.planId), throws: true });

		if (!isPlannerPoiId(args.poiId)) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: `POI is not allowed in collaborative plans: ${args.poiId}`,
			});
		}
		if (plan.stops.some((stop) => stop.poiId === args.poiId)) {
			throw new ConvexError({ code: "VALIDATION_ERROR", message: "Plan stops must use unique POI IDs." });
		}
		if (plan.stops.length >= MAX_PLAN_STOPS) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: `Plan cannot exceed ${MAX_PLAN_STOPS} stops.`,
			});
		}

		const inserted: PlanStop = {
			id: createStopId(),
			poiId: args.poiId,
			visitDurationMinutes: args.visitDurationMinutes ?? DEFAULT_VISIT_MINUTES,
		};

		let stops = [...plan.stops];
		if (args.afterStopId) {
			const afterIndex = indexOfStop(stops, args.afterStopId);
			if (afterIndex < 0) {
				throw new ConvexError({ code: "VALIDATION_ERROR", message: "afterStopId was not found." });
			}
			stops = [...stops.slice(0, afterIndex + 1), inserted, ...stops.slice(afterIndex + 1)];
		} else {
			stops = [...stops, inserted];
		}

		assertValidStops(stops);
		const version = plan.version + 1;
		const updatedAt = Date.now();
		await ctx.db.patch(plan._id, { stops, version, updatedAt });
		return { version, updatedAt, stopId: inserted.id };
	},
});

export const removeStop = mutation({
	args: {
		planId: v.id("plans"),
		editToken: v.string(),
		expectedVersion: v.number(),
		stopId: v.string(),
	},
	handler: async (ctx, args) => {
		const plan = await requireEditablePlan(ctx, args);
		await rateLimiter.limit(ctx, "editPlan", { key: String(args.planId), throws: true });

		if (plan.stops.length <= 1) {
			throw new ConvexError({ code: "VALIDATION_ERROR", message: "Plan must include at least one stop." });
		}
		if (indexOfStop(plan.stops, args.stopId) < 0) {
			throw new ConvexError({ code: "VALIDATION_ERROR", message: "stopId was not found." });
		}

		const stops = plan.stops.filter((stop) => stop.id !== args.stopId);
		assertValidStops(stops);
		const version = plan.version + 1;
		const updatedAt = Date.now();
		await ctx.db.patch(plan._id, { stops, version, updatedAt });
		return { version, updatedAt };
	},
});

export const reorderStop = mutation({
	args: {
		planId: v.id("plans"),
		editToken: v.string(),
		expectedVersion: v.number(),
		stopId: v.string(),
		afterStopId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const plan = await requireEditablePlan(ctx, args);
		await rateLimiter.limit(ctx, "editPlan", { key: String(args.planId), throws: true });

		const stops = [...plan.stops];
		const index = indexOfStop(stops, args.stopId);
		if (index < 0) {
			throw new ConvexError({ code: "VALIDATION_ERROR", message: "stopId was not found." });
		}
		const [moved] = stops.splice(index, 1);
		if (!moved) {
			throw new ConvexError({ code: "VALIDATION_ERROR", message: "stopId was not found." });
		}

		if (args.afterStopId === undefined) {
			stops.unshift(moved);
		} else {
			const afterIndex = indexOfStop(stops, args.afterStopId);
			if (afterIndex < 0) {
				throw new ConvexError({ code: "VALIDATION_ERROR", message: "afterStopId was not found." });
			}
			stops.splice(afterIndex + 1, 0, moved);
		}

		assertValidStops(stops);
		const version = plan.version + 1;
		const updatedAt = Date.now();
		await ctx.db.patch(plan._id, { stops, version, updatedAt });
		return { version, updatedAt };
	},
});

export const setStopDuration = mutation({
	args: {
		planId: v.id("plans"),
		editToken: v.string(),
		expectedVersion: v.number(),
		stopId: v.string(),
		visitDurationMinutes: v.number(),
	},
	handler: async (ctx, args) => {
		const plan = await requireEditablePlan(ctx, args);
		await rateLimiter.limit(ctx, "editPlan", { key: String(args.planId), throws: true });

		const index = indexOfStop(plan.stops, args.stopId);
		if (index < 0) {
			throw new ConvexError({ code: "VALIDATION_ERROR", message: "stopId was not found." });
		}

		const stops = plan.stops.map((stop, stopIndex) =>
			stopIndex === index ? { ...stop, visitDurationMinutes: args.visitDurationMinutes } : stop,
		);
		assertValidStops(stops);
		const version = plan.version + 1;
		const updatedAt = Date.now();
		await ctx.db.patch(plan._id, { stops, version, updatedAt });
		return { version, updatedAt };
	},
});

export const applyOperations = internalMutation({
	args: {
		planId: v.id("plans"),
		editToken: v.string(),
		expectedVersion: v.number(),
		operations: v.array(aiOperationValidator),
		title: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const plan = await requireEditablePlan(ctx, args);
		const operations = args.operations as AiPlanOperation[];
		const stops = applyPlanOperations(plan.stops, operations);
		const version = plan.version + 1;
		const updatedAt = Date.now();
		const patch: {
			stops: PlanStop[];
			version: number;
			updatedAt: number;
			title?: string;
			titleSource?: "ai";
		} = { stops, version, updatedAt };
		if (args.title !== undefined && inferPlanTitleSource(plan) !== "user") {
			const title = clampPlanTitle(args.title);
			if (title) {
				patch.title = title;
				patch.titleSource = "ai";
			}
		}
		await ctx.db.patch(plan._id, patch);
		const updated = await ctx.db.get(plan._id);
		if (!updated) {
			throw new ConvexError({ code: "NOT_FOUND", message: "Plan not found." });
		}
		return {
			plan: toPublicPlan(updated),
			operations,
		};
	},
});
