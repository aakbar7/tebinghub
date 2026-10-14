import { describe, expect, it } from "vitest";
import { plannerPoiCatalog } from "@/content/catalog";
import type { AiPlanOperation } from "../../convex/lib/aiOps";
import { applyPlanOperations } from "../../convex/lib/applyOps";
import {
	assertValidStops,
	clampPlanTitle,
	createStopId,
	getSeedForDuration,
	hashEditKey,
	isPlannerPoiId,
	MAX_PLAN_STOPS,
	MAX_PLAN_TITLE_LENGTH,
	PLANNER_POI_IDS,
	type PlanStop,
} from "../../convex/lib/poi";

const twoHourBase: PlanStop[] = getSeedForDuration("two-hours", "id").stops.map((stop, index) => ({
	id: `stop_${index}`,
	...stop,
}));

describe("planner contracts", () => {
	it("exports the active in-city allowlist used by collaborative plans", () => {
		expect(PLANNER_POI_IDS).toHaveLength(plannerPoiCatalog.length);
		expect(isPlannerPoiId("tugu-13-desember")).toBe(true);
		expect(isPlannerPoiId("istana-negeri-padang")).toBe(false);
		expect(isPlannerPoiId("danau-laut-tador")).toBe(false);
	});

	it("seeds curated stops for each duration", () => {
		expect(getSeedForDuration("two-hours", "id").stops.map((stop) => stop.poiId)).toEqual([
			"tugu-13-desember",
			"lemang-batok",
			"kedai-kopi-aghara",
		]);
		const halfDayIds = getSeedForDuration("half-day", "id").stops.map((stop) => stop.poiId);
		const fullDayIds = getSeedForDuration("full-day", "id").stops.map((stop) => stop.poiId);
		expect(halfDayIds).toContain("lemang-batok");
		expect(halfDayIds).not.toContain("sentra-lemang");
		expect(fullDayIds).toContain("sentra-lemang");
		expect(fullDayIds).not.toContain("lemang-batok");
		expect(fullDayIds).toContain("goodfella-tebing-tinggi");
		expect(halfDayIds).not.toContain("rasio-seduh");
		expect(fullDayIds).not.toContain("skuy-coffee");
		expect(halfDayIds).toHaveLength(6);
		expect(fullDayIds).toHaveLength(6);
	});

	it("clamps titles and rejects invalid stop sets", () => {
		expect(clampPlanTitle("  Hello  ")).toBe("Hello");
		expect(clampPlanTitle("x".repeat(MAX_PLAN_TITLE_LENGTH + 5))).toHaveLength(MAX_PLAN_TITLE_LENGTH);
		expect(() => assertValidStops([{ id: "s1", poiId: "istana-negeri-padang", visitDurationMinutes: 20 }])).toThrow(
			/collaborative plans/i,
		);
		const tooMany = Array.from({ length: MAX_PLAN_STOPS + 1 }, (_, index) => ({
			id: `s${index}`,
			poiId: "tugu-13-desember",
			visitDurationMinutes: 20,
		}));
		expect(() => assertValidStops(tooMany)).toThrow(/cannot exceed/i);
	});

	it("applies route operations with uniqueness and version-safe shapes", () => {
		const base = twoHourBase;
		const lastStop = base.at(2);
		const firstStop = base.at(0);
		expect(lastStop).toBeDefined();
		expect(firstStop).toBeDefined();
		if (!lastStop || !firstStop) throw new Error("seed stops missing");

		const withCafe = applyPlanOperations(base, [{ type: "addStop", poiId: "skuy-coffee" }]);
		expect(withCafe.map((stop) => stop.poiId)).toContain("skuy-coffee");

		const cafeStop = withCafe.find((stop) => stop.poiId === "skuy-coffee");
		expect(cafeStop).toBeDefined();
		if (!cafeStop) throw new Error("cafe stop missing");

		const removed = applyPlanOperations(withCafe, [{ type: "removeStop", stopId: cafeStop.id }]);
		expect(removed.map((stop) => stop.poiId)).not.toContain("skuy-coffee");

		const reordered = applyPlanOperations(base, [{ type: "reorder", stopId: lastStop.id }]);
		expect(reordered.at(0)?.poiId).toBe(lastStop.poiId);

		const durationOps: AiPlanOperation[] = [{ type: "setDuration", stopId: firstStop.id, visitDurationMinutes: 35 }];
		expect(applyPlanOperations(base, durationOps).at(0)?.visitDurationMinutes).toBe(35);

		expect(() => applyPlanOperations(base, [{ type: "addStop", poiId: "istana-negeri-padang" }])).toThrow(
			/collaborative plans/i,
		);
		expect(() => applyPlanOperations(base, [{ type: "addStop", poiId: "tugu-13-desember" }])).toThrow(
			/unique|duplicate/i,
		);
	});

	it("hashes edit keys without storing the raw token", async () => {
		const hash = await hashEditKey("secret-token");
		expect(hash).toMatch(/^[a-f0-9]{64}$/);
		expect(hash).not.toContain("secret");
		expect(await hashEditKey("secret-token")).toBe(hash);
		expect(await hashEditKey("other-token")).not.toBe(hash);
		expect(createStopId()).toMatch(/^stop_/);
	});
});
