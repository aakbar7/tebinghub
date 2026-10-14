import { defaultVisitMinutesFor } from "./aiCatalog";
import type { AiPlanOperation } from "./aiOps";
import { assertValidStops, createStopId, isPlannerPoiId, MAX_PLAN_STOPS, type PlanStop } from "./poi";

function indexOfStop(stops: PlanStop[], stopId: string) {
	return stops.findIndex((stop) => stop.id === stopId);
}

export function applyPlanOperations(stops: PlanStop[], operations: AiPlanOperation[]): PlanStop[] {
	let next = [...stops];

	for (const operation of operations) {
		switch (operation.type) {
			case "addStop": {
				if (!isPlannerPoiId(operation.poiId)) {
					throw new Error(`POI is not allowed in collaborative plans: ${operation.poiId}`);
				}
				if (next.some((stop) => stop.poiId === operation.poiId)) {
					throw new Error("Plan stops must use unique POI IDs.");
				}
				if (next.length >= MAX_PLAN_STOPS) {
					throw new Error(`Plan cannot exceed ${MAX_PLAN_STOPS} stops.`);
				}
				const inserted: PlanStop = {
					id: createStopId(),
					poiId: operation.poiId,
					visitDurationMinutes: defaultVisitMinutesFor(operation.poiId),
				};
				if (operation.afterStopId) {
					const afterIndex = indexOfStop(next, operation.afterStopId);
					if (afterIndex < 0) throw new Error("afterStopId was not found.");
					next = [...next.slice(0, afterIndex + 1), inserted, ...next.slice(afterIndex + 1)];
				} else {
					next = [...next, inserted];
				}
				break;
			}
			case "removeStop": {
				if (indexOfStop(next, operation.stopId) < 0) throw new Error("stopId was not found.");
				if (next.length <= 1) throw new Error("Plan must include at least one stop.");
				next = next.filter((stop) => stop.id !== operation.stopId);
				break;
			}
			case "reorder": {
				const index = indexOfStop(next, operation.stopId);
				if (index < 0) throw new Error("stopId was not found.");
				const [moved] = next.splice(index, 1);
				if (!moved) throw new Error("stopId was not found.");
				if (operation.afterStopId === undefined) {
					next = [moved, ...next];
				} else {
					const afterIndex = indexOfStop(next, operation.afterStopId);
					if (afterIndex < 0) throw new Error("afterStopId was not found.");
					next = [...next.slice(0, afterIndex + 1), moved, ...next.slice(afterIndex + 1)];
				}
				break;
			}
			case "setDuration": {
				const index = indexOfStop(next, operation.stopId);
				if (index < 0) throw new Error("stopId was not found.");
				next = next.map((stop, stopIndex) =>
					stopIndex === index ? { ...stop, visitDurationMinutes: operation.visitDurationMinutes } : stop,
				);
				break;
			}
			default: {
				const _exhaustive: never = operation;
				throw new Error(`Unsupported operation: ${JSON.stringify(_exhaustive)}`);
			}
		}
	}

	assertValidStops(next);
	return next;
}
