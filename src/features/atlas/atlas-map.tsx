"use client";

import { ArrowSquareOutIcon, ArrowUpRightIcon, ClockCounterClockwiseIcon, CubeIcon } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import {
	Map as MapCanvas,
	MapClusterLayer,
	MapControls,
	MapGeoJSON,
	MapMarker,
	MapPopup,
	MapRoute,
	MarkerContent,
	MarkerLabel,
	MarkerTooltip,
	useMap,
} from "@/components/ui/map";
import { atlasContent, getAtlasLabels } from "@/content/atlas";
import { KOTA_TEBING_TINGGI_MAX_BOUNDS, kotaTebingTinggiBoundary } from "@/content/city-boundary";
import type { Locale } from "@/domain";
import { cn } from "@/lib/cn";
import type { CafeAtlasCollection, CafeAtlasProperties } from "./cafe-data";
import { arusAtlasNightStyle, arusAtlasStyle } from "./map-style";
import { atlasCategoryIcons, atlasPlaceIcon } from "./marker-style";
import { type AtlasFocusRequest, type AtlasPlace, deriveAtlasCameraIntent } from "./model";
import { MAP_WEBGL_CONTEXT_ATTRIBUTES } from "./webgl-support";

export type AtlasMapVariant = "day" | "night";

type AtlasMapProps = {
	activeRouteKey?: string;
	focusRequest?: AtlasFocusRequest;
	locale: Locale;
	places: readonly AtlasPlace[];
	cafes: CafeAtlasCollection;
	selected?: AtlasPlace;
	routeCoordinates: [number, number][];
	reducedMotion: boolean;
	onSelect: (id?: string) => void;
	variant?: AtlasMapVariant;
	showPopup?: boolean;
	showLegend?: boolean;
	lockToCity?: boolean;
	showStopIndex?: boolean;
};

const MAP_STYLES = {
	day: { light: arusAtlasStyle, dark: arusAtlasStyle },
	night: { light: arusAtlasNightStyle, dark: arusAtlasNightStyle },
} as const;

function CameraController({
	activeRouteKey,
	focusRequest,
	places,
	selected,
	routeCoordinates,
	reducedMotion,
}: Pick<
	AtlasMapProps,
	"activeRouteKey" | "focusRequest" | "places" | "selected" | "routeCoordinates" | "reducedMotion"
>) {
	const { map } = useMap();
	const initializedRef = useRef(false);
	const previousFocusRequestSequenceRef = useRef(focusRequest?.sequence);
	const previousRouteKeyRef = useRef<string | undefined>(undefined);
	const previousPlacesRef = useRef<readonly AtlasPlace[]>([]);
	const previousSelectedIdRef = useRef(selected?.id);

	useEffect(() => {
		if (!map) return;
		const duration = reducedMotion ? 0 : 650;
		const intent = deriveAtlasCameraIntent({
			activeRouteKey,
			focusRequest,
			initialized: initializedRef.current,
			places,
			previousFocusRequestSequence: previousFocusRequestSequenceRef.current,
			previousPlaces: previousPlacesRef.current,
			previousRouteKey: previousRouteKeyRef.current,
			previousSelectedId: previousSelectedIdRef.current,
			routeCoordinates,
			selected,
		});
		initializedRef.current = true;
		previousFocusRequestSequenceRef.current = focusRequest?.sequence;
		previousRouteKeyRef.current = activeRouteKey;
		previousPlacesRef.current = places;
		previousSelectedIdRef.current = selected?.id;
		if (!intent) return;

		if (intent.kind === "selected") {
			map.easeTo({
				center: intent.center,
				zoom: Math.max(map.getZoom(), 15.2),
				duration,
				pitch: map.getPitch(),
				bearing: map.getBearing(),
				padding: { top: 48, right: 48, bottom: 48, left: 48 },
			});
			return;
		}

		if (intent.kind === "single") {
			map.easeTo({
				center: intent.center,
				zoom: 15,
				duration,
				pitch: map.getPitch(),
				bearing: map.getBearing(),
			});
			return;
		}

		map.fitBounds(intent.bounds, {
			padding: 64,
			maxZoom: 14,
			duration,
			pitch: map.getPitch(),
			bearing: map.getBearing(),
		});
	}, [activeRouteKey, focusRequest, map, places, reducedMotion, routeCoordinates, selected]);

	return null;
}

function CityLock({ enabled }: { enabled: boolean }) {
	const { map } = useMap();

	useEffect(() => {
		if (!map) return;
		map.setMaxBounds(enabled ? KOTA_TEBING_TINGGI_MAX_BOUNDS : null);
		return () => {
			map.setMaxBounds(null);
		};
	}, [enabled, map]);

	return null;
}

