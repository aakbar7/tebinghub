import { describe, expect, it } from "vitest";
import { buildPlanAtlasHref, buildPresetAtlasHref, readEditTokenFromHash } from "@/features/planner/share";

describe("planner share helpers", () => {
	it("builds a custom atlas deep link from the collaborative plan id", () => {
		const href = buildPlanAtlasHref({
			planId: "j578ezscgdtdxcjn72q46bmg9n8drker",
			poiIds: ["tugu-13-desember", "lemang-batok"],
			firstPoiId: "tugu-13-desember",
		});

		expect(href).toBe("/peta?scope=in-city&route=j578ezscgdtdxcjn72q46bmg9n8drker&poi=tugu-13-desember");
		expect(href).not.toContain("plan=two-hours");
		expect(href).not.toMatch(/[?&]plan=/);
	});

	it("keeps duration atlas links for preset itinerary chips", () => {
		expect(buildPresetAtlasHref("two-hours", "tugu-13-desember")).toBe(
			"/peta?scope=in-city&plan=two-hours&poi=tugu-13-desember",
		);
	});

	it("reads the edit capability token from the URL hash", () => {
		expect(readEditTokenFromHash("#edit=abc123")).toBe("abc123");
		expect(readEditTokenFromHash("")).toBeUndefined();
	});
});
