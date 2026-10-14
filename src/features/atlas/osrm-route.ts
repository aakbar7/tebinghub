import { useEffect, useMemo, useState } from "react";

const OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving";
const routeCache = new Map<string, [number, number][]>();

export function waypointCacheKey(waypoints: readonly [number, number][]): string {
	return waypoints.map(([lng, lat]) => `${lng},${lat}`).join(";");
}

export function resetOsrmRouteCache() {
	routeCache.clear();
}

export function peekOsrmRoute(waypoints: readonly [number, number][]): [number, number][] | undefined {
	return routeCache.get(waypointCacheKey(waypoints));
}

function copyWaypoints(waypoints: readonly [number, number][]): [number, number][] {
	return waypoints.map(([lng, lat]) => [lng, lat]);
}

function readOsrmCoordinates(payload: unknown): [number, number][] | undefined {
	if (!payload || typeof payload !== "object") return undefined;
	const body = payload as {
		code?: unknown;
		routes?: { geometry?: { coordinates?: unknown } }[];
	};
	if (body.code !== "Ok") return undefined;
	const coordinates = body.routes?.[0]?.geometry?.coordinates;
	if (!Array.isArray(coordinates) || coordinates.length < 2) return undefined;

	const points: [number, number][] = [];
	for (const pair of coordinates) {
		if (!Array.isArray(pair) || pair.length < 2) return undefined;
		const lng = pair[0];
		const lat = pair[1];
		if (typeof lng !== "number" || typeof lat !== "number") return undefined;
		points.push([lng, lat]);
	}
	return points;
}

export async function fetchOsrmRoute(
	waypoints: readonly [number, number][],
	signal?: AbortSignal,
): Promise<[number, number][]> {
	if (waypoints.length < 2) return copyWaypoints(waypoints);

	const key = waypointCacheKey(waypoints);
	const cached = routeCache.get(key);
	if (cached) return cached;

	const path = waypoints.map(([lng, lat]) => `${lng},${lat}`).join(";");
	try {
		const response = await fetch(`${OSRM_ROUTE_URL}/${path}?overview=full&geometries=geojson`, { signal });
		if (!response.ok) return copyWaypoints(waypoints);
		const coordinates = readOsrmCoordinates(await response.json());
		if (!coordinates) return copyWaypoints(waypoints);
		routeCache.set(key, coordinates);
		return coordinates;
	} catch {
		return copyWaypoints(waypoints);
	}
}

export function useOsrmRoute(waypoints: readonly [number, number][]): [number, number][] {
	const key = waypointCacheKey(waypoints);
	const fallback = useMemo(() => {
		if (!key) return [];
		return key.split(";").map((pair) => {
			const [lng, lat] = pair.split(",");
			return [Number(lng), Number(lat)] as [number, number];
		});
	}, [key]);
	const [fetched, setFetched] = useState<{ key: string; coordinates: [number, number][] }>();

	useEffect(() => {
		if (fallback.length < 2) {
			setFetched({ key, coordinates: fallback });
			return;
		}

		const cached = peekOsrmRoute(fallback);
		if (cached) {
			setFetched({ key, coordinates: cached });
			return;
		}

		const controller = new AbortController();
		let cancelled = false;
		void fetchOsrmRoute(fallback, controller.signal).then((coordinates) => {
			if (!cancelled) setFetched({ key, coordinates });
		});

		return () => {
			cancelled = true;
			controller.abort();
		};
	}, [fallback, key]);

	if (fetched?.key === key) return fetched.coordinates;
	return peekOsrmRoute(fallback) ?? fallback;
}
