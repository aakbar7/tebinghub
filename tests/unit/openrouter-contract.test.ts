import { describe, expect, it, vi } from "vitest";
import {
	buildOpenRouterRequestBody,
	buildOperationsSchema,
	chatForPlanOps,
	DEFAULT_OPENROUTER_MODEL,
	DEFAULT_OPENROUTER_PROVIDER,
	OPENROUTER_MAX_ATTEMPTS,
	OPENROUTER_MAX_TOKENS,
	OPENROUTER_REASONING,
	STATIC_SYSTEM_PROMPT,
} from "../../convex/lib/openrouter";
import { PLANNER_POI_IDS } from "../../convex/lib/poi";

const plan = {
	title: "Dua jam, tiga rasa kota",
	duration: "two-hours",
	locale: "id",
	stops: [
		{ id: "stop_a", poiId: "tugu-13-desember", visitDurationMinutes: 20 },
		{ id: "stop_b", poiId: "lemang-batok", visitDurationMinutes: 30 },
	],
};

function schemaVariants(body: ReturnType<typeof buildOpenRouterRequestBody>) {
	const schema = body.response_format.json_schema.schema as {
		properties: {
			operations: {
				items?: { oneOf?: Array<{ properties: Record<string, { const?: string; enum?: unknown[] }> }> };
			};
		};
	};
	return schema.properties.operations.items?.oneOf ?? [];
}

