import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { durationValidator, localeValidator, planStopValidator, planTitleSourceValidator } from "./lib/validators";

export default defineSchema({
	plans: defineTable({
		duration: durationValidator,
		title: v.string(),
		titleSource: v.optional(planTitleSourceValidator),
		locale: localeValidator,
		stops: v.array(planStopValidator),
		editKeyHash: v.string(),
		version: v.number(),
		createdAt: v.number(),
		updatedAt: v.number(),
	}),
});
