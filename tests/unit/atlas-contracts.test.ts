import { describe, expect, it } from "vitest";
import { itineraryCatalog, plannerPoiCatalog, poiCatalog } from "@/content/catalog";
import { normalizeCafeCollection } from "@/features/atlas/cafe-data";
import { arusAtlasNightStyle, arusAtlasStyle } from "@/features/atlas/map-style";
import { atlasCategoryIcons, atlasPlaceIcon } from "@/features/atlas/marker-style";
import {
	atlasCategoriesWithEnoughPlaces,
	buildAtlasPlaces,
	buildClusterCafeCollection,
	deriveAtlasCameraIntent,
	filterAtlasPlaces,
	getItineraryCoordinates,
	getItineraryRouteCoordinates,
	resolveAtlasItinerary,
} from "@/features/atlas/model";
import { parseAtlasState, serializeAtlasState } from "@/features/atlas/state";

describe("atlas contracts", () => {
	it("keeps every active itinerary sourced, timed, and clear of historical-only stops", () => {
		const poiById = new Map(poiCatalog.map((poi) => [poi.id, poi]));

		for (const itinerary of itineraryCatalog) {
			expect(itinerary.stops.length).toBeGreaterThan(1);
			expect(itinerary.totalDurationMinutes).toBeGreaterThan(0);
			expect(itinerary.rationale.id.length).toBeGreaterThan(20);

			for (const stop of itinerary.stops) {
				const poi = poiById.get(stop.poiId);
				expect(poi?.status.kind).toBe("active");
				expect(poi?.scope).toBe("in-city");
				expect(poi?.location.coordinates).toBeDefined();
				expect(stop.visitDurationMinutes).toBeGreaterThan(0);
			}
		}

		expect(itineraryCatalog.find((item) => item.duration === "full-day")?.scope).toBe("in-city");
	});

	it("sanitizes invalid shared state and serializes only meaningful values", () => {
		const knownPoiIds = new Set(poiCatalog.map((poi) => String(poi.id)));
		const valid = parseAtlasState(
			new URLSearchParams("category=kuliner&scope=in-city&plan=two-hours&poi=lemang-batok"),
			knownPoiIds,
		);

		expect(valid).toEqual({
			category: "kuliner",
			scope: "in-city",
			plan: "two-hours",
			poi: "lemang-batok",
		});
		expect(serializeAtlasState(valid).toString()).toBe(
			"category=kuliner&scope=in-city&plan=two-hours&poi=lemang-batok",
		);

		const invalid = parseAtlasState(
			new URLSearchParams("category=unknown&scope=nearby&plan=weekend&poi=missing"),
			knownPoiIds,
		);
		expect(invalid).toEqual({ category: "all", scope: "all" });
		expect(serializeAtlasState(invalid).toString()).toBe("");

		const routeId = "j578ezscgdtdxcjn72q46bmg9n8drker";
		const custom = parseAtlasState(
			new URLSearchParams(`scope=in-city&route=${routeId}&plan=two-hours&poi=tugu-13-desember`),
			knownPoiIds,
		);
		expect(custom).toEqual({
			category: "all",
			scope: "in-city",
			route: routeId,
			poi: "tugu-13-desember",
		});
		expect(serializeAtlasState(custom).toString()).toBe(`scope=in-city&route=${routeId}&poi=tugu-13-desember`);
		expect(
			serializeAtlasState({
				category: "all",
				scope: "in-city",
				plan: "two-hours",
				route: routeId,
				poi: "tugu-13-desember",
			}).toString(),
		).toBe(`scope=in-city&route=${routeId}&poi=tugu-13-desember`);

		const shortRoute = parseAtlasState(new URLSearchParams("plan=two-hours&route=shortid"), knownPoiIds);
		expect(shortRoute).toEqual({ category: "all", scope: "all", plan: "two-hours" });
	});

	it("projects cafe source records into visitor-safe fields and preserves review status", () => {
		const normalized = normalizeCafeCollection({
			type: "FeatureCollection",
			features: [
				{
					type: "Feature",
					geometry: { type: "Point", coordinates: [99.1623, 3.3249] },
					properties: {
						place_id: "test-place",
						name: "Kopi Uji",
						contact: { address: "Jalan Uji", phone: "secret" },
						operating_hours: { workday_timing: "08.00-22.00" },
						reputation: { rating: null, reviews_count: 0 },
						link: "https://www.google.com/maps/place/test",
						ownership: { owner_name: "Do not expose" },
						competitors: [{ name: "Do not expose" }],
						_validation: { is_valid: false, issues: ["internal reason"] },
					},
				},
			],
		});

		expect(normalized.features).toHaveLength(1);
		expect(normalized.features[0].properties).toEqual({
			id: "cafe-kopi-uji-01",
			name: "Kopi Uji",
			category: "kafe",
			scope: "in-city",
			address: "Jalan Uji",
			hours: "08.00-22.00",
			rating: null,
			reviewsCount: 0,
			status: "review-needed",
			mapsUrl: "https://www.google.com/maps/place/test",
		});
		expect(JSON.stringify(normalized)).not.toContain("owner_name");
		expect(JSON.stringify(normalized)).not.toContain("competitors");
		expect(JSON.stringify(normalized)).not.toContain("internal reason");
	});

	it("filters the shared static and cafe atlas without hiding day-trip or review status", () => {
		const cafes = normalizeCafeCollection({
			type: "FeatureCollection",
			features: [
				{
					type: "Feature",
					geometry: { type: "Point", coordinates: [99.16, 3.32] },
					properties: {
						id: "cafe-review-01",
						name: "Cafe Review",
						category: "kafe",
						scope: "in-city",
						address: null,
						hours: null,
						rating: null,
						reviewsCount: 0,
						status: "review-needed",
						mapsUrl: null,
					},
				},
			],
		});
		const places = buildAtlasPlaces("id", cafes);

		expect(filterAtlasPlaces(places, { category: "kafe", scope: "all" })).toHaveLength(6);
		expect(filterAtlasPlaces(places, { category: "all", scope: "day-trip" }).length).toBeGreaterThan(1);
		expect(places.find((place) => place.id === "cafe-review-01")?.verification).toBe("review-needed");
		expect(places.find((place) => place.id === "istana-negeri-padang")?.scope).toBe("historical-only");
	});

	it("deduplicates curated cafes by stable legacy identity, not coordinate equality", () => {
		const cafes = normalizeCafeCollection({
			type: "FeatureCollection",
			features: [
				{
					type: "Feature",
					geometry: { type: "Point", coordinates: [99.1704646, 3.3237188] },
					properties: {
						id: "cafe-goodfella-tebing-tinggi-01",
						name: "Goodfella Tebing Tinggi",
						category: "kafe",
						scope: "in-city",
						address: "Jl. Ahmad Bilal",
						hours: null,
						rating: null,
						reviewsCount: 0,
						status: "verified",
						mapsUrl: null,
					},
				},
				{
					type: "Feature",
					geometry: { type: "Point", coordinates: [99.1622764, 3.3278774] },
					properties: {
						id: "cafe-kedai-kopi-aghara-07",
						name: "Kedai kopi Aghara",
						category: "kafe",
						scope: "in-city",
						address: "Jl. Veteran No. 8",
						hours: null,
						rating: null,
						reviewsCount: 0,
						status: "verified",
						mapsUrl: null,
					},
				},
			],
		});

		const places = buildAtlasPlaces("id", cafes);
		expect(places.filter((place) => place.sourceType === "cafe")).toHaveLength(0);
		expect(places.filter((place) => place.sourceType === "curated" && place.category === "kafe")).toHaveLength(5);
		expect(buildClusterCafeCollection(cafes).features.map((feature) => feature.properties.id)).toEqual([
			"goodfella-tebing-tinggi",
			"kedai-kopi-aghara",
		]);
		const goodfella = places.find((place) => place.id === "goodfella-tebing-tinggi");
		expect(goodfella?.coordinates).toEqual([99.170468, 3.323729]);
		expect(goodfella?.verification).toBe("verified");
	});

	it("keeps visitor category chips from looking empty or singleton", () => {
		const places = buildAtlasPlaces("id", { type: "FeatureCollection", features: [] });
		const chips = atlasCategoriesWithEnoughPlaces();

		expect(chips).toContain("landmark");
		expect(chips).toContain("heritage");
		expect(chips).toContain("kuliner");
		expect(chips).not.toContain("ruang-publik");

		for (const category of chips) {
			expect(filterAtlasPlaces(places, { category, scope: "all" }).length).toBeGreaterThanOrEqual(2);
		}

		expect(
			filterAtlasPlaces(places, { category: "landmark", scope: "all" })
				.map((place) => place.id)
				.sort(),
		).toEqual(
			["masjid-agung", "patung-kuda-simpang-dolok", "selamat-datang", "tugu-13-desember", "tugu-simpang-beo"].sort(),
		);
	});

	it("frames the default camera on the kota instead of day-trip outliers", () => {
		const places = buildAtlasPlaces("id", { type: "FeatureCollection", features: [] });
		const intent = deriveAtlasCameraIntent({
			initialized: false,
			places: filterAtlasPlaces(places, { category: "all", scope: "all" }),
			routeCoordinates: [],
		});

		expect(intent?.kind).toBe("bounds");
		if (intent?.kind !== "bounds") return;
		expect(intent.bounds[0][1]).toBeGreaterThan(3.3);
		expect(intent.bounds[1][1]).toBeLessThan(3.38);
	});

	it("does not refit the city frame when only the places array identity changes", () => {
		const places = filterAtlasPlaces(buildAtlasPlaces("id", { type: "FeatureCollection", features: [] }), {
			category: "all",
			scope: "all",
		});

		expect(
			deriveAtlasCameraIntent({
				initialized: true,
				places: [...places],
				previousPlaces: places,
				previousSelectedId: undefined,
				routeCoordinates: [],
			}),
		).toBeUndefined();
	});

	it("shows only the active itinerary stops while preserving the full atlas without a plan", () => {
		const places = buildAtlasPlaces("id", { type: "FeatureCollection", features: [] });
		const fullAtlas = filterAtlasPlaces(places, { category: "all", scope: "all" });
		const twoHourRoute = filterAtlasPlaces(places, {
			category: "all",
			scope: "all",
			plan: "two-hours",
		});

		expect(fullAtlas).toHaveLength(poiCatalog.length);
		expect(twoHourRoute.map((place) => place.id)).toEqual(["tugu-13-desember", "lemang-batok", "kedai-kopi-aghara"]);

		const customOrder = filterAtlasPlaces(places, {
			category: "kuliner",
			scope: "day-trip",
			plan: "two-hours",
			stopIds: ["taman-kota", "tugu-13-desember"],
		});
		expect(customOrder.map((place) => place.id)).toEqual(["taman-kota", "tugu-13-desember"]);
		expect(customOrder.map((place) => place.id)).not.toEqual(twoHourRoute.map((place) => place.id));
	});

	it("resolves a shared plan without falling back to a duration preset", () => {
		const route = "j578ezscgdtdxcjn72q46bmg9n8drker";

		expect(resolveAtlasItinerary({ plan: "two-hours", route }, undefined)).toEqual({ status: "loading" });
		expect(resolveAtlasItinerary({ plan: "two-hours", route }, null)).toEqual({ status: "none" });
		expect(
			resolveAtlasItinerary(
				{ plan: "two-hours", route },
				{
					title: "Singgah 3 Jam",
					stops: [{ poiId: "taman-kota" }, { poiId: "tugu-13-desember" }],
				},
			),
		).toEqual({
			status: "ready",
			itinerary: {
				kind: "custom",
				planId: route,
				title: "Singgah 3 Jam",
				poiIds: ["taman-kota", "tugu-13-desember"],
			},
		});
		expect(resolveAtlasItinerary({ plan: "two-hours" }, undefined)).toEqual({
			status: "ready",
			itinerary: { kind: "preset", duration: "two-hours" },
		});
	});

	it("fits an active route on direct load and plan changes before resuming manual POI focus", () => {
		const places = buildAtlasPlaces("id", { type: "FeatureCollection", features: [] });
		const selected = places.find((place) => place.id === "lemang-batok");
		const twoHourCoordinates = getItineraryCoordinates("two-hours");
		const halfDayCoordinates = getItineraryCoordinates("half-day");

		expect(
			deriveAtlasCameraIntent({
				activeRouteKey: "preset:two-hours",
				initialized: false,
				places,
				previousRouteKey: undefined,
				previousSelectedId: selected?.id,
				routeCoordinates: twoHourCoordinates,
				selected,
			}),
		).toEqual({
			kind: "bounds",
			bounds: [
				[99.159653, 3.3275084],
				[99.1623117, 3.329094],
			],
		});

		expect(
			deriveAtlasCameraIntent({
				activeRouteKey: "preset:half-day",
				initialized: true,
				places,
				previousRouteKey: "preset:two-hours",
				previousSelectedId: selected?.id,
				routeCoordinates: halfDayCoordinates,
				selected,
			}),
		).toEqual({
			kind: "bounds",
			bounds: [
				[99.159653, 3.3215028],
				[99.1641968, 3.334419],
			],
		});

		expect(
			deriveAtlasCameraIntent({
				activeRouteKey: "preset:half-day",
				initialized: true,
				places,
				previousRouteKey: "preset:half-day",
				previousSelectedId: undefined,
				routeCoordinates: halfDayCoordinates,
				selected,
			}),
		).toEqual({ kind: "selected", center: [99.159653, 3.329094] });
	});

	it("refocuses an already-selected POI after an explicit user focus request", () => {
		const places = buildAtlasPlaces("id", { type: "FeatureCollection", features: [] });
		const selected = places.find((place) => place.id === "lemang-batok");
		if (!selected) throw new Error("Expected the selected POI fixture");

		expect(
			deriveAtlasCameraIntent({
				activeRouteKey: "preset:half-day",
				focusRequest: { id: selected.id, sequence: 2 },
				initialized: true,
				places,
				previousFocusRequestSequence: 1,
				previousRouteKey: "preset:half-day",
				previousSelectedId: selected.id,
				routeCoordinates: getItineraryCoordinates("half-day"),
				selected,
			}),
		).toEqual({ kind: "selected", center: selected.coordinates });
	});

	it("draws curated itineraries along precomputed road geometry", () => {
		for (const duration of ["two-hours", "half-day", "full-day"] as const) {
			const waypoints = getItineraryCoordinates(duration);
			const road = getItineraryRouteCoordinates(duration);
			expect(road.length).toBeGreaterThan(waypoints.length);
			expect(road[0]).not.toEqual(road[1]);
		}
	});

	it("keeps the homepage landmark gallery on the atlas without expanding the planner allowlist", () => {
		const galleryIds = ["tugu-simpang-beo", "patung-kuda-simpang-dolok", "selamat-datang"];
		const places = buildAtlasPlaces("id", { type: "FeatureCollection", features: [] });
		const plannerIds = new Set(plannerPoiCatalog.map((poi) => String(poi.id)));

		for (const id of galleryIds) {
			expect(places.some((place) => place.id === id)).toBe(true);
			expect(plannerIds.has(id)).toBe(false);
		}

		expect(atlasPlaceIcon({ category: "kafe", scope: "in-city", status: "active" })).toBe(atlasCategoryIcons.kafe);
		expect(atlasPlaceIcon({ category: "landmark", scope: "day-trip", status: "active" })).toBe(
			atlasPlaceIcon({ category: "rekreasi", scope: "day-trip", status: "active" }),
		);
	});

	it("extrudes OpenStreetMap buildings once the visitor is close enough to read the street", () => {
		const dayIds = arusAtlasStyle.layers.map((layer) => layer.id);
		const nightIds = arusAtlasNightStyle.layers.map((layer) => layer.id);
		expect(arusAtlasStyle.layers.some((layer) => layer.id === "buildings-3d" && layer.type === "fill-extrusion")).toBe(
			true,
		);
		expect(
			arusAtlasNightStyle.layers.some((layer) => layer.id === "night-buildings-3d" && layer.type === "fill-extrusion"),
		).toBe(true);
		expect(dayIds.indexOf("buildings-3d")).toBeGreaterThan(dayIds.indexOf("roads-major-fill"));
		expect(nightIds.indexOf("night-buildings-3d")).toBeGreaterThan(nightIds.indexOf("night-roads"));
	});

	it("keeps operator and OSM pins at the recorded coordinates", () => {
		const bySlug = new Map(poiCatalog.map((poi) => [poi.slug, poi.location.coordinates]));
		expect(bySlug.get("tugu-13-desember")).toEqual({ lat: 3.3275084, lng: 99.1623117 });
		expect(bySlug.get("masjid-raya-nur-addin")).toEqual({ lat: 3.3293865, lng: 99.1598896 });
		expect(bySlug.get("masjid-agung")).toEqual({ lat: 3.3541081, lng: 99.166095 });
		expect(bySlug.get("taman-kota")).toEqual({ lat: 3.3215028, lng: 99.1641968 });
		expect(bySlug.get("puri-melayu-sri-menanti")).toEqual({ lat: 3.334419, lng: 99.159915 });
		expect(bySlug.get("museum-kota")).toEqual({ lat: 3.328668, lng: 99.162887 });
		expect(bySlug.get("waterpark-gundaling")).toEqual({ lat: 3.342634, lng: 99.190493 });
		expect(bySlug.get("kedai-kopi-aghara")).toEqual({ lat: 3.327773, lng: 99.16226 });
		expect(bySlug.get("legenda-cafe-tebing-tinggi")).toEqual({ lat: 3.329238, lng: 99.161275 });
		expect(bySlug.get("selamat-datang")).toEqual({ lat: 3.373593, lng: 99.166873 });
		expect(bySlug.get("istana-negeri-padang")).toEqual({ lat: 3.332877, lng: 99.156246 });
		expect(bySlug.get("sentra-lemang")).toEqual({ lat: 3.37238, lng: 99.166589 });
		expect(bySlug.get("lemang-batok")).toEqual({ lat: 3.329094, lng: 99.159653 });
	});
});
