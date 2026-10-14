/// <reference types="vite/client" />

import { register as registerRateLimiter } from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

function createTest() {
	const t = convexTest(schema, modules);
	registerRateLimiter(t);
	return t;
}

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("AI co-pilot", () => {
	it("applies validated operations through the internal mutation", async () => {
		const t = createTest();
		const created = await t.mutation(api.plans.createPlan, {
			duration: "two-hours",
			locale: "id",
			deviceKey: "ai-device-1",
		});

		const applied = await t.mutation(internal.plans.applyOperations, {
			planId: created.planId,
			editToken: created.editToken,
			expectedVersion: 1,
			operations: [{ type: "addStop", poiId: "taman-kota" }],
		});

		expect(applied.plan.version).toBe(2);
		expect(applied.plan.stops.map((stop) => stop.poiId)).toContain("taman-kota");
		expect(applied.operations).toHaveLength(1);
	});

	it("rejects historical POIs before writing", async () => {
		const t = createTest();
		const created = await t.mutation(api.plans.createPlan, {
			duration: "two-hours",
			locale: "id",
			deviceKey: "ai-device-2",
		});

		await expect(
			t.mutation(internal.plans.applyOperations, {
				planId: created.planId,
				editToken: created.editToken,
				expectedVersion: 1,
				operations: [{ type: "addStop", poiId: "istana-negeri-padang" }],
			}),
		).rejects.toThrow(/collaborative plans/i);
	});

	it("returns VERSION_CONFLICT when the expected version is stale", async () => {
		const t = createTest();
		const created = await t.mutation(api.plans.createPlan, {
			duration: "two-hours",
			locale: "en",
			deviceKey: "ai-device-3",
		});

		await t.mutation(internal.plans.applyOperations, {
			planId: created.planId,
			editToken: created.editToken,
			expectedVersion: 1,
			operations: [{ type: "addStop", poiId: "skuy-coffee" }],
		});

		await expect(
			t.mutation(internal.plans.applyOperations, {
				planId: created.planId,
				editToken: created.editToken,
				expectedVersion: 1,
				operations: [{ type: "addStop", poiId: "taman-kota" }],
			}),
		).rejects.toThrow(/VERSION_CONFLICT|changed/i);
	});

	it("revises a plan through OpenRouter when fetch is stubbed", async () => {
		const t = createTest();
		const created = await t.mutation(api.plans.createPlan, {
			duration: "two-hours",
			locale: "id",
			deviceKey: "ai-device-4",
		});

		vi.stubEnv("OPENROUTER_API_KEY", "test-key");
		vi.stubEnv("OPENROUTER_MODEL", "z-ai/glm-5.3-flash");
		const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
			const body = JSON.parse(String(init?.body));
			expect(body.response_format.type).toBe("json_schema");
			expect(body.provider.require_parameters).toBe(true);
			expect(body.reasoning.effort).toBe("low");
			expect(body.reasoning.exclude).toBe(true);
			expect(body.max_tokens).toBe(384);
			expect(JSON.stringify(body)).not.toContain("test-key");
			expect(JSON.stringify(body)).not.toContain(created.editToken);
			return Response.json({
				provider: "unit-test",
				choices: [
					{
						message: {
							content: JSON.stringify({
								operations: [{ type: "addStop", poiId: "taman-kota", afterStopId: null }],
							}),
						},
					},
				],
			});
		});
		vi.stubGlobal("fetch", fetchMock);

		const result = await t.action(api.ai.reviseWithAi, {
			planId: created.planId,
			editToken: created.editToken,
			expectedVersion: 1,
			message: "Tambahkan taman untuk keluarga",
			deviceKey: "ai-device-4",
		});

		expect(result.plan.stops.map((stop) => stop.poiId)).toContain("taman-kota");
		expect(result.operations[0]).toEqual({ type: "addStop", poiId: "taman-kota" });
		expect(result.plan.title).toBe("Dua jam, tiga rasa kota");
		expect(result.plan.titleSource).toBe("seed");
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("returns NO_APPLICABLE_CHANGE without bumping version for empty operations", async () => {
		const t = createTest();
		const created = await t.mutation(api.plans.createPlan, {
			duration: "two-hours",
			locale: "id",
			deviceKey: "ai-device-empty",
		});

		vi.stubEnv("OPENROUTER_API_KEY", "test-key");
		vi.stubEnv("OPENROUTER_MODEL", "z-ai/glm-5.3-flash");
		vi.stubGlobal(
			"fetch",
			vi.fn(async () =>
				Response.json({
					choices: [{ message: { content: JSON.stringify({ operations: [] }) } }],
				}),
			),
		);

		await expect(
			t.action(api.ai.reviseWithAi, {
				planId: created.planId,
				editToken: created.editToken,
				expectedVersion: 1,
				message: "Tambahkan istana yang tidak ada",
				deviceKey: "ai-device-empty",
			}),
		).rejects.toThrow(/NO_APPLICABLE_CHANGE|No safe change/i);

		const plan = await t.query(api.plans.getPlan, { planId: created.planId });
		expect(plan?.version).toBe(1);
	});

	it("applies a model title when operations also succeed", async () => {
		const t = createTest();
		const created = await t.mutation(api.plans.createPlan, {
			duration: "two-hours",
			locale: "id",
			deviceKey: "ai-device-title",
		});

		vi.stubEnv("OPENROUTER_API_KEY", "test-key");
		vi.stubEnv("OPENROUTER_MODEL", "z-ai/glm-5.3-flash");
		vi.stubGlobal(
			"fetch",
			vi.fn(async () =>
				Response.json({
					choices: [
						{
							message: {
								content: JSON.stringify({
									operations: [{ type: "addStop", poiId: "taman-kota", afterStopId: null }],
									title: "Taman keluarga",
								}),
							},
						},
					],
				}),
			),
		);

		const result = await t.action(api.ai.reviseWithAi, {
			planId: created.planId,
			editToken: created.editToken,
			expectedVersion: 1,
			message: "Tambahkan taman untuk keluarga",
			deviceKey: "ai-device-title",
		});

		expect(result.plan.stops.map((stop) => stop.poiId)).toContain("taman-kota");
		expect(result.plan.title).toBe("Taman keluarga");
		expect(result.plan.titleSource).toBe("ai");
		expect(result.plan.version).toBe(2);
	});

	it("keeps a user-saved title when AI returns a different one", async () => {
		const t = createTest();
		const created = await t.mutation(api.plans.createPlan, {
			duration: "two-hours",
			locale: "id",
			deviceKey: "ai-device-user-title",
		});
		await t.mutation(api.plans.updateTitle, {
			planId: created.planId,
			editToken: created.editToken,
			expectedVersion: 1,
			title: "Judul saya",
		});

		vi.stubEnv("OPENROUTER_API_KEY", "test-key");
		vi.stubEnv("OPENROUTER_MODEL", "z-ai/glm-5.3-flash");
		vi.stubGlobal(
			"fetch",
			vi.fn(async () =>
				Response.json({
					choices: [
						{
							message: {
								content: JSON.stringify({
									operations: [{ type: "addStop", poiId: "taman-kota", afterStopId: null }],
									title: "Judul AI",
								}),
							},
						},
					],
				}),
			),
		);

		const result = await t.action(api.ai.reviseWithAi, {
			planId: created.planId,
			editToken: created.editToken,
			expectedVersion: 2,
			message: "Tambahkan taman",
			deviceKey: "ai-device-user-title",
		});

		expect(result.plan.stops.map((stop) => stop.poiId)).toContain("taman-kota");
		expect(result.plan.title).toBe("Judul saya");
		expect(result.plan.titleSource).toBe("user");
		expect(result.plan.version).toBe(3);
	});

	it("applies a title-only revise and bumps version", async () => {
		const t = createTest();
		const created = await t.mutation(api.plans.createPlan, {
			duration: "two-hours",
			locale: "id",
			deviceKey: "ai-device-title-only",
		});
		const before = await t.query(api.plans.getPlan, { planId: created.planId });

		vi.stubEnv("OPENROUTER_API_KEY", "test-key");
		vi.stubEnv("OPENROUTER_MODEL", "z-ai/glm-5.3-flash");
		vi.stubGlobal(
			"fetch",
			vi.fn(async () =>
				Response.json({
					choices: [
						{
							message: {
								content: JSON.stringify({
									operations: [],
									title: "Kopi dan lemang",
								}),
							},
						},
					],
				}),
			),
		);

		const result = await t.action(api.ai.reviseWithAi, {
			planId: created.planId,
			editToken: created.editToken,
			expectedVersion: 1,
			message: "Fokus kopi dan lemang",
			deviceKey: "ai-device-title-only",
		});

		expect(result.plan.title).toBe("Kopi dan lemang");
		expect(result.plan.titleSource).toBe("ai");
		expect(result.plan.version).toBe(2);
		expect(result.operations).toEqual([]);
		expect(result.plan.stops.map((stop) => stop.poiId)).toEqual(before?.stops.map((stop) => stop.poiId));
	});

	it("returns NO_APPLICABLE_CHANGE when empty operations repeat the current title", async () => {
		const t = createTest();
		const created = await t.mutation(api.plans.createPlan, {
			duration: "two-hours",
			locale: "id",
			deviceKey: "ai-device-same-title",
		});

		vi.stubEnv("OPENROUTER_API_KEY", "test-key");
		vi.stubEnv("OPENROUTER_MODEL", "z-ai/glm-5.3-flash");
		vi.stubGlobal(
			"fetch",
			vi.fn(async () =>
				Response.json({
					choices: [
						{
							message: {
								content: JSON.stringify({
									operations: [],
									title: "Dua jam, tiga rasa kota",
								}),
							},
						},
					],
				}),
			),
		);

		await expect(
			t.action(api.ai.reviseWithAi, {
				planId: created.planId,
				editToken: created.editToken,
				expectedVersion: 1,
				message: "Tidak perlu diubah",
				deviceKey: "ai-device-same-title",
			}),
		).rejects.toThrow(/NO_APPLICABLE_CHANGE|No safe change/i);

		const plan = await t.query(api.plans.getPlan, { planId: created.planId });
		expect(plan?.version).toBe(1);
		expect(plan?.title).toBe("Dua jam, tiga rasa kota");
	});

	it("rejects Han drift and does not apply mutations", async () => {
		const t = createTest();
		const created = await t.mutation(api.plans.createPlan, {
			duration: "two-hours",
			locale: "id",
			deviceKey: "ai-device-han",
		});

		vi.stubEnv("OPENROUTER_API_KEY", "test-key");
		vi.stubEnv("OPENROUTER_MODEL", "z-ai/glm-5.3-flash");
		vi.stubGlobal(
			"fetch",
			vi.fn(async () =>
				Response.json({
					choices: [{ message: { content: '{"operations":[{"type":"addStop","poiId":"taman-kota","note":"你好"}]}' } }],
				}),
			),
		);

		await expect(
			t.action(api.ai.reviseWithAi, {
				planId: created.planId,
				editToken: created.editToken,
				expectedVersion: 1,
				message: "taman",
				deviceKey: "ai-device-han",
			}),
		).rejects.toThrow(/MODEL_LANGUAGE_DRIFT|Han/i);

		const plan = await t.query(api.plans.getPlan, { planId: created.planId });
		expect(plan?.version).toBe(1);
	});

	it("does not call OpenRouter for FORBIDDEN or VERSION_CONFLICT", async () => {
		const t = createTest();
		const created = await t.mutation(api.plans.createPlan, {
			duration: "two-hours",
			locale: "id",
			deviceKey: "ai-device-guard",
		});

		vi.stubEnv("OPENROUTER_API_KEY", "test-key");
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);

		await expect(
			t.action(api.ai.reviseWithAi, {
				planId: created.planId,
				editToken: "wrong-token",
				expectedVersion: 1,
				message: "taman",
				deviceKey: "ai-device-guard",
			}),
		).rejects.toThrow(/FORBIDDEN|invalid/i);

		await t.mutation(internal.plans.applyOperations, {
			planId: created.planId,
			editToken: created.editToken,
			expectedVersion: 1,
			operations: [{ type: "addStop", poiId: "taman-kota" }],
		});

		await expect(
			t.action(api.ai.reviseWithAi, {
				planId: created.planId,
				editToken: created.editToken,
				expectedVersion: 1,
				message: "taman",
				deviceKey: "ai-device-guard-2",
			}),
		).rejects.toThrow(/VERSION_CONFLICT|changed/i);

		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("retries once on invalid structured responses then fails", async () => {
		const t = createTest();
		const created = await t.mutation(api.plans.createPlan, {
			duration: "two-hours",
			locale: "id",
			deviceKey: "ai-device-retry",
		});

		vi.stubEnv("OPENROUTER_API_KEY", "test-key");
		vi.stubEnv("OPENROUTER_MODEL", "z-ai/glm-5.3-flash");
		const fetchMock = vi.fn(async () =>
			Response.json({
				choices: [{ message: { content: "not-json" } }],
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		await expect(
			t.action(api.ai.reviseWithAi, {
				planId: created.planId,
				editToken: created.editToken,
				expectedVersion: 1,
				message: "taman",
				deviceKey: "ai-device-retry",
			}),
		).rejects.toThrow(/MODEL_RESPONSE_INVALID|invalid JSON/i);

		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("retries once on semantic model failure and does not mutate", async () => {
		const t = createTest();
		const created = await t.mutation(api.plans.createPlan, {
			duration: "two-hours",
			locale: "id",
			deviceKey: "ai-device-semantic",
		});

		vi.stubEnv("OPENROUTER_API_KEY", "test-key");
		vi.stubEnv("OPENROUTER_MODEL", "z-ai/glm-5.3-flash");
		const fetchMock = vi.fn(async () =>
			Response.json({
				choices: [
					{
						message: {
							content: JSON.stringify({
								operations: [{ type: "removeStop", stopId: "not-a-real-stop" }],
							}),
						},
					},
				],
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		await expect(
			t.action(api.ai.reviseWithAi, {
				planId: created.planId,
				editToken: created.editToken,
				expectedVersion: 1,
				message: "hapus stop palsu",
				deviceKey: "ai-device-semantic",
			}),
		).rejects.toThrow(/MODEL_RESPONSE_INVALID|stopId was not found/i);

		expect(fetchMock).toHaveBeenCalledTimes(2);
		const plan = await t.query(api.plans.getPlan, { planId: created.planId });
		expect(plan?.version).toBe(1);
	});

	it("rejects multi-remove that would empty the plan without mutation", async () => {
		const t = createTest();
		const created = await t.mutation(api.plans.createPlan, {
			duration: "two-hours",
			locale: "id",
			deviceKey: "ai-device-multi-remove",
		});
		const planBefore = await t.query(api.plans.getPlan, { planId: created.planId });
		expect(planBefore?.stops.length).toBeGreaterThanOrEqual(3);
		const stopIds = planBefore?.stops.map((stop) => stop.id) ?? [];

		vi.stubEnv("OPENROUTER_API_KEY", "test-key");
		vi.stubEnv("OPENROUTER_MODEL", "z-ai/glm-5.3-flash");
		const fetchMock = vi.fn(async () =>
			Response.json({
				choices: [
					{
						message: {
							content: JSON.stringify({
								operations: stopIds.map((stopId) => ({ type: "removeStop", stopId })),
							}),
						},
					},
				],
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		await expect(
			t.action(api.ai.reviseWithAi, {
				planId: created.planId,
				editToken: created.editToken,
				expectedVersion: 1,
				message: "Move the park to the beginning and make every stop 20 minutes.",
				deviceKey: "ai-device-multi-remove",
			}),
		).rejects.toThrow(/MODEL_RESPONSE_INVALID|at least one stop/i);

		expect(fetchMock).toHaveBeenCalledTimes(2);
		const planAfter = await t.query(api.plans.getPlan, { planId: created.planId });
		expect(planAfter?.version).toBe(1);
		expect(planAfter?.stops.map((stop) => stop.poiId)).toEqual(planBefore?.stops.map((stop) => stop.poiId));
	});

	it("applies a corrected second attempt after multi-remove failure", async () => {
		const t = createTest();
		const created = await t.mutation(api.plans.createPlan, {
			duration: "two-hours",
			locale: "id",
			deviceKey: "ai-device-corrective",
		});
		const planBefore = await t.query(api.plans.getPlan, { planId: created.planId });
		const stopIds = planBefore?.stops.map((stop) => stop.id) ?? [];
		expect(stopIds.length).toBeGreaterThanOrEqual(3);
		const firstStop = stopIds[0];
		const secondStop = stopIds[1];
		expect(firstStop).toBeDefined();
		expect(secondStop).toBeDefined();

		vi.stubEnv("OPENROUTER_API_KEY", "test-key");
		vi.stubEnv("OPENROUTER_MODEL", "z-ai/glm-5.3-flash");
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				Response.json({
					choices: [
						{
							message: {
								content: JSON.stringify({
									operations: stopIds.map((stopId) => ({ type: "removeStop", stopId })),
								}),
							},
						},
					],
				}),
			)
			.mockResolvedValueOnce(
				Response.json({
					choices: [
						{
							message: {
								content: JSON.stringify({
									operations: [
										{ type: "reorder", stopId: secondStop, afterStopId: null },
										{ type: "setDuration", stopId: firstStop, visitDurationMinutes: 20 },
										{ type: "setDuration", stopId: secondStop, visitDurationMinutes: 20 },
										{ type: "setDuration", stopId: stopIds[2], visitDurationMinutes: 20 },
									],
								}),
							},
						},
					],
				}),
			);
		vi.stubGlobal("fetch", fetchMock);

		const result = await t.action(api.ai.reviseWithAi, {
			planId: created.planId,
			editToken: created.editToken,
			expectedVersion: 1,
			message: "Move the park to the beginning and make every stop 20 minutes.",
			deviceKey: "ai-device-corrective",
		});

		expect(fetchMock).toHaveBeenCalledTimes(2);
		const firstBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
		const secondBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
		expect(JSON.stringify(firstBody)).not.toEqual(JSON.stringify(secondBody));
		expect(JSON.stringify(secondBody)).toContain("APPLICATION_VALIDATION_FEEDBACK");
		expect(JSON.stringify(secondBody)).toContain("retain at least one stop");
		expect(JSON.stringify(secondBody)).not.toContain("test-key");
		expect(JSON.stringify(secondBody)).not.toContain(created.editToken);
		// Raw first completion (all removes) must not appear in second request.
		expect(JSON.stringify(secondBody)).not.toContain(
			JSON.stringify(stopIds.map((stopId) => ({ type: "removeStop", stopId }))),
		);
		expect(String(secondBody.messages[2]?.content)).toContain("APPLICATION_VALIDATION_FEEDBACK");
		expect(String(secondBody.messages[2]?.content)).toContain("retain at least one stop");
		expect(String(secondBody.messages[2]?.content)).not.toContain(created.editToken);

		expect(result.plan.version).toBe(2);
		expect(result.operations.length).toBeGreaterThan(0);
		expect(result.plan.stops.every((stop) => stop.visitDurationMinutes === 20)).toBe(true);
		expect(result.plan.stops.length).toBe(planBefore?.stops.length);
	});
});
