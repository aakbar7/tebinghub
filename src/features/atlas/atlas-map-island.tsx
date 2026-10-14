"use client";

import dynamic from "next/dynamic";
import { Component, type ErrorInfo, type ReactNode, useEffect, useRef, useState } from "react";
import { atlasContent } from "@/content/atlas";
import type { Locale } from "@/domain";
import type { CafeAtlasCollection } from "./cafe-data";
import type { AtlasFocusRequest, AtlasPlace } from "./model";
import { supportsWebGL } from "./webgl-support";

const DynamicAtlasMap = dynamic(() => import("./atlas-map"), { ssr: false });

type AtlasMapIslandProps = {
	activeRouteKey?: string;
	focusRequest?: AtlasFocusRequest;
	locale: Locale;
	places: readonly AtlasPlace[];
	cafes: CafeAtlasCollection;
	selected?: AtlasPlace;
	routeCoordinates: [number, number][];
	onSelect: (id?: string) => void;
	variant?: "day" | "night";
	showPopup?: boolean;
	fill?: boolean;
	showLegend?: boolean;
	lockToCity?: boolean;
	showStopIndex?: boolean;
};

class MapErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
	state = { failed: false };

	static getDerivedStateFromError() {
		return { failed: true };
	}

	componentDidCatch(_error: Error, _info: ErrorInfo) {
		// Fallback UI renders when WebGL or MapLibre fails
	}

	render() {
		return this.state.failed ? this.props.fallback : this.props.children;
	}
}

export function AtlasMapIsland({
	activeRouteKey,
	focusRequest,
	locale,
	places,
	cafes,
	selected,
	routeCoordinates,
	onSelect,
	variant = "day",
	showPopup = true,
	fill = false,
	showLegend = false,
	lockToCity = true,
	showStopIndex = false,
}: AtlasMapIslandProps) {
	const content = atlasContent[locale];
	const heightClass = fill ? "h-full min-h-[22rem]" : "min-h-[32rem]";
	const rootRef = useRef<HTMLDivElement>(null);
	const [nearViewport, setNearViewport] = useState(false);
	const [webglAvailable, setWebglAvailable] = useState<boolean>();
	const [reducedMotion, setReducedMotion] = useState(false);

	useEffect(() => {
		setWebglAvailable(supportsWebGL());
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		setReducedMotion(media.matches);
		const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
		media.addEventListener("change", onChange);
		return () => media.removeEventListener("change", onChange);
	}, []);

	useEffect(() => {
		const element = rootRef.current;
		if (!element) return;

		const markNear = () => setNearViewport(true);
		const isNear = (rect: DOMRect) =>
			rect.width > 0 && rect.height > 0 && rect.bottom > -320 && rect.top < window.innerHeight + 320;

		if (isNear(element.getBoundingClientRect())) {
			markNear();
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					markNear();
					observer.disconnect();
				}
			},
			{ rootMargin: "320px" },
		);
		observer.observe(element);

		const timeout = window.setTimeout(() => {
			if (element.getBoundingClientRect().height > 0) markNear();
		}, 2500);

		return () => {
			observer.disconnect();
			window.clearTimeout(timeout);
		};
	}, []);

	const night = variant === "night";
	const fallback = (
		<div
			className={
				night
					? `flex ${heightClass} items-end bg-[linear-gradient(135deg,#0B2823,#123832)] p-6`
					: `flex ${heightClass} items-end bg-[linear-gradient(135deg,#DCE5E1,#F6F2E9)] p-6`
			}
			data-testid="atlas-map-fallback"
			role="status"
		>
			<p
				className={
					night
						? "flex max-w-md gap-3 text-sm leading-6 text-paper/75"
						: "flex max-w-md gap-3 text-sm leading-6 text-ink-muted"
				}
			>
				<span
					aria-hidden="true"
					className={night ? "mt-1.5 size-2 shrink-0 rotate-45 bg-emas" : "mt-1.5 size-2 shrink-0 rotate-45 bg-marwah"}
				/>
				{content.mapUnavailable}
			</p>
		</div>
	);

	return (
		<div
			className={night ? `${heightClass} overflow-hidden bg-[#0B2823]` : `${heightClass} overflow-hidden bg-mist`}
			ref={rootRef}
		>
			{webglAvailable === false ? fallback : null}
			{webglAvailable !== false && !nearViewport ? (
				<div
					aria-busy="true"
					className={
						night
							? `flex ${heightClass} items-center justify-center bg-[#0B2823] text-sm font-semibold text-paper/70`
							: `flex ${heightClass} items-center justify-center bg-mist text-sm font-semibold text-river`
					}
					role="status"
				>
					{content.mapLoading}
				</div>
			) : null}
			{webglAvailable && nearViewport ? (
				<MapErrorBoundary fallback={fallback}>
					<DynamicAtlasMap
						activeRouteKey={activeRouteKey}
						cafes={cafes}
						focusRequest={focusRequest}
						locale={locale}
						lockToCity={lockToCity}
						onSelect={onSelect}
						places={places}
						reducedMotion={reducedMotion}
						routeCoordinates={routeCoordinates}
						selected={selected}
						showLegend={showLegend}
						showPopup={showPopup}
						showStopIndex={showStopIndex}
						variant={variant}
					/>
				</MapErrorBoundary>
			) : null}
		</div>
	);
}
