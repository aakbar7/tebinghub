import type { RouteDuration } from "@/domain";
import { serializeAtlasState } from "@/features/atlas/state";

export function buildPresetAtlasHref(duration: RouteDuration, firstPoiId?: string) {
	const params = serializeAtlasState({
		category: "all",
		scope: "in-city",
		plan: duration,
		...(firstPoiId ? { poi: firstPoiId } : {}),
	});
	const query = params.toString();
	return query ? `/peta?${query}` : "/peta";
}

export function buildPlanAtlasHref(args: { planId: string; poiIds: string[]; firstPoiId?: string }) {
	const poi = args.firstPoiId ?? args.poiIds[0];
	const params = serializeAtlasState({
		category: "all",
		scope: "in-city",
		route: args.planId,
		...(poi ? { poi } : {}),
	});
	const query = params.toString();
	return query ? `/peta?${query}` : "/peta";
}

export function readEditTokenFromHash(hash: string) {
	const value = hash.startsWith("#") ? hash.slice(1) : hash;
	const params = new URLSearchParams(value);
	return params.get("edit") ?? undefined;
}