describe("OpenRouter request contract", () => {
	it("builds a strict structured-output request with low excluded reasoning", () => {
		const body = buildOpenRouterRequestBody({
			model: DEFAULT_OPENROUTER_MODEL,
			userMessage: "jadi lemang dan teduh",
			plan,
		});

		expect(body.stream).toBe(false);
		expect(body.max_tokens).toBe(OPENROUTER_MAX_TOKENS);
		expect(body.reasoning).toEqual({ ...OPENROUTER_REASONING });
		expect(body.reasoning.effort).not.toBe("none");
		expect(body.provider).toEqual({ ...DEFAULT_OPENROUTER_PROVIDER });
		expect(body.provider.order).toEqual(["z-ai/fp8", "deepinfra/fp8", "novita/fp8"]);
		expect(body.provider.zdr).toBe(true);
		expect(body.response_format).toMatchObject({
			type: "json_schema",
			json_schema: { strict: true, name: "tebinghub_plan_operations" },
		});
		const schema = body.response_format.json_schema.schema as {
			required: string[];
			additionalProperties: boolean;
			properties: { title?: { type: string; minLength: number; maxLength: number } };
		};
		expect(schema.required).toEqual(["operations", "title"]);
		expect(schema.additionalProperties).toBe(false);
		expect(schema.properties.title).toEqual({ type: "string", minLength: 1, maxLength: 80 });
		expect(body.messages[0]).toEqual({ role: "system", content: STATIC_SYSTEM_PROMPT });
		expect(body.messages[0]?.content).not.toContain(plan.title);
		expect(String(body.messages[1]?.content)).toContain("PLAN_CONTEXT_JSON");
		expect(String(body.messages[1]?.content)).toContain("USER_REQUEST");
		expect(String(body.messages[0]?.content)).toContain("Title must reflect USER_REQUEST");
		expect(String(body.messages[0]?.content)).toContain("Always return title plus operations");
		expect(String(body.messages[1]?.content)).toContain('"lat":');
		expect(String(body.messages[1]?.content)).toContain('"lng":');
		expect(String(body.messages[0]?.content)).toContain("keep added stops near the current cluster");
		expect(body).not.toHaveProperty("tools");
		expect(body).not.toHaveProperty("tool_choice");
	});

	it("scopes stopId and addStop enums to the current plan", () => {
		const body = buildOpenRouterRequestBody({
			model: DEFAULT_OPENROUTER_MODEL,
			userMessage: "tambah taman",
			plan,
		});
		const variants = schemaVariants(body);
		const byType = Object.fromEntries(variants.map((variant) => [variant.properties.type.const, variant.properties]));

		expect(byType.addStop?.poiId.enum).not.toContain("tugu-13-desember");
		expect(byType.addStop?.poiId.enum).not.toContain("lemang-batok");
		expect(byType.addStop?.poiId.enum).toContain("taman-kota");
		expect(byType.removeStop?.stopId.enum).toEqual(["stop_a", "stop_b"]);
		expect(byType.reorder?.stopId.enum).toEqual(["stop_a", "stop_b"]);
		expect(byType.setDuration?.stopId.enum).toEqual(["stop_a", "stop_b"]);
		expect(byType.addStop?.afterStopId.enum).toEqual(["stop_a", "stop_b", null]);
	});

	it("omits impossible variants without emitting empty enums", () => {
		const singleStopPlan = {
			...plan,
			stops: [{ id: "only", poiId: "tugu-13-desember", visitDurationMinutes: 20 }],
		};
		const schema = buildOperationsSchema(singleStopPlan) as {
			properties: { operations: { items?: { oneOf?: Array<{ properties: { type: { const: string } } }> } } };
		};
		const types = (schema.properties.operations.items?.oneOf ?? []).map((variant) => variant.properties.type.const);
		expect(types).toContain("addStop");
		expect(types).toContain("setDuration");
		expect(types).toContain("reorder");
		expect(types).not.toContain("removeStop");

		const fullPlan = {
			...plan,
			stops: PLANNER_POI_IDS.map((poiId, index) => ({
				id: `stop_${index}`,
				poiId,
				visitDurationMinutes: 20,
			})),
		};
		const fullSchema = buildOperationsSchema(fullPlan) as {
			properties: { operations: { items?: { oneOf?: Array<{ properties: { type: { const: string } } }> } } };
		};
		const fullTypes = (fullSchema.properties.operations.items?.oneOf ?? []).map(
			(variant) => variant.properties.type.const,
		);
		expect(fullTypes).not.toContain("addStop");
		expect(fullTypes).toContain("removeStop");
		expect(JSON.stringify(fullSchema)).not.toContain('"enum":[]');
	});

	it("retries once on HTTP 429 and never embeds the API key in the body", async () => {
		const fetchImpl = vi
			.fn()
			.mockResolvedValueOnce(new Response("rate", { status: 429 }))
			.mockResolvedValueOnce(
				Response.json({
					provider: "test-provider",
					choices: [{ message: { content: JSON.stringify({ operations: [] }) } }],
					usage: { total_tokens: 12 },
				}),
			);

		const result = await chatForPlanOps({
			apiKey: "test-secret-key",
			model: DEFAULT_OPENROUTER_MODEL,
			userMessage: "test",
			plan,
			fetchImpl: fetchImpl as unknown as typeof fetch,
		});

		expect(fetchImpl).toHaveBeenCalledTimes(OPENROUTER_MAX_ATTEMPTS);
		const firstBody = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
		expect(JSON.stringify(firstBody)).not.toContain("test-secret-key");
		expect(firstBody.response_format.type).toBe("json_schema");
		expect(result.content).toContain("operations");
	});

	it("maps 504 to PROVIDER_TIMEOUT and 503 to PROVIDER_UNAVAILABLE", async () => {
		await expect(
			chatForPlanOps({
				apiKey: "test-secret-key",
				model: DEFAULT_OPENROUTER_MODEL,
				userMessage: "test",
				plan,
				fetchImpl: vi.fn(async () => new Response("gateway timeout", { status: 504 })) as unknown as typeof fetch,
			}),
		).rejects.toMatchObject({ code: "PROVIDER_TIMEOUT", message: expect.not.stringContaining("gateway timeout") });

		await expect(
			chatForPlanOps({
				apiKey: "test-secret-key",
				model: DEFAULT_OPENROUTER_MODEL,
				userMessage: "test",
				plan,
				fetchImpl: vi.fn(
					async () => new Response("upstream boom secret-details", { status: 503 }),
				) as unknown as typeof fetch,
			}),
		).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE", message: expect.not.stringContaining("secret-details") });
	});

	it("does not retry HTTP 400 from OpenRouter", async () => {
		const fetchImpl = vi.fn(async () => new Response("Reasoning is mandatory", { status: 400 }));

		await expect(
			chatForPlanOps({
				apiKey: "test-secret-key",
				model: DEFAULT_OPENROUTER_MODEL,
				userMessage: "test",
				plan,
				fetchImpl: fetchImpl as unknown as typeof fetch,
			}),
		).rejects.toMatchObject({
			code: "PROVIDER_UNAVAILABLE",
			message: expect.not.stringContaining("Reasoning is mandatory"),
		});

		expect(fetchImpl).toHaveBeenCalledTimes(1);
	});

	it("retries once on semantic model failure then stops without success", async () => {
		const fetchImpl = vi.fn(async () =>
			Response.json({
				choices: [
					{
						message: {
							content: JSON.stringify({
								operations: [{ type: "removeStop", stopId: "invented-stop" }],
							}),
						},
					},
				],
			}),
		);

		await expect(
			chatForPlanOps({
				apiKey: "test-secret-key",
				model: DEFAULT_OPENROUTER_MODEL,
				userMessage: "test",
				plan,
				fetchImpl: fetchImpl as unknown as typeof fetch,
				validateContent: () => ({
					ok: false,
					code: "MODEL_RESPONSE_INVALID",
					message: "stopId was not found.",
					retryHint: "VALID_PLAN_REFERENCES",
				}),
			}),
		).rejects.toMatchObject({ code: "MODEL_RESPONSE_INVALID" });

		expect(fetchImpl).toHaveBeenCalledTimes(2);
		const calls = fetchImpl.mock.calls as unknown as Array<[string, { body?: string }]>;
		const firstBody = JSON.parse(String(calls[0]?.[1]?.body));
		const secondBody = JSON.parse(String(calls[1]?.[1]?.body));
		expect(firstBody.messages).toHaveLength(2);
		expect(secondBody.messages).toHaveLength(3);
		expect(String(secondBody.messages[2]?.content)).toContain("APPLICATION_VALIDATION_FEEDBACK");
		expect(JSON.stringify(secondBody)).not.toContain("invented-stop");
		expect(JSON.stringify(secondBody)).not.toContain("test-secret-key");
	});

	it("sends RETAIN_AT_LEAST_ONE_STOP corrective feedback after multi-remove using real validator", async () => {
		const { parseAndValidateAiOperations, retryHintForModelFailure } = await import("../../convex/lib/aiOps");
		const allow = new Set(["tugu-13-desember", "lemang-batok", "taman-kota", "kedai-kopi-aghara"]);
		const stops = [
			{ id: "stop_a", poiId: "tugu-13-desember", visitDurationMinutes: 20 },
			{ id: "stop_b", poiId: "lemang-batok", visitDurationMinutes: 30 },
			{ id: "stop_c", poiId: "kedai-kopi-aghara", visitDurationMinutes: 40 },
		];
		const bad = JSON.stringify({
			operations: [
				{ type: "removeStop", stopId: "stop_a" },
				{ type: "removeStop", stopId: "stop_b" },
				{ type: "removeStop", stopId: "stop_c" },
			],
		});
		const good = JSON.stringify({
			operations: [
				{ type: "setDuration", stopId: "stop_a", visitDurationMinutes: 20 },
				{ type: "setDuration", stopId: "stop_b", visitDurationMinutes: 20 },
				{ type: "setDuration", stopId: "stop_c", visitDurationMinutes: 20 },
			],
		});

		const fetchImpl = vi
			.fn()
			.mockResolvedValueOnce(Response.json({ choices: [{ message: { content: bad } }] }))
			.mockResolvedValueOnce(Response.json({ choices: [{ message: { content: good } }] }));

		const result = await chatForPlanOps({
			apiKey: "test-secret-key",
			model: DEFAULT_OPENROUTER_MODEL,
			userMessage: "Move the park to the beginning and make every stop 20 minutes.",
			plan: { ...plan, stops },
			fetchImpl: fetchImpl as unknown as typeof fetch,
			validateContent: (content) => {
				const validated = parseAndValidateAiOperations(content, stops, allow);
				if (!validated.ok) {
					return {
						ok: false,
						code: "MODEL_RESPONSE_INVALID",
						message: validated.reason,
						retryHint: retryHintForModelFailure(validated.reason),
					};
				}
				return { ok: true };
			},
		});

		expect(fetchImpl).toHaveBeenCalledTimes(2);
		const calls = fetchImpl.mock.calls as unknown as Array<[string, { body?: string }]>;
		const secondBody = JSON.parse(String(calls[1]?.[1]?.body));
		expect(String(secondBody.messages[2]?.content)).toContain("retain at least one stop");
		expect(JSON.stringify(secondBody)).not.toContain(bad);
		expect(result.content).toBe(good);
		expect(result.attempts).toBe(2);
	});
});
