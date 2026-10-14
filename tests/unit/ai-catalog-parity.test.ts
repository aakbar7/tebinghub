import { describe, expect, it } from "vitest";
import { itineraryCatalog, plannerPoiCatalog } from "@/content/catalog";
import { AI_POI_CATALOG, defaultVisitMinutesFor } from "../../convex/lib/aiCatalog";
import { applyPlanOperations } from "../../convex/lib/applyOps";
import { PLANNER_POI_IDS as CONVEX_PLANNER_POI_IDS, getSeedForDuration } from "../../convex/lib/poi";

describe("AI catalog parity", () => {
	it("covers every Convex planner allowlist id with compact metadata", () => {
		expect(AI_POI_CATALOG.map((entry) => entry.id).sort()).toEqual([...CONVEX_PLANNER_POI_IDS].sort());
		for (const entry of AI_POI_CATALOG) {
			expect(entry.traits.length).toBeGreaterThanOrEqual(2);
			expect(entry.traits.length).toBeLessThanOrEqual(5);
			expect(entry.defaultVisitMinutes).toBeGreaterThanOrEqual(5);
			expect(entry.boundary).toBe("in-city-active");
		}
	});

	it("keeps Convex AI allowlist ids inside the frontend planner catalog", () => {
		const frontendIds = new Set(plannerPoiCatalog.map((poi) => String(poi.id)));
		for (const id of CONVEX_PLANNER_POI_IDS) {
			expect(frontendIds.has(id)).toBe(true);
		}
	});

	it("lets AI start from the same curated itinerary the homepage shows", () => {
		const allowlist = new Set<string>(CONVEX_PLANNER_POI_IDS);
		for (const itinerary of itineraryCatalog) {
			const seed = getSeedForDuration(itinerary.duration, "id");
			expect(seed.stops.map((stop) => stop.poiId)).toEqual(itinerary.stops.map((stop) => stop.poiId));
			for (const stop of itinerary.stops) {
				expect(allowlist.has(String(stop.poiId))).toBe(true);
			}
		}
	});

	it("keeps AI catalog coordinates aligned with the frontend planner catalog", () => {
		const byId = new Map(plannerPoiCatalog.map((poi) => [String(poi.id), poi]));
		for (const entry of AI_POI_CATALOG) {
			const poi = byId.get(entry.id);
			expect(poi).toBeDefined();
			expect(entry.lat).toBe(poi?.location.coordinates.lat);
			expect(entry.lng).toBe(poi?.location.coordinates.lng);
			expect(entry.category).toBe(poi?.category);
		}
	});

	it("uses catalog visit minutes when AI adds a stop", () => {
		expect(defaultVisitMinutesFor("waterpark-gundaling")).toBe(90);
		expect(defaultVisitMinutesFor("unknown-poi")).toBe(30);

		const next = applyPlanOperations(
			[{ id: "stop_a", poiId: "tugu-13-desember", visitDurationMinutes: 20 }],
			[{ type: "addStop", poiId: "waterpark-gundaling" }],
		);
		expect(next.map((stop) => stop.poiId)).toEqual(["tugu-13-desember", "waterpark-gundaling"]);
		expect(next[1]?.visitDurationMinutes).toBe(90);
	});
});
