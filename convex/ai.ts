import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, env } from "./_generated/server";
import { AiAppError, type AiErrorCode } from "./lib/aiErrors";
import {
	type AiPlanOperation,
	clampAiMessage,
	parseAndValidateAiOperations,
	retryHintForModelFailure,
} from "./lib/aiOps";
import { chatForPlanOps, DEFAULT_OPENROUTER_MODEL } from "./lib/openrouter";
import { hashEditKey, inferPlanTitleSource, PLANNER_POI_IDS, type PlanStop, type PlanTitleSource } from "./lib/poi";
import { rateLimiter } from "./rateLimits";

const allowlist = new Set<string>(PLANNER_POI_IDS);

type ReviseResult = {
	plan: {
		id: Id<"plans">;
		duration: "two-hours" | "half-day" | "full-day";
		title: string;
		titleSource?: PlanTitleSource;
		locale: "id" | "en";
		stops: PlanStop[];
		version: number;
		createdAt: number;
		updatedAt: number;
	};
	operations: AiPlanOperation[];
};

function throwConvex(code: AiErrorCode, message: string, extra?: { retryAfter?: number; version?: number }): never {
	throw new ConvexError({
		code,
		message,
		...(extra?.retryAfter !== undefined ? { retryAfter: extra.retryAfter } : {}),
		...(extra?.version !== undefined ? { version: extra.version } : {}),
	});
}

function readOpenRouterConfig() {
	const apiKey = env.OPENROUTER_API_KEY ?? process.env.OPENROUTER_API_KEY;
	if (!apiKey) {
		throwConvex("CONFIGURATION_ERROR", "OPENROUTER_API_KEY is not configured.");
	}
	const model = env.OPENROUTER_MODEL ?? process.env.OPENROUTER_MODEL ?? DEFAULT_OPENROUTER_MODEL;
	return { apiKey, model };
}

export const reviseWithAi = action({
	args: {
		planId: v.id("plans"),
		editToken: v.string(),
		expectedVersion: v.number(),
		message: v.string(),
		deviceKey: v.optional(v.string()),
	},
	handler: async (ctx, args): Promise<ReviseResult> => {
		const message = clampAiMessage(args.message);
		if (!message) {
			throwConvex("VALIDATION_ERROR", "Prompt cannot be empty.");
		}

		// Validate plan capability before rate limits / provider budget.
		const plan = await ctx.runQuery(internal.plans.getPlanForAi, { planId: args.planId });
		if (!plan) {
			throwConvex("NOT_FOUND", "Plan not found.");
		}

		const editKeyHash = await hashEditKey(args.editToken);
		if (editKeyHash !== plan.editKeyHash) {
			throwConvex("FORBIDDEN", "Edit capability is invalid.");
		}
		if (plan.version !== args.expectedVersion) {
			throwConvex("VERSION_CONFLICT", "Plan changed. Refresh and try again.", { version: plan.version });
		}

		const deviceKey = args.deviceKey?.trim() || "anonymous";
		const deviceLimit = await rateLimiter.limit(ctx, "aiDevice", { key: deviceKey });
		if (!deviceLimit.ok) {
			throwConvex("RATE_LIMITED", "AI budget for this device is exhausted. Try again later.", {
				retryAfter: deviceLimit.retryAfter,
			});
		}

		const planLimit = await rateLimiter.limit(ctx, "aiPlan", { key: String(args.planId) });
		if (!planLimit.ok) {
			throwConvex("RATE_LIMITED", "AI budget for this plan is exhausted. Try again later.", {
				retryAfter: planLimit.retryAfter,
			});
		}

		const globalLimit = await rateLimiter.limit(ctx, "aiGlobal");
		if (!globalLimit.ok) {
			throwConvex("RATE_LIMITED", "AI is temporarily limited. Try again later.", {
				retryAfter: globalLimit.retryAfter,
			});
		}

		const { apiKey, model } = readOpenRouterConfig();
		const started = Date.now();

		let completion: Awaited<ReturnType<typeof chatForPlanOps>>;
		try {
			completion = await chatForPlanOps({
				apiKey,
				model,
				userMessage: message,
				plan: {
					title: plan.title,
					duration: plan.duration,
					locale: plan.locale,
					stops: plan.stops,
				},
				validateContent: (content) => {
					const validated = parseAndValidateAiOperations(content, plan.stops, allowlist);
					if (!validated.ok) {
						const code = validated.code === "MODEL_LANGUAGE_DRIFT" ? "MODEL_LANGUAGE_DRIFT" : "MODEL_RESPONSE_INVALID";
						return {
							ok: false as const,
							code,
							message: validated.reason,
							retryHint: retryHintForModelFailure(validated.reason),
						};
					}
					return { ok: true as const };
				},
				log: (event) => {
					console.log(
						JSON.stringify({
							...event,
							event: event.event ?? "ai.revise",
							planId: String(args.planId),
						}),
					);
				},
			});
		} catch (error) {
			if (error instanceof AiAppError) {
				console.log(
					JSON.stringify({
						event: "ai.revise",
						model,
						latencyMs: Date.now() - started,
						outcome: error.code,
						operationCount: 0,
					}),
				);
				throwConvex(error.code, error.message);
			}
			console.log(
				JSON.stringify({
					event: "ai.revise",
					model,
					latencyMs: Date.now() - started,
					outcome: "PROVIDER_UNAVAILABLE",
					operationCount: 0,
				}),
			);
			throwConvex("PROVIDER_UNAVAILABLE", "The AI provider is unavailable.");
		}

		const validated = parseAndValidateAiOperations(completion.content, plan.stops, allowlist);
		if (!validated.ok) {
			console.log(
				JSON.stringify({
					event: "ai.revise",
					model: completion.model,
					provider: completion.provider,
					attempt: completion.attempts,
					latencyMs: completion.latencyMs,
					outcome: validated.code ?? "MODEL_RESPONSE_INVALID",
					operationCount: 0,
					titleChanged: false,
				}),
			);
			throwConvex(validated.code ?? "MODEL_RESPONSE_INVALID", validated.reason);
		}

		const titleSource = inferPlanTitleSource(plan);
		const titleToApply =
			titleSource !== "user" && validated.title && validated.title !== plan.title ? validated.title : undefined;
		const titleChanged = Boolean(titleToApply);

		if (validated.operations.length === 0 && !titleToApply) {
			console.log(
				JSON.stringify({
					event: "ai.revise",
					model: completion.model,
					provider: completion.provider,
					attempt: completion.attempts,
					latencyMs: completion.latencyMs,
					outcome: "NO_APPLICABLE_CHANGE",
					operationCount: 0,
					titleChanged: false,
					usageTotalTokens: completion.usage?.totalTokens,
				}),
			);
			throwConvex("NO_APPLICABLE_CHANGE", "No safe change could be applied from the current catalog.");
		}

		const applied = await ctx.runMutation(internal.plans.applyOperations, {
			planId: args.planId,
			editToken: args.editToken,
			expectedVersion: args.expectedVersion,
			operations: validated.operations,
			...(titleToApply ? { title: titleToApply } : {}),
		});

		console.log(
			JSON.stringify({
				event: "ai.revise",
				model: completion.model,
				provider: completion.provider,
				attempt: completion.attempts,
				latencyMs: completion.latencyMs,
				outcome: "applied",
				operationCount: validated.operations.length,
				titleChanged,
				usageTotalTokens: completion.usage?.totalTokens,
			}),
		);

		return applied;
	},
});
