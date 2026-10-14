import { HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
	createPlan: { kind: "token bucket", rate: 10, period: HOUR, capacity: 5 },
	createPlanGlobal: { kind: "fixed window", rate: 120, period: HOUR },
	editPlan: { kind: "token bucket", rate: 60, period: MINUTE, capacity: 20 },
	aiDevice: { kind: "token bucket", rate: 20, period: HOUR, capacity: 5 },
	aiPlan: { kind: "token bucket", rate: 12, period: HOUR, capacity: 4 },
	aiGlobal: { kind: "fixed window", rate: 120, period: HOUR },
});
