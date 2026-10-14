import { describe, expect, it } from "vitest";
import { afterStopIdForMove, moveItem } from "@/features/planner/reorder";

type Stop = { id: string };

function applyConvexReorder(stops: readonly Stop[], from: number, to: number): Stop[] {
	const afterStopId = afterStopIdForMove(stops, from, to);
	const next = [...stops];
	const [moved] = next.splice(from, 1);
	if (!moved) return next;
	if (afterStopId === undefined) {
		next.unshift(moved);
	} else {
		const afterIndex = next.findIndex((stop) => stop.id === afterStopId);
		next.splice(afterIndex + 1, 0, moved);
	}
	return next;
}

describe("planner stop reorder", () => {
	const stops: Stop[] = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];

	it("moves a stop to the start with afterStopId undefined", () => {
		expect(afterStopIdForMove(stops, 2, 0)).toBeUndefined();
		expect(applyConvexReorder(stops, 2, 0).map((stop) => stop.id)).toEqual(["c", "a", "b", "d"]);
		expect(moveItem(stops, 2, 0).map((stop) => stop.id)).toEqual(["c", "a", "b", "d"]);
	});

	it("moves a stop to the end after the new predecessor", () => {
		expect(afterStopIdForMove(stops, 0, 3)).toBe("d");
		expect(applyConvexReorder(stops, 0, 3).map((stop) => stop.id)).toEqual(["b", "c", "d", "a"]);
		expect(moveItem(stops, 0, 3).map((stop) => stop.id)).toEqual(["b", "c", "d", "a"]);
	});

	it("moves a stop into the middle after the new predecessor", () => {
		expect(afterStopIdForMove(stops, 3, 1)).toBe("a");
		expect(applyConvexReorder(stops, 3, 1).map((stop) => stop.id)).toEqual(["a", "d", "b", "c"]);
		expect(moveItem(stops, 3, 1).map((stop) => stop.id)).toEqual(["a", "d", "b", "c"]);
	});
});
