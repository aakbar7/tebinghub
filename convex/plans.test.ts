/// <reference types="vite/client" />

import { register as registerRateLimiter } from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { inferPlanTitleSource } from "./lib/poi";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

function createTest() {
	const t = convexTest(schema, modules);
	registerRateLimiter(t);
	return t;
}

describe("collaborative plans", () => {
	it("creates a seeded plan and returns an edit token once", async () => {
		const t = createTest();
		const created = await t.mutation(api.plans.createPlan, {
			duration: "two-hours",
			locale: "id",
			deviceKey: "test-device-1",
		});

		expect(created.planId).toBeTruthy();
		expect(created.editToken).toMatch(/^[a-f0-9]{48}$/);
		expect(created.version).toBe(1);

		const plan = await t.query(api.plans.getPlan, { planId: created.planId });
		expect(plan).not.toBeNull();
		expect(plan?.title).toBe("Dua jam, tiga rasa kota");
		expect(plan?.titleSource).toBe("seed");
		expect(plan?.stops.map((stop) => stop.poiId)).toEqual(["tugu-13-desember", "lemang-batok", "kedai-kopi-aghara"]);
		expect(plan).not.toHaveProperty("editKeyHash");
	});

	it("rejects historical POIs and wrong edit tokens", async () => {
		const t = createTest();
		const created = await t.mutation(api.plans.createPlan, {
			duration: "two-hours",
			locale: "en",
			deviceKey: "test-device-2",
		});

		await expect(
			t.mutation(api.plans.addStop, {
				planId: created.planId,
				editToken: created.editToken,
				expectedVersion: 1,
				poiId: "istana-negeri-padang",
			}),
		).rejects.toThrow(/collaborative plans/i);

		await expect(
			t.mutation(api.plans.addStop, {
				planId: created.planId,
				editToken: "wrong-token",
				expectedVersion: 1,
				poiId: "skuy-coffee",
			}),
		).rejects.toThrow(/Edit capability/i);
	});

	it("supports add/remove/reorder with optimistic versioning", async () => {
		const t = createTest();
		const created = await t.mutation(api.plans.createPlan, {
			duration: "two-hours",
			locale: "id",
			deviceKey: "test-device-3",
		});

		const added = await t.mutation(api.plans.addStop, {
			planId: created.planId,
			editToken: created.editToken,
			expectedVersion: 1,
			poiId: "skuy-coffee",
		});
		expect(added.version).toBe(2);

		await expect(
			t.mutation(api.plans.addStop, {
				planId: created.planId,
				editToken: created.editToken,
				expectedVersion: 1,
				poiId: "taman-kota",
			}),
		).rejects.toThrow(/VERSION_CONFLICT|changed/i);

		const planAfterAdd = await t.query(api.plans.getPlan, { planId: created.planId });
		const coffeeStop = planAfterAdd?.stops.find((stop) => stop.poiId === "skuy-coffee");
		expect(coffeeStop?.id).toBeTruthy();
		if (!coffeeStop) throw new Error("coffee stop missing");

		const reordered = await t.mutation(api.plans.reorderStop, {
			planId: created.planId,
			editToken: created.editToken,
			expectedVersion: 2,
			stopId: coffeeStop.id,
		});
		expect(reordered.version).toBe(3);

		const planAfterReorder = await t.query(api.plans.getPlan, { planId: created.planId });
		expect(planAfterReorder?.stops[0]?.poiId).toBe("skuy-coffee");

		const removed = await t.mutation(api.plans.removeStop, {
			planId: created.planId,
			editToken: created.editToken,
			expectedVersion: 3,
			stopId: coffeeStop.id,
		});
		expect(removed.version).toBe(4);

		const finalPlan = await t.query(api.plans.getPlan, { planId: created.planId });
		expect(finalPlan?.stops.map((stop) => stop.poiId)).not.toContain("skuy-coffee");
	});

	it("marks a provided create title and updateTitle as user-owned", async () => {
		const t = createTest();
		const created = await t.mutation(api.plans.createPlan, {
			duration: "two-hours",
			locale: "en",
			title: "My stopover",
			deviceKey: "test-device-title",
		});
		const plan = await t.query(api.plans.getPlan, { planId: created.planId });
		expect(plan?.title).toBe("My stopover");
		expect(plan?.titleSource).toBe("user");

		const updated = await t.mutation(api.plans.updateTitle, {
			planId: created.planId,
			editToken: created.editToken,
			expectedVersion: 1,
			title: "Renamed stopover",
		});
		expect(updated.version).toBe(2);
		const after = await t.query(api.plans.getPlan, { planId: created.planId });
		expect(after?.title).toBe("Renamed stopover");
		expect(after?.titleSource).toBe("user");
	});

	it("returns null for an unparseable plan id from a URL", async () => {
		const t = createTest();
		await expect(t.query(api.plans.getPlan, { planId: "notarealconvexidxxxxxxxx" })).resolves.toBeNull();
	});

	it("infers titleSource for legacy docs without the field", () => {
		expect(
			inferPlanTitleSource({
				title: "Dua jam, tiga rasa kota",
				duration: "two-hours",
				locale: "id",
			}),
		).toBe("seed");
		expect(
			inferPlanTitleSource({
				title: "Custom walk",
				duration: "two-hours",
				locale: "id",
			}),
		).toBe("user");
		expect(
			inferPlanTitleSource({
				title: "Custom walk",
				duration: "two-hours",
				locale: "id",
				titleSource: "ai",
			}),
		).toBe("ai");
	});
});
