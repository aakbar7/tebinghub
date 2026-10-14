import { describe, expect, it } from "vitest";
import {
	clampAiMessage,
	inspectModelCompletion,
	MAX_AI_MESSAGE_LENGTH,
	MAX_AI_OPERATIONS,
	parseAiOperationsJson,
	parseAndValidateAiOperations,
	RETAIN_AT_LEAST_ONE_STOP_REASON,
	retryHintForModelFailure,
} from "../../convex/lib/aiOps";
import { PLANNER_POI_IDS } from "../../convex/lib/poi";

const allowlist = new Set<string>(PLANNER_POI_IDS);

const baseStops = [
	{ id: "stop_a", poiId: "tugu-13-desember", visitDurationMinutes: 20 },
	{ id: "stop_b", poiId: "lemang-batok", visitDurationMinutes: 30 },
	{ id: "stop_c", poiId: "kedai-kopi-aghara", visitDurationMinutes: 40 },
];

describe("AI plan operations", () => {
	it("parses a family-friendly revise that adds a park stop", () => {
		const raw = JSON.stringify({
			operations: [
				{ type: "addStop", poiId: "taman-kota", afterStopId: null },
				{ type: "setDuration", stopId: "stop_a", visitDurationMinutes: 25 },
			],
		});
		const result = parseAndValidateAiOperations(raw, baseStops, allowlist);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.operations).toHaveLength(2);
		expect(result.operations[0]).toEqual({ type: "addStop", poiId: "taman-kota" });
	});

	it("accepts empty operations as a no-op payload", () => {
		const result = parseAiOperationsJson(JSON.stringify({ operations: [] }), allowlist);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.operations).toEqual([]);
		expect(result.title).toBeUndefined();
	});

	it("parses an optional title without counting it as an operation", () => {
		const raw = JSON.stringify({
			operations: [{ type: "addStop", poiId: "taman-kota", afterStopId: null }],
			title: "  Taman keluarga  ",
		});
		const result = parseAndValidateAiOperations(raw, baseStops, allowlist);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.operations).toEqual([{ type: "addStop", poiId: "taman-kota" }]);
		expect(result.title).toBe("Taman keluarga");
	});

	it("accepts empty operations with a title", () => {
		const result = parseAndValidateAiOperations(
			JSON.stringify({ operations: [], title: "Kopi dan lemang" }),
			baseStops,
			allowlist,
		);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.operations).toEqual([]);
		expect(result.title).toBe("Kopi dan lemang");
	});

	it("clamps long titles and omits titles that are empty after clamp", () => {
		const long = parseAiOperationsJson(JSON.stringify({ operations: [], title: `  ${"x".repeat(90)}  ` }), allowlist);
		expect(long.ok).toBe(true);
		if (long.ok) expect(long.title).toHaveLength(80);

		const blank = parseAiOperationsJson(JSON.stringify({ operations: [], title: "   " }), allowlist);
		expect(blank.ok).toBe(true);
		if (blank.ok) expect(blank.title).toBeUndefined();
	});

	it("rejects extra root keys and non-string titles", () => {
		const extra = parseAiOperationsJson(JSON.stringify({ operations: [], note: "nope" }), allowlist);
		expect(extra.ok).toBe(false);

		const both = parseAiOperationsJson(JSON.stringify({ operations: [], title: "Kopi", extra: true }), allowlist);
		expect(both.ok).toBe(false);

		const numbered = parseAiOperationsJson(JSON.stringify({ operations: [], title: 12 }), allowlist);
		expect(numbered.ok).toBe(false);
	});

	it("rejects historical palace POIs and unknown operation types", () => {
		const palace = parseAiOperationsJson(
			JSON.stringify({ operations: [{ type: "addStop", poiId: "istana-negeri-padang" }] }),
			allowlist,
		);
		expect(palace.ok).toBe(false);

		const unknown = parseAiOperationsJson(
			JSON.stringify({ operations: [{ type: "inventPlace", name: "Somewhere" }] }),
			allowlist,
		);
		expect(unknown.ok).toBe(false);
	});

	it("rejects multi-remove sequences that would leave zero stops", () => {
		const raw = JSON.stringify({
			operations: [
				{ type: "removeStop", stopId: "stop_a" },
				{ type: "removeStop", stopId: "stop_b" },
				{ type: "removeStop", stopId: "stop_c" },
			],
		});
		const result = parseAndValidateAiOperations(raw, baseStops, allowlist);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.code).toBe("MODEL_RESPONSE_INVALID");
			expect(result.reason).toBe(RETAIN_AT_LEAST_ONE_STOP_REASON);
			expect(retryHintForModelFailure(result.reason)).toBe("RETAIN_AT_LEAST_ONE_STOP");
		}
	});

	it("rejects malformed JSON, fenced JSON, think tags, Han drift, and oversized batches", () => {
		expect(parseAiOperationsJson("not-json", allowlist).ok).toBe(false);
		const fenced = parseAiOperationsJson('```json\n{"operations":[]}\n```', allowlist);
		expect(fenced.ok).toBe(false);
		if (!fenced.ok) expect(fenced.code).toBe("MODEL_RESPONSE_INVALID");
		const think = parseAiOperationsJson('<think>x</think>{"operations":[]}', allowlist);
		expect(think.ok).toBe(false);
		if (!think.ok) expect(think.code).toBe("MODEL_RESPONSE_INVALID");
		const han = inspectModelCompletion('{"operations":[{"note":"你好"}]}');
		expect(han && !han.ok ? han.code : null).toBe("MODEL_LANGUAGE_DRIFT");
		const tooMany = Array.from({ length: MAX_AI_OPERATIONS + 1 }, () => ({
			type: "addStop",
			poiId: "skuy-coffee",
		}));
		expect(parseAiOperationsJson(JSON.stringify({ operations: tooMany }), allowlist).ok).toBe(false);
	});

	it("rejects setDuration outside 5-240", () => {
		const result = parseAndValidateAiOperations(
			JSON.stringify({
				operations: [{ type: "setDuration", stopId: "stop_a", visitDurationMinutes: 300 }],
			}),
			baseStops,
			allowlist,
		);
		expect(result.ok).toBe(false);
	});

	it("clamps oversized user messages", () => {
		const clamped = clampAiMessage(`  ${"x".repeat(MAX_AI_MESSAGE_LENGTH + 40)}  `);
		expect(clamped).toHaveLength(MAX_AI_MESSAGE_LENGTH);
	});

	it("keeps prompt-injection attempts inside the allowlist", () => {
		const result = parseAndValidateAiOperations(
			JSON.stringify({
				operations: [{ type: "addStop", poiId: "istana-negeri-padang", afterStopId: null }],
			}),
			baseStops,
			allowlist,
		);
		expect(result.ok).toBe(false);
	});
});
