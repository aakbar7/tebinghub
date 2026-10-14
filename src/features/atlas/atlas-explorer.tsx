"use client";

import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { useQuery } from "convex/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { atlasContent, getAtlasLabels } from "@/content/atlas";
import type { Locale } from "@/domain";
import { api } from "../../../convex/_generated/api";
import { AtlasDetail } from "./atlas-detail";
import { AtlasFilters } from "./atlas-filters";
import { AtlasList } from "./atlas-list";
import { AtlasMapIsland } from "./atlas-map-island";
import { type CafeAtlasCollection, normalizeCafeCollection } from "./cafe-data";
import {
	type AtlasFocusRequest,
	atlasRouteKey,
	buildAtlasPlaces,
	buildClusterCafeCollection,
	coordinatesForPoiIds,
	filterAtlasPlaces,
	getItinerary,
	getItineraryRouteCoordinates,
	resolveAtlasItinerary,
} from "./model";
import { useOsrmRoute } from "./osrm-route";
import { type AtlasState, parseAtlasState, serializeAtlasState } from "./state";

const EMPTY_CAFES: CafeAtlasCollection = { type: "FeatureCollection", features: [] };
const INITIAL_VISIBLE_RESULTS = 12;

export function AtlasExplorer({ locale }: { locale: Locale }) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const content = atlasContent[locale];
	const labels = getAtlasLabels(locale);
	const [cafes, setCafes] = useState<CafeAtlasCollection>(EMPTY_CAFES);
	const [cafeLoadState, setCafeLoadState] = useState<"loading" | "ready" | "failed">("loading");
	const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_RESULTS);
	const [search, setSearch] = useState("");
	const [focusRequest, setFocusRequest] = useState<AtlasFocusRequest>();

	useEffect(() => {
		const controller = new AbortController();
		fetch("/data/cafes.geojson", { cache: "force-cache", signal: controller.signal })
			.then((response) => {
				if (!response.ok) throw new Error(`Cafe data request failed with ${response.status}`);
				return response.json();
			})
			.then((data: unknown) => {
				setCafes(normalizeCafeCollection(data));
				setCafeLoadState("ready");
			})
			.catch((error: unknown) => {
				if (error instanceof DOMException && error.name === "AbortError") return;
				setCafeLoadState("failed");
			});
		return () => controller.abort();
	}, []);

	const places = useMemo(() => buildAtlasPlaces(locale, cafes), [cafes, locale]);
	const knownPoiIds = useMemo(() => new Set(places.map((place) => place.id)), [places]);
	const state = parseAtlasState(searchParams, knownPoiIds);
	const customPlan = useQuery(api.plans.getPlan, state.route ? { planId: state.route } : "skip");
	const resolved = resolveAtlasItinerary({ plan: state.plan, route: state.route }, customPlan);
	const query = search.trim().toLowerCase();
	const itinerary = resolved.status === "ready" ? resolved.itinerary : undefined;
	const customStopIds = itinerary?.kind === "custom" ? itinerary.poiIds : undefined;
	const presetDuration = itinerary?.kind === "preset" ? itinerary.duration : undefined;
	const showStopIndex = resolved.status === "ready";
	const activeRouteKey = itinerary ? atlasRouteKey(itinerary) : undefined;
	const routeLabel =
		resolved.status === "loading"
			? content.routeLoading
			: itinerary?.kind === "custom"
				? itinerary.title.trim() || content.customRoute
				: itinerary
					? labels.plan[itinerary.duration]
					: null;

	const customStopKey = customStopIds?.join(",") ?? "";
	const customWaypoints = useMemo(
		() => (customStopKey ? coordinatesForPoiIds(customStopKey.split(",")) : []),
		[customStopKey],
	);
	const osrmRoute = useOsrmRoute(customWaypoints);
	const presetRouteCoordinates = useMemo(() => getItineraryRouteCoordinates(presetDuration), [presetDuration]);
	const routeCoordinates = itinerary?.kind === "custom" ? osrmRoute : presetRouteCoordinates;

	const filteredPlaces = useMemo(() => {
		if (resolved.status === "loading") return [];
		const stopIds = customStopKey ? customStopKey.split(",") : undefined;
		let filtered = filterAtlasPlaces(places, {
			category: state.category,
			scope: state.scope,
			plan: presetDuration,
			stopIds,
		});
		if (state.category === "all" && !stopIds) {
			filtered = filtered.filter((place) => place.sourceType === "curated");
		}
		if (query) filtered = filtered.filter((place) => place.name.toLowerCase().includes(query));
		return filtered;
	}, [places, resolved.status, state.category, state.scope, presetDuration, customStopKey, query]);

	const selected = state.poi
		? places.find((place) => {
				if (place.id !== state.poi) return false;
				if (resolved.status === "loading") return false;
				if (itinerary?.kind === "preset") {
					return getItinerary(itinerary.duration)?.stops.some((stop) => String(stop.poiId) === place.id);
				}
				if (itinerary?.kind === "custom") return itinerary.poiIds.includes(place.id);
				return true;
			})
		: undefined;
	const showCafeClusters =
		resolved.status === "none" && state.category === "kafe" && (state.scope === "all" || state.scope === "in-city");
	const filteredCafes = useMemo(() => {
		if (!showCafeClusters) return EMPTY_CAFES;
		const collection = buildClusterCafeCollection(cafes);
		if (!query) return collection;
		return {
			...collection,
			features: collection.features.filter((feature) => feature.properties.name.toLowerCase().includes(query)),
		};
	}, [cafes, query, showCafeClusters]);

	const updateState = useCallback(
		(patch: Partial<AtlasState>) => {
			const next = { ...state, ...patch };
			const queryString = serializeAtlasState(next).toString();
			router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
		},
		[pathname, router, state],
	);

	const handleSelect = useCallback(
		(id?: string) => {
			if (id) {
				setFocusRequest((current) => ({ id, sequence: (current?.sequence ?? 0) + 1 }));
			}
			updateState({ poi: id });
		},
		[updateState],
	);

	return (
		<section aria-label={locale === "id" ? "Penjelajah atlas" : "Atlas explorer"}>
			<div className="flex flex-col lg:h-[calc(100dvh-10.5rem)] lg:min-h-[40rem] lg:flex-row">
				<aside
					aria-label={locale === "id" ? "Panel daftar dan filter" : "List and filter panel"}
					className="relative z-10 flex max-h-[58dvh] w-full shrink-0 flex-col border-b border-river/20 bg-paper lg:max-h-none lg:w-[26rem] lg:border-b-0 lg:border-r"
					data-lenis-prevent
				>
					<div className="shrink-0 space-y-0 border-b border-river/15">
						<div className="p-4">
							<label className="relative block">
								<span className="sr-only">{content.searchLabel}</span>
								<MagnifyingGlassIcon
									aria-hidden="true"
									className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-river-bright"
									size={17}
									weight="bold"
								/>
								<input
									className="min-h-11 w-full border border-river/25 bg-paper py-2 pl-10 pr-10 text-sm text-ink placeholder:text-ink-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emas"
									onChange={(event) => {
										setSearch(event.target.value);
										setVisibleCount(INITIAL_VISIBLE_RESULTS);
									}}
									placeholder={content.searchPlaceholder}
									type="search"
									value={search}
								/>
								{search ? (
									<button
										aria-label={content.searchClear}
										className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emas"
										onClick={() => setSearch("")}
										type="button"
									>
										<XIcon aria-hidden="true" size={15} weight="bold" />
									</button>
								) : null}
							</label>
						</div>

						<div className="border-t border-river/15 p-4">
							<AtlasFilters
								locale={locale}
								onCategoryChange={(category) => {
									setVisibleCount(INITIAL_VISIBLE_RESULTS);
									updateState({ category, poi: undefined });
								}}
								onPlanChange={(plan) => {
									const nextItinerary = getItinerary(plan);
									const keepsSelection =
										!plan || !state.poi || nextItinerary?.stops.some((stop) => String(stop.poiId) === state.poi);
									updateState({
										plan,
										route: undefined,
										poi: keepsSelection ? state.poi : undefined,
									});
								}}
								onScopeChange={(scope) => {
									setVisibleCount(INITIAL_VISIBLE_RESULTS);
									updateState({ scope, poi: undefined });
								}}
								state={state}
							/>
						</div>

						{routeLabel ? (
							<div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-river/15 bg-mist/55 px-4 py-2.5">
								<p className="flex items-center gap-2 text-xs font-bold text-marwah">
									<span aria-hidden="true" className="size-1.5 shrink-0 rotate-45 bg-emas" />
									{content.selectedPlan}
								</p>
								<p className="font-display text-lg font-semibold text-river">{routeLabel}</p>
							</div>
						) : null}

						{cafeLoadState !== "ready" ? (
							<p className="border-t border-river/15 px-4 py-2 text-xs text-ink-muted" role="status">
								{cafeLoadState === "loading" ? content.dataLoading : content.dataUnavailable}
							</p>
						) : null}

						{state.category !== "kafe" ? (
							<p className="border-t border-river/15 bg-mist/40 px-4 py-2 text-xs leading-5 text-ink-muted">
								{content.cafeHint}
							</p>
						) : null}

						{selected ? (
							<AtlasDetail locale={locale} onClose={() => updateState({ poi: undefined })} place={selected} />
						) : null}
					</div>

					<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
						<p className="mb-3 text-[0.7rem] leading-5 text-ink-muted">{content.listHint}</p>
						<div aria-live="polite">
							<AtlasList
								emptyLabel={resolved.status === "loading" ? content.routeLoading : undefined}
								locale={locale}
								onSelect={handleSelect}
								onShowMore={() => setVisibleCount((count) => count + INITIAL_VISIBLE_RESULTS)}
								places={filteredPlaces}
								selectedId={selected?.id}
								showIndex={showStopIndex}
								visibleCount={visibleCount}
							/>
						</div>
					</div>
				</aside>

				<div className="relative min-h-[42dvh] flex-1 lg:min-h-0">
					<AtlasMapIsland
						activeRouteKey={activeRouteKey}
						cafes={filteredCafes}
						fill
						focusRequest={focusRequest}
						locale={locale}
						lockToCity={state.scope !== "day-trip" && selected?.scope !== "day-trip"}
						onSelect={handleSelect}
						places={filteredPlaces}
						routeCoordinates={routeCoordinates}
						selected={selected}
						showLegend
						showStopIndex={showStopIndex}
					/>
				</div>
			</div>
		</section>
	);
}

export function AtlasStaticFallback({ locale }: { locale: Locale }) {
	const places = buildAtlasPlaces(locale, EMPTY_CAFES);
	return (
		<div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="atlas-server-fallback">
			{places.slice(0, 6).map((place) => (
				<div className="border-t border-river/20 py-4" key={place.id}>
					<p className="font-display text-xl font-semibold text-river">{place.name}</p>
					<p className="mt-2 text-sm leading-6 text-ink-muted">{place.description}</p>
				</div>
			))}
		</div>
	);
}
