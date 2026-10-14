import { itineraryCatalog, poiCatalog } from "@/content/catalog";
import itineraryRouteGeometry from "@/content/itinerary-route-geometry.json";
import { type Locale, type PoiCategory, type PoiScope, poiCategories, type RouteDuration } from "@/domain";
import type { CafeAtlasCollection } from "./cafe-data";
import type { AtlasState } from "./state";

export type AtlasPlace = {
	id: string;
	name: string;
	description: string;
	category: PoiCategory;
	scope: PoiScope;
	status: "active" | "historical";
	verification: "verified" | "approximate" | "review-needed";
	coordinates: [number, number];
	address: string | null;
	hours: string | null;
	rating: number | null;
	reviewsCount: number;
	mapsUrl: string;
	sourceType: "curated" | "cafe";
};

function directionsUrl([lng, lat]: [number, number]) {
	return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function getLegacyCafeIds(poi: (typeof poiCatalog)[number]): readonly string[] {
	return "legacyCafeIds" in poi ? poi.legacyCafeIds : [];
}

export function buildAtlasPlaces(locale: Locale, cafes: CafeAtlasCollection): AtlasPlace[] {
	const curated = poiCatalog.flatMap((poi): AtlasPlace[] => {
		const coordinates = poi.location.coordinates;
		if (!coordinates) return [];
		const tuple: [number, number] = [coordinates.lng, coordinates.lat];

		return [
			{
				id: String(poi.id),
				name: poi.name[locale],
				description: poi.description[locale],
				category: poi.category,
				scope: poi.scope,
				status: poi.status.kind === "historical" ? "historical" : "active",
				verification: poi.verification,
				coordinates: tuple,
				address: poi.location.label,
				hours: null,
				rating: null,
				reviewsCount: 0,
				mapsUrl: directionsUrl(tuple),
				sourceType: "curated",
			},
		];
	});

	const curatedCafeLegacyIds = new Set(
		poiCatalog.filter((poi) => poi.category === "kafe").flatMap((poi) => getLegacyCafeIds(poi)),
	);
	const uniqueCafeFeatures = cafes.features.filter((feature) => !curatedCafeLegacyIds.has(feature.properties.id));
	const cafePlaces = uniqueCafeFeatures.map(
		(feature): AtlasPlace => ({
			id: feature.properties.id,
			name: feature.properties.name,
			description:
				locale === "id"
					? "Kafe dari kumpulan data atlas Tebing Tinggi. Periksa detail terbaru sebelum berangkat."
					: "A cafe from the Tebing Tinggi atlas dataset. Check current details before visiting.",
			category: "kafe",
			scope: "in-city",
			status: "active",
			verification: feature.properties.status,
			coordinates: feature.geometry.coordinates,
			address: feature.properties.address,
			hours: feature.properties.hours,
			rating: feature.properties.rating,
			reviewsCount: feature.properties.reviewsCount,
			mapsUrl: feature.properties.mapsUrl ?? directionsUrl(feature.geometry.coordinates),
			sourceType: "cafe",
		}),
	);

	return [...curated, ...cafePlaces];
}

export function buildClusterCafeCollection(cafes: CafeAtlasCollection): CafeAtlasCollection {
	const curatedCafeIdByLegacyId = new Map(
		poiCatalog
			.filter((poi) => poi.category === "kafe")
			.flatMap((poi) => getLegacyCafeIds(poi).map((legacyId) => [legacyId, String(poi.id)] as const)),
	);
	return {
		type: "FeatureCollection",
		features: cafes.features.map((feature) => {
			const curatedId = curatedCafeIdByLegacyId.get(feature.properties.id);
			return curatedId ? { ...feature, properties: { ...feature.properties, id: curatedId } } : feature;
		}),
	};
}

export type AtlasItinerary =
	| { kind: "preset"; duration: RouteDuration }
	| { kind: "custom"; planId: string; title: string; poiIds: string[] };

export type AtlasItineraryResolution =
	| { status: "loading" }
	| { status: "none" }
	| { status: "ready"; itinerary: AtlasItinerary };

type AtlasCustomPlan = {
	title: string;
	stops: readonly { poiId: string }[];
};

export function resolveAtlasItinerary(
	state: Pick<AtlasState, "plan" | "route">,
	customPlan: AtlasCustomPlan | null | undefined,
): AtlasItineraryResolution {
	if (state.route) {
		if (customPlan === undefined) return { status: "loading" };
		if (customPlan === null) return { status: "none" };
		return {
			status: "ready",
			itinerary: {
				kind: "custom",
				planId: state.route,
				title: customPlan.title,
				poiIds: customPlan.stops.map((stop) => stop.poiId),
			},
		};
	}
	if (state.plan) return { status: "ready", itinerary: { kind: "preset", duration: state.plan } };
	return { status: "none" };
}

export function atlasRouteKey(itinerary: AtlasItinerary): string {
	return itinerary.kind === "preset"
		? `preset:${itinerary.duration}`
		: `custom:${itinerary.planId}:${itinerary.poiIds.join(",")}`;
}

function placesInStopOrder(places: readonly AtlasPlace[], stopIds: readonly string[]): AtlasPlace[] {
	const order = new Map(stopIds.map((id, index) => [id, index]));
	return places
		.filter((place) => order.has(place.id))
		.sort((left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0));
}

export function filterAtlasPlaces(
	places: readonly AtlasPlace[],
	state: Pick<AtlasState, "category" | "scope" | "plan"> & { stopIds?: string[] },
) {
	if (state.stopIds && state.stopIds.length > 0) {
		return placesInStopOrder(places, state.stopIds);
	}

	const filtered = places.filter(
		(place) =>
			(state.category === "all" || place.category === state.category) &&
			(state.scope === "all" || place.scope === state.scope),
	);
	const itinerary = getItinerary(state.plan);
	if (!itinerary) return filtered;

	return placesInStopOrder(
		filtered,
		itinerary.stops.map((stop) => String(stop.poiId)),
	);
}

export function atlasCategoriesWithEnoughPlaces(minimum = 2): PoiCategory[] {
	const counts = new Map<PoiCategory, number>();
	for (const poi of poiCatalog) {
		counts.set(poi.category, (counts.get(poi.category) ?? 0) + 1);
	}
	return poiCategories.filter((category) => (counts.get(category) ?? 0) >= minimum);
}

function frameCoordinates(places: readonly AtlasPlace[], selected?: AtlasPlace) {
	if (selected?.scope === "day-trip") return places.map((place) => place.coordinates);
	const local = places.filter((place) => place.scope !== "day-trip");
	return (local.length > 0 ? local : places).map((place) => place.coordinates);
}

function frameKey(places: readonly AtlasPlace[], selected?: AtlasPlace) {
	return frameCoordinates(places, selected)
		.map(([lng, lat]) => `${lng},${lat}`)
		.sort()
		.join("|");
}

export function getItinerary(duration?: RouteDuration) {
	return duration ? itineraryCatalog.find((itinerary) => itinerary.duration === duration) : undefined;
}

export function coordinatesForPoiIds(poiIds: readonly string[]): [number, number][] {
	return poiIds.flatMap((poiId): [number, number][] => {
		const coordinates = poiCatalog.find((poi) => String(poi.id) === poiId)?.location.coordinates;
		return coordinates ? [[coordinates.lng, coordinates.lat]] : [];
	});
}

export function getItineraryCoordinates(duration?: RouteDuration) {
	const itinerary = getItinerary(duration);
	if (!itinerary) return [];
	return coordinatesForPoiIds(itinerary.stops.map((stop) => String(stop.poiId)));
}

export function getItineraryRouteCoordinates(duration?: RouteDuration) {
	const waypoints = getItineraryCoordinates(duration);
	if (!duration) return [];
	const road = itineraryRouteGeometry[duration] as [number, number][] | undefined;
	return road && road.length > 1 ? road : waypoints;
}

export type AtlasCameraIntent =
	| { kind: "selected"; center: [number, number] }
	| { kind: "single"; center: [number, number] }
	| { kind: "bounds"; bounds: [[number, number], [number, number]] };

export type AtlasFocusRequest = {
	id: string;
	sequence: number;
};

type AtlasCameraIntentInput = {
	activeRouteKey?: string;
	focusRequest?: AtlasFocusRequest;
	initialized: boolean;
	places: readonly AtlasPlace[];
	previousFocusRequestSequence?: number;
	previousPlaces?: readonly AtlasPlace[];
	previousRouteKey?: string;
	previousSelectedId?: string;
	routeCoordinates: readonly [number, number][];
	selected?: AtlasPlace;
};

function getCollectionCameraIntent(coordinates: readonly [number, number][]): AtlasCameraIntent | undefined {
	if (coordinates.length === 0) return undefined;
	if (coordinates.length === 1) return { kind: "single", center: coordinates[0] };

	const lngs = coordinates.map(([lng]) => lng);
	const lats = coordinates.map(([, lat]) => lat);
	return {
		kind: "bounds",
		bounds: [
			[Math.min(...lngs), Math.min(...lats)],
			[Math.max(...lngs), Math.max(...lats)],
		],
	};
}

export function deriveAtlasCameraIntent({
	activeRouteKey,
	focusRequest,
	initialized,
	places,
	previousFocusRequestSequence,
	previousPlaces,
	previousRouteKey,
	previousSelectedId,
	routeCoordinates,
	selected,
}: AtlasCameraIntentInput): AtlasCameraIntent | undefined {
	if (!initialized) {
		if (activeRouteKey) return getCollectionCameraIntent(routeCoordinates);
		if (selected) return { kind: "selected", center: selected.coordinates };
		return getCollectionCameraIntent(frameCoordinates(places, selected));
	}

	if (activeRouteKey !== previousRouteKey) {
		if (activeRouteKey) return getCollectionCameraIntent(routeCoordinates);
		if (selected) return { kind: "selected", center: selected.coordinates };
		return getCollectionCameraIntent(frameCoordinates(places, selected));
	}

	if (selected?.id !== previousSelectedId) {
		if (selected) return { kind: "selected", center: selected.coordinates };
		return getCollectionCameraIntent(activeRouteKey ? routeCoordinates : frameCoordinates(places, selected));
	}

	if (selected && focusRequest?.id === selected.id && focusRequest.sequence !== previousFocusRequestSequence) {
		return { kind: "selected", center: selected.coordinates };
	}

	if (activeRouteKey) return undefined;
	if (selected) return undefined;
	if (previousPlaces && frameKey(places, selected) === frameKey(previousPlaces, selected)) return undefined;
	return getCollectionCameraIntent(frameCoordinates(places, selected));
}
