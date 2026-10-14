import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";
import { defineApp } from "convex/server";
import { v } from "convex/values";

const app = defineApp({
	env: {
		OPENROUTER_API_KEY: v.optional(v.string()),
		OPENROUTER_MODEL: v.optional(v.string()),
	},
});
app.use(rateLimiter);

export default app;
