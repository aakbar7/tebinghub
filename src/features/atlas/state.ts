import {
	type PoiCategory,
	type PoiScope,
	poiCategories,
	poiScopes,
	type RouteDuration,
	routeDurations,
} from "@/domain";

export type AtlasCategory = "all" | PoiCategory;
export type AtlasScope = "all" | PoiScope;

export type AtlasState = {
	category: AtlasCategory;
	scope: AtlasScope;
	plan?: RouteDuration;
	route?: string;
	poi?: string;
};

type SearchParamsReader = Pick<URLSearchParams, "get">;

function includesValue<const Values extends readonly string[]>(
	values: Values,
	value: string | null,
): value is Values[number] {
	return value !== null && values.includes(value);
}

function parseRouteId(value: string | null): string | undefined {
	if (!value || value.length < 16) return undefined;
	return /^[a-z0-9]+$/i.test(value) ? value : undefined;
}

export function parseAtlasState(searchParams: SearchParamsReader, knownPoiIds: ReadonlySet<string>): AtlasState {
	const categoryParam = searchParams.get("category");
	const scopeParam = searchParams.get("scope");
	const planParam = searchParams.get("plan");
	const route = parseRouteId(searchParams.get("route"));
	const poiParam = searchParams.get("poi");

	return {
		category: includesValue(poiCategories, categoryParam) ? categoryParam : "all",
		scope: includesValue(poiScopes, scopeParam) ? scopeParam : "all",
		...(route ? { route } : includesValue(routeDurations, planParam) ? { plan: planParam } : {}),
		...(poiParam && knownPoiIds.has(poiParam) ? { poi: poiParam } : {}),
	};
}

export function serializeAtlasState(state: AtlasState) {
	const params = new URLSearchParams();

	if (state.category !== "all") params.set("category", state.category);
	if (state.scope !== "all") params.set("scope", state.scope);
	if (state.route) params.set("route", state.route);
	else if (state.plan) params.set("plan", state.plan);
	if (state.poi) params.set("poi", state.poi);

	return params;
}