function CompactAttribution() {
	const { map, isLoaded } = useMap();

	useEffect(() => {
		if (!map || !isLoaded) return;
		const el = map.getContainer().querySelector(".maplibregl-ctrl-attrib");
		if (!(el instanceof HTMLElement)) return;
		el.classList.add("maplibregl-compact");
		el.classList.remove("maplibregl-compact-show");
	}, [isLoaded, map]);

	return null;
}

function AtlasLegend({ locale, showCafes, showRoute }: { locale: Locale; showCafes: boolean; showRoute: boolean }) {
	const content = atlasContent[locale];
	const categoryIcons = Object.values(atlasCategoryIcons);
	return (
		<div className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[15.5rem] border border-river/20 bg-paper/95 p-3 shadow-[0_8px_24px_rgb(21_24_22_/_0.14)] backdrop-blur-[2px]">
			<p className="text-[0.64rem] font-bold uppercase tracking-[0.14em] text-river-bright">{content.legendTitle}</p>
			<ul className="mt-2 space-y-2 text-[0.72rem] leading-4 text-ink">
				<li className="flex items-start gap-2">
					<span className="mt-0.5 grid shrink-0 grid-cols-4 gap-0.5">
						{categoryIcons.map((Icon, index) => (
							<span
								className="inline-flex size-4 items-center justify-center rounded-full bg-river text-paper"
								key={Icon.displayName ?? index}
							>
								<Icon aria-hidden="true" size={9} weight="bold" />
							</span>
						))}
					</span>
					<span>{content.legendPlace}</span>
				</li>
				<li className="flex items-start gap-2">
					<span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-paper bg-river text-paper">
						<ArrowUpRightIcon aria-hidden="true" size={11} weight="bold" />
					</span>
					<span>{content.legendDayTrip}</span>
				</li>
				<li className="flex items-start gap-2">
					<span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-paper bg-river text-paper">
						<ClockCounterClockwiseIcon aria-hidden="true" size={11} weight="bold" />
					</span>
					<span>{content.legendHistorical}</span>
				</li>
				{showCafes ? (
					<li className="flex items-start gap-2">
						<span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#2A7167] text-[0.6rem] font-bold text-paper">
							3
						</span>
						<span>{content.legendCafe}</span>
					</li>
				) : null}
				{showRoute ? (
					<li className="flex items-start gap-2">
						<span aria-hidden="true" className="mt-2 h-0.5 w-5 shrink-0 bg-marwah" />
						<span>{content.legendRoute}</span>
					</li>
				) : null}
				<li className="flex items-start gap-2">
					<span aria-hidden="true" className="mt-2 h-0.5 w-5 shrink-0 bg-river" />
					<span>{content.legendCity}</span>
				</li>
				<li className="flex items-start gap-2">
					<span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-river/25 bg-paper text-river">
						<CubeIcon aria-hidden="true" size={12} weight="bold" />
					</span>
					<span>{content.legendTilt}</span>
				</li>
			</ul>
		</div>
	);
}

