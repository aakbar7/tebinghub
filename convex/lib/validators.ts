import { v } from "convex/values";

export const planStopValidator = v.object({
	id: v.string(),
	poiId: v.string(),
	visitDurationMinutes: v.number(),
});

export const durationValidator = v.union(v.literal("two-hours"), v.literal("half-day"), v.literal("full-day"));

export const localeValidator = v.union(v.literal("id"), v.literal("en"));

export const planTitleSourceValidator = v.union(v.literal("seed"), v.literal("user"), v.literal("ai"));
