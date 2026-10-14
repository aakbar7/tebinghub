export const locales = ["id", "en"] as const;
export type Locale = (typeof locales)[number];

export const poiCategories = ["landmark", "heritage", "budaya", "kuliner", "kafe", "ruang-publik", "rekreasi"] as const;
export type PoiCategory = (typeof poiCategories)[number];

export const cityScopes = ["in-city", "day-trip"] as const;
export type CityScope = (typeof cityScopes)[number];

export const poiScopes = ["in-city", "day-trip", "historical-only"] as const;
export type PoiScope = (typeof poiScopes)[number];

export const routeDurations = ["two-hours", "half-day", "full-day"] as const;
export type RouteDuration = (typeof routeDurations)[number];

export type Brand<T, Name extends string> = T & { readonly __brand: Name };
export type PoiId = Brand<string, "PoiId">;
export type RoutePlanId = Brand<string, "RoutePlanId">;
export type RouteStopId = Brand<string, "RouteStopId">;

export type PoiStatus = { kind: "active" } | { kind: "historical"; note: string };

export type Coordinates = {
	lat: number;
	lng: number;
};

export type PoiLocation = {
	label: string;
	coordinates?: Coordinates;
};

export type LocalizedText = Record<Locale, string>;

export type Poi = {
	id: PoiId;
	slug: string;
	name: LocalizedText;
	category: PoiCategory;
	scope: PoiScope;
	status: PoiStatus;
	verification: "verified" | "approximate" | "review-needed";
	description: LocalizedText;
	location: PoiLocation;
	sourceIds: string[];
	legacyCafeIds?: readonly string[];
	coverImage?: string;
};