export default function AtlasMap({
	activeRouteKey,
	focusRequest,
	locale,
	places,
	cafes,
	selected,
	routeCoordinates,
	reducedMotion,
	onSelect,
	variant = "day",
	showPopup = true,
	showLegend = false,
	lockToCity = true,
	showStopIndex = false,
}: AtlasMapProps) {
	const content = atlasContent[locale];
	const labels = getAtlasLabels(locale);
	// Render curated pins plus any currently selected cafe pin
	const pinned = places.filter(
		(place) => place.sourceType === "curated" || (selected?.id === place.id && place.sourceType === "cafe"),
	);
	const night = variant === "night";
	const showCafes = cafes.features.length > 0;

	return (
		<section
			aria-label={locale === "id" ? "Peta interaktif Tebing Tinggi" : "Interactive Tebing Tinggi map"}
			className="relative h-full min-h-[22rem] w-full"
			data-lenis-prevent
		>
			{showLegend ? (
				<AtlasLegend locale={locale} showCafes={showCafes} showRoute={routeCoordinates.length > 1} />
			) : null}

			<MapCanvas
				attributionControl={{ compact: true }}
				canvasContextAttributes={MAP_WEBGL_CONTEXT_ATTRIBUTES}
				center={[99.162, 3.328]}
				className="h-full min-h-[22rem] w-full"
				cooperativeGestures
				fadeDuration={reducedMotion ? 0 : 300}
				maxPitch={60}
				pitch={reducedMotion ? 0 : 46}
				styles={MAP_STYLES[variant]}
				theme="light"
				zoom={13}
			>
				<CityLock enabled={lockToCity} />
				<CameraController
					activeRouteKey={activeRouteKey}
					focusRequest={focusRequest}
					places={places}
					reducedMotion={reducedMotion}
					routeCoordinates={routeCoordinates}
					selected={selected}
				/>
				<CompactAttribution />
				<MapControls position="top-right" showCompass showPitch showZoom />
				<MapGeoJSON
					data={kotaTebingTinggiBoundary}
					fillPaint={{ "fill-color": night ? "#D5A32B" : "#103D38", "fill-opacity": night ? 0.08 : 0.06 }}
					linePaint={{ "line-color": night ? "#D5A32B" : "#7A3045", "line-width": 2, "line-opacity": 0.9 }}
				/>

				{routeCoordinates.length > 1 ? (
					<MapRoute color={night ? "#D5A32B" : "#7A3045"} coordinates={routeCoordinates} opacity={0.9} width={4} />
				) : null}

				{pinned.map((place, index) => {
					const isSelected = selected?.id === place.id;
					const Icon = atlasPlaceIcon(place);
					return (
						<MapMarker
							key={place.id}
							latitude={place.coordinates[1]}
							longitude={place.coordinates[0]}
							pitchAlignment="viewport"
							rotationAlignment="viewport"
						>
							<MarkerContent>
								<button
									aria-label={`${place.name} · ${labels.category[place.category]}`}
									aria-pressed={isSelected}
									className={cn(
										"atlas-marker flex items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emas",
										isSelected
											? "size-10 border-[3px] border-emas bg-river text-paper shadow-[0_4px_16px_rgb(21_24_22_/_0.35)]"
											: night
												? "size-9 border border-emas/70 bg-[#0B2823]/85 text-emas"
												: "size-8 border-2 border-paper bg-river text-paper shadow-[0_3px_12px_rgb(21_24_22_/_0.28)]",
									)}
									data-selected={isSelected}
									onClick={() => onSelect(place.id)}
									style={reducedMotion ? undefined : { animationDelay: `${index * 80}ms` }}
									type="button"
								>
									{showStopIndex ? (
										<span className="tabular-nums font-bold">{index + 1}</span>
									) : (
										<Icon aria-hidden="true" size={isSelected ? 18 : 15} weight={isSelected ? "fill" : "bold"} />
									)}
								</button>
							</MarkerContent>
							{!night ? (
								<MarkerLabel
									className={cn("!text-[0.68rem] !font-bold !text-river", isSelected ? "opacity-100" : "opacity-90")}
									position="top"
								>
									<span className="rounded-sm bg-paper/90 px-1.5 py-0.5 shadow-sm">{place.name}</span>
								</MarkerLabel>
							) : null}
							<MarkerTooltip className="atlas-marker-tooltip">
								<span className="font-bold">{place.name}</span>
							</MarkerTooltip>
						</MapMarker>
					);
				})}

				{showCafes ? (
					<MapClusterLayer<CafeAtlasProperties>
						clusterColors={["#2A7167", "#D5A32B", "#7A3045"]}
						clusterMaxZoom={14}
						clusterRadius={48}
						clusterThresholds={[8, 24]}
						data={cafes}
						onPointClick={(feature) => onSelect(feature.properties.id)}
						pointColor="#1D6092"
					/>
				) : null}

				{showPopup && selected ? (
					<MapPopup
						className="!rounded-none !border-0 !p-0 overflow-hidden shadow-[0_16px_40px_rgb(21_24_22_/_0.28)]"
						closeButton
						latitude={selected.coordinates[1]}
						longitude={selected.coordinates[0]}
						onClose={() => onSelect(undefined)}
					>
						<div className="w-64 border-t-4 border-emas bg-paper p-4 text-ink">
							<p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-river-bright">
								{labels.category[selected.category]}
							</p>
							<p className="mt-2 pr-5 font-display text-xl font-semibold leading-tight text-river">{selected.name}</p>
							<p className="mt-2 line-clamp-3 text-xs leading-5 text-ink-muted">
								{selected.verification === "review-needed" ? content.reviewNeeded : selected.description}
							</p>
							<a
								className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-xs font-bold text-river hover:text-marwah"
								href={selected.mapsUrl}
								rel="noreferrer"
								target="_blank"
							>
								{content.directions}
								<ArrowSquareOutIcon aria-hidden="true" size={14} weight="bold" />
							</a>
						</div>
					</MapPopup>
				) : null}
			</MapCanvas>
		</section>
	);
}
