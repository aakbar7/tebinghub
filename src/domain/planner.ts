import type { CityScope, Locale, LocalizedText, PoiId, RouteDuration, RoutePlanId, RouteStopId } from "./city";

export const routePlanSchemaVersion = 1 as const;

export type RouteStop = {
	id: RouteStopId;
	poiId: PoiId;
	arrivalOffsetMinutes: number;
	visitDurationMinutes: number;
};

export type RoutePlan = {
	id: RoutePlanId;
	schemaVersion: typeof routePlanSchemaVersion;
	locale: Locale;
	title: string;
	durationMinutes: number;
	stops: RouteStop[];
	updatedAt: string;
};

export type RouteOperation =
	| { type: "addStop"; poiId: PoiId; afterStopId?: RouteStopId }
	| { type: "removeStop"; stopId: RouteStopId }
	| { type: "reorder"; stopId: RouteStopId; afterStopId?: RouteStopId }
	| { type: "setDuration"; stopId: RouteStopId; visitDurationMinutes: number };

export type RoutePlanInput = Pick<RoutePlan, "locale" | "title" | "stops">;

export type Itinerary = {
	id: string;
	title: LocalizedText;
	summary: LocalizedText;
	rationale: LocalizedText;
	scope: CityScope;
	duration: RouteDuration;
	totalDurationMinutes: number;
	stops: Array<{
		poiId: PoiId;
		visitDurationMinutes: number;
	}>;
};
