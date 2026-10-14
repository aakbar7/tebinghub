import { describe, expect, it } from "vitest";
import { itineraryCatalog, plannerPoiCatalog, poiCatalog } from "@/content/catalog";
import { cityScopes, locales, poiCategories, routePlanSchemaVersion } from "@/domain";

describe("domain contracts", () => {
	it("keeps the locked locale and category vocabulary explicit", () => {
		expect(locales).toEqual(["id", "en"]);
		expect(poiCategories).toContain("landmark");
		expect(poiCategories).not.toContain("seri-mersing");
	});

	it("starts route plans at the current schema version", () => {
		expect(routePlanSchemaVersion).toBe(1);
	});

	it("keeps the catalog safe for planner and itinerary boundaries", () => {
		expect(cityScopes).toEqual(["in-city", "day-trip"]);
		expect(plannerPoiCatalog.every((poi) => poi.status.kind === "active")).toBe(true);
		expect(poiCatalog.some((poi) => poi.status.kind === "historical")).toBe(true);
		expect(plannerPoiCatalog.some((poi) => poi.id === "puri-melayu-sri-menanti")).toBe(true);
		expect(
			itineraryCatalog.every((itinerary) =>
				itinerary.stops.every((stop) => poiCatalog.some((poi) => poi.id === stop.poiId)),
			),
		).toBe(true);
		expect(itineraryCatalog.find((itinerary) => itinerary.id === "setengah-hari-berarus")?.stops).toEqual(
			expect.arrayContaining([expect.objectContaining({ poiId: "puri-melayu-sri-menanti" })]),
		);
		expect(itineraryCatalog.find((itinerary) => itinerary.duration === "full-day")?.scope).toBe("in-city");
		expect(poiCatalog.some((poi) => poi.scope === "day-trip")).toBe(true);
	});
});
