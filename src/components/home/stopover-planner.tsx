"use client";

import { ArrowUpRightIcon, SparkleIcon } from "@phosphor-icons/react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { StopoverConcierge } from "@/components/home/stopover-concierge";
import { RevealScope } from "@/components/motion/reveal-scope";
import { useLenis } from "@/components/providers/smooth-scroll-provider";
import { itineraryCatalog, poiCatalog } from "@/content/catalog";
import { homeContent } from "@/content/home";
import type { Locale, RouteDuration } from "@/domain";
import { CreateCollaborativePlanButton } from "@/features/planner/create-plan-button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion";

const poiById = new Map(poiCatalog.map((poi) => [poi.id, poi]));
const dayTripPois = poiCatalog.filter((poi) => poi.scope === "day-trip");

const durationKindLabels = {
	id: {
		"two-hours": "Singgah singkat",
		"half-day": "Setengah hari",
		"full-day": "Sehari",
	},
	en: {
		"two-hours": "Quick stop",
		"half-day": "Half day",
		"full-day": "Full day",
	},
} as const satisfies Record<Locale, Record<RouteDuration, string>>;

function formatHours(minutes: number, locale: Locale) {
	if (minutes < 60) return `${minutes} ${locale === "id" ? "menit" : "minutes"}`;
	const hours = minutes / 60;
	return locale === "id" ? `${hours} jam` : `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

function formatDurationKind(duration: RouteDuration, locale: Locale) {
	return durationKindLabels[locale][duration];
}

function StepRule({ index, label }: { index: string; label: string }) {
	return (
		<div className="flex min-w-0 items-center gap-4 sm:gap-5" data-planner-step>
			<h3 className="flex shrink-0 items-baseline gap-3 font-display text-lg font-medium leading-none tracking-[-0.015em] text-river sm:text-xl">
				<span className="text-[1.45em] font-normal italic leading-none text-emas-ink" data-step-index>
					{index}
				</span>
				<span>{label}</span>
			</h3>
			<span aria-hidden="true" className="planner-step-divider flex-1" data-planner-step-divider data-reveal="line" />
		</div>
	);
}

type PlannerMode = RouteDuration | "ai";

export function StopoverPlanner({ locale }: { locale: Locale }) {
	const content = homeContent[locale].planner;
	const [mode, setMode] = useState<PlannerMode>("two-hours");
	// Keep last fixed duration to seed new plans created from the AI tab
	const [lastDuration, setLastDuration] = useState<RouteDuration>("two-hours");
	const selectedItinerary =
		itineraryCatalog.find((itinerary) => itinerary.duration === (mode === "ai" ? lastDuration : mode)) ??
		itineraryCatalog[0];
	const rootRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const markerRef = useRef<HTMLSpanElement>(null);

	const selectDuration = (duration: RouteDuration) => {
		setMode(duration);
		setLastDuration(duration);
	};

	// Switch to the AI tab on #concierge links and scroll after mount
	const lenis = useLenis();
	const pendingConciergeScroll = useRef(false);
	useEffect(() => {
		const applyHash = () => {
			if (window.location.hash !== "#concierge") return;
			pendingConciergeScroll.current = true;
			setMode("ai");
		};
		applyHash();
		window.addEventListener("hashchange", applyHash);
		return () => window.removeEventListener("hashchange", applyHash);
	}, []);
	useEffect(() => {
		if (mode !== "ai" || !pendingConciergeScroll.current) return;
		pendingConciergeScroll.current = false;
		const target = document.getElementById("itinerary-panel");
		if (!target) return;
		if (lenis) lenis.scrollTo(target, { offset: -120 });
		else target.scrollIntoView({ block: "start" });
	}, [mode, lenis]);

	useGSAP(
		() => {
			const list = listRef.current;
			const marker = markerRef.current;
			if (!list || !marker) return;

			const move = (instant?: boolean) => {
				const active = list.querySelector<HTMLElement>("[aria-selected='true']");
				if (!active) return;
				gsap.to(marker, {
					x: active.offsetLeft,
					width: active.offsetWidth,
					duration: instant || prefersReducedMotion() ? 0 : 0.55,
					ease: "power3.inOut",
					overwrite: "auto",
				});
			};

			move(true);
			document.fonts?.ready.then(() => move(true));
			const onResize = () => move(true);
			window.addEventListener("resize", onResize);
			return () => window.removeEventListener("resize", onResize);
		},
		{ dependencies: [], scope: rootRef },
	);

	useGSAP(
		() => {
			const list = listRef.current;
			const marker = markerRef.current;
			if (!list || !marker) return;
			const active = list.querySelector<HTMLElement>("[aria-selected='true']");
			if (!active) return;
			gsap.to(marker, {
				x: active.offsetLeft,
				width: active.offsetWidth,
				duration: prefersReducedMotion() ? 0 : 0.55,
				ease: "power3.inOut",
				overwrite: "auto",
			});
		},
		{ dependencies: [mode], scope: rootRef },
	);

	useGSAP(
		() => {
			if (prefersReducedMotion()) return;
			const root = rootRef.current;
			if (!root) return;

			const panelItems = gsap.utils.toArray<HTMLElement>("[data-panel-item]", root);
			const routeRail = root.querySelector<HTMLElement>("[data-route-rail]");
			const stopDots = gsap.utils.toArray<HTMLElement>("[data-stop-dot]", root);
			const stopRows = gsap.utils.toArray<HTMLElement>("[data-stop-row]", root);
			const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

			if (panelItems.length > 0) {
				timeline.fromTo(panelItems, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.07 }, 0);
			}
			if (routeRail) {
				timeline.fromTo(
					routeRail,
					{ scaleY: 0 },
					{ scaleY: 1, transformOrigin: "top center", duration: 0.8, ease: "power2.inOut" },
					0.1,
				);
			}
			if (stopDots.length > 0) {
				timeline.fromTo(
					stopDots,
					{ scale: 0 },
					{ scale: 1, duration: 0.45, ease: "back.out(2.4)", stagger: 0.1 },
					0.25,
				);
			}
			if (stopRows.length > 0) {
				timeline.fromTo(stopRows, { autoAlpha: 0, x: 18 }, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.1 }, 0.3);
			}
		},
		{ dependencies: [mode], scope: rootRef },
	);

	const handleTabKeyDown = (event: KeyboardEvent<HTMLElement>) => {
		const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
		if (!keys.includes(event.key)) return;
		const tabs = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[role='tab']") ?? []);
		if (tabs.length === 0) return;
		event.preventDefault();
		const currentIndex = Math.max(0, tabs.indexOf(event.currentTarget));
		let nextIndex = currentIndex;
		if (event.key === "Home") nextIndex = 0;
		else if (event.key === "End") nextIndex = tabs.length - 1;
		else if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % tabs.length;
		else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
			nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
		const next = tabs[nextIndex];
		next?.focus();
		next?.click();
	};

	return (
		<RevealScope>
			<section className="relative overflow-hidden bg-paper py-14 sm:py-16 lg:py-20" id="planner" ref={rootRef}>
				<div
					aria-hidden="true"
					className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-river/25 to-transparent"
				/>
				<div className="mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-16">
					<div className="grid gap-8 lg:grid-cols-12 lg:items-end">
						<div className="lg:col-span-7">
							<h2
								className="max-w-[13ch] text-balance font-display text-[clamp(2.75rem,5vw,5.5rem)] font-medium leading-[0.94] tracking-[-0.04em] text-river"
								data-reveal="heading"
							>
								{content.title}
							</h2>
						</div>
						<p
							className="max-w-xl text-base leading-7 text-ink-muted sm:text-lg sm:leading-8 lg:col-span-4 lg:col-start-9"
							data-reveal="fade"
						>
							{content.description}
						</p>
					</div>

					<div className="mt-12 lg:mt-14" data-testid="itinerary-selector">
						<div data-reveal="fade">
							<StepRule index="I" label={content.stepChoose} />
						</div>
						<p className="mt-3 max-w-xl text-sm leading-6 text-ink-muted" id="planner-choice-guidance">
							{content.choiceHint}
						</p>

						<div className="relative mt-6" data-reveal="fade" ref={listRef}>
							<span
								aria-hidden="true"
								className="absolute left-0 top-0 hidden h-[3px] bg-emas sm:block"
								ref={markerRef}
								style={{ width: 0 }}
							/>
							<div
								aria-describedby="planner-choice-guidance"
								aria-label={content.title}
								className="grid border border-river/25 bg-river/15 sm:grid-cols-4"
								role="tablist"
							>
								{itineraryCatalog.map((itinerary) => {
									const isSelected = itinerary.duration === mode;
									return (
										<button
											aria-controls="itinerary-panel"
											aria-selected={isSelected}
											className={cn(
												"group relative min-h-24 cursor-pointer border-b border-river/20 px-4 py-4 text-left transition-colors duration-300 last:border-b-0 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-emas sm:min-h-36 sm:border-r sm:border-b-0 sm:px-5 sm:py-7 sm:last:border-r-0 lg:px-7",
												isSelected
													? "bg-river text-paper shadow-[inset_3px_0_0_var(--th-emas)] sm:shadow-none"
													: "bg-paper text-ink hover:bg-paper-deep/70 active:bg-paper-deep",
											)}
											id={`itinerary-tab-${itinerary.duration}`}
											key={itinerary.id}
											onClick={() => selectDuration(itinerary.duration)}
											onKeyDown={handleTabKeyDown}
											role="tab"
											tabIndex={isSelected ? 0 : -1}
											type="button"
										>
											<span
												aria-hidden="true"
												className={cn(
													"absolute right-4 top-4 size-2 rotate-45 border transition-colors sm:right-5 sm:top-5",
													isSelected ? "border-emas bg-emas" : "border-river/55 bg-paper",
												)}
											/>
											<span className="flex w-full items-baseline justify-between gap-4 sm:block">
												<span
													className={cn(
														"block shrink-0 font-display text-[2.1rem] leading-none tracking-[-0.04em] transition-colors duration-300 sm:text-[clamp(2.2rem,2.6vw,3.25rem)]",
														isSelected ? "text-paper" : "text-river",
													)}
												>
													{formatHours(itinerary.totalDurationMinutes, locale)}
												</span>
												<span
													className={cn(
														"block text-[0.68rem] font-semibold uppercase tracking-[0.12em] transition-colors duration-300 sm:mt-4",
														isSelected ? "text-paper/60" : "text-ink-muted",
													)}
												>
													{formatDurationKind(itinerary.duration, locale)} · {itinerary.stops.length}{" "}
													{content.stopsUnit}
												</span>
											</span>
										</button>
									);
								})}
								<button
									aria-controls="itinerary-panel"
									aria-selected={mode === "ai"}
									className={cn(
										"group relative min-h-24 cursor-pointer px-4 py-4 text-left transition-colors duration-300 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-emas sm:min-h-36 sm:px-5 sm:py-7 lg:px-7",
										mode === "ai"
											? "bg-river text-paper shadow-[inset_3px_0_0_var(--th-emas)] sm:shadow-none"
											: "bg-paper text-ink hover:bg-paper-deep/70 active:bg-paper-deep",
									)}
									id="itinerary-tab-ai"
									onClick={() => setMode("ai")}
									onKeyDown={handleTabKeyDown}
									role="tab"
									tabIndex={mode === "ai" ? 0 : -1}
									type="button"
								>
									<span
										aria-hidden="true"
										className={cn(
											"absolute right-4 top-4 size-2 rotate-45 border transition-colors sm:right-5 sm:top-5",
											mode === "ai" ? "border-emas bg-emas" : "border-river/55 bg-paper",
										)}
									/>
									<span className="block w-full">
										<span
											className={cn(
												"block shrink-0 font-display text-[2.1rem] leading-none tracking-[-0.04em] transition-colors duration-300 sm:text-[clamp(1.8rem,2.2vw,2.75rem)]",
												mode === "ai" ? "text-paper" : "text-river",
											)}
										>
											{content.aiTabTitle}
										</span>
										<span
											className={cn(
												"mt-3 flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] transition-colors duration-300 sm:mt-4",
												mode === "ai" ? "text-paper/60" : "text-ink-muted",
											)}
										>
											<SparkleIcon aria-hidden="true" className="text-emas" size={13} weight="fill" />
											{content.aiTabHint}
										</span>
									</span>
								</button>
							</div>
						</div>

						<article
							aria-labelledby={mode === "ai" ? "itinerary-tab-ai" : `itinerary-tab-${selectedItinerary.duration}`}
							className="mt-12 lg:mt-14"
							id="itinerary-panel"
							role="tabpanel"
						>
							<div data-panel-item>
								<StepRule index="II" label={mode === "ai" ? content.stepAi : content.stepRoute} />
							</div>
							{mode === "ai" ? (
								<StopoverConcierge duration={lastDuration} locale={locale} />
							) : (
								<PlannerRoutePanel content={content} itinerary={selectedItinerary} locale={locale} />
							)}
						</article>

						<aside aria-label={content.dayTripLabel} className="mt-14 lg:mt-16" data-day-trip data-reveal="fade">
							<StepRule index="III" label={content.dayTripLabel} />
							<div className="mt-7 grid gap-8 lg:grid-cols-12 lg:gap-14">
								<div className="lg:col-span-5">
									<p className="flex items-center gap-3 font-display text-lg italic leading-none text-marwah">
										<span
											aria-hidden="true"
											className="size-2 shrink-0 rotate-45 border border-marwah bg-transparent"
										/>
										{content.dayTripEyebrow}
									</p>
									<p className="mt-4 max-w-md text-sm leading-6 text-ink-muted">{content.dayTripNote}</p>
								</div>
								<div className="lg:col-span-7">
									<div className="relative">
										<span
											aria-hidden="true"
											className="absolute bottom-2 left-[0.4375rem] top-2 w-px border-l border-dashed border-river/35"
										/>
										<ol>
											{dayTripPois.map((poi) => {
												const coordinates = poi.location.coordinates;
												return (
													<li
														className="relative grid grid-cols-[1rem_minmax(0,1fr)_auto] items-baseline gap-4 py-3.5 first:pt-0 sm:py-4"
														key={poi.id}
													>
														<span
															aria-hidden="true"
															className="relative top-[0.1rem] block size-[0.8125rem] rotate-45 border-2 border-emas bg-paper"
														/>
														<span className="min-w-0">
															<span className="block font-display text-[1.35rem] font-medium leading-7 text-ink sm:text-2xl sm:leading-7">
																{poi.name[locale]}
															</span>
															<span className="mt-1 block text-sm leading-6 text-ink-muted">
																{poi.location.label} · {poi.description[locale]}
															</span>
														</span>
														{coordinates ? (
															<a
																aria-label={`${locale === "id" ? "Buka rute ke" : "Open directions to"} ${poi.name[locale]}`}
																className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-river underline decoration-emas decoration-2 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emas"
																href={`https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`}
																rel="noreferrer"
																target="_blank"
															>
																{locale === "id" ? "Rute" : "Route"}
																<ArrowUpRightIcon aria-hidden="true" size={14} weight="bold" />
															</a>
														) : null}
													</li>
												);
											})}
										</ol>
									</div>
								</div>
							</div>
						</aside>
					</div>
				</div>
			</section>
		</RevealScope>
	);
}

type PlannerContent = (typeof homeContent)[Locale]["planner"];

function PlannerRoutePanel({
	content,
	itinerary,
	locale,
}: {
	content: PlannerContent;
	itinerary: (typeof itineraryCatalog)[number];
	locale: Locale;
}) {
	return (
		<>
			<div className="mt-7 grid gap-10 lg:grid-cols-12 lg:gap-14">
				<div className="lg:col-span-5">
					<p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-river-bright" data-panel-item>
						{itinerary.title[locale]}
					</p>
					<p
						className="mt-3 max-w-[24ch] font-display text-[clamp(1.75rem,2.4vw,2.5rem)] font-medium leading-[1.12] tracking-[-0.03em] text-ink"
						data-panel-item
					>
						{itinerary.summary[locale]}
					</p>
					<p className="mt-7 flex max-w-md gap-3 text-sm leading-6 text-ink-muted" data-panel-item>
						<span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rotate-45 bg-emas" />
						{itinerary.rationale[locale]}
					</p>
				</div>

				<div className="lg:col-span-7">
					<div className="relative">
						<span
							aria-hidden="true"
							className="absolute bottom-2 left-[0.4375rem] top-2 w-px bg-river/25"
							data-route-rail
						/>
						<ol>
							{itinerary.stops.map((stop) => {
								const poi = poiById.get(stop.poiId);
								if (!poi) return null;
								return (
									<li
										className="relative grid grid-cols-[1rem_minmax(0,1fr)_auto] items-baseline gap-4 py-3.5 first:pt-0 sm:py-4"
										key={stop.poiId}
									>
										<span
											aria-hidden="true"
											className="relative top-[0.05rem] block size-[0.9375rem] rounded-full border-2 border-paper bg-emas shadow-[0_0_0_1px_var(--th-emas)]"
											data-stop-dot
										/>
										<span className="min-w-0" data-stop-row>
											<span className="block font-display text-[1.35rem] font-medium leading-7 text-ink sm:text-2xl sm:leading-7">
												{poi.name[locale]}
											</span>
										</span>
										<span className="text-sm tabular-nums text-ink-muted" data-stop-row>
											{stop.visitDurationMinutes} {content.minutes}
										</span>
									</li>
								);
							})}
						</ol>
					</div>
				</div>
			</div>

			<div
				className="mt-10 flex flex-col gap-3 border-t border-river/15 pt-7 sm:flex-row sm:justify-end lg:mt-12"
				data-panel-item
			>
				<CreateCollaborativePlanButton
					busyLabel={content.creatingPlan}
					duration={itinerary.duration}
					errorLabel={content.createError}
					label={content.createPlan}
					locale={locale}
				/>
				<Link
					className="inline-flex min-h-11 items-center justify-center gap-2.5 border border-river/25 px-5 text-sm font-bold text-river transition-colors hover:border-river/60 hover:bg-paper-deep/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emas"
					href={`/peta?plan=${itinerary.duration}`}
				>
					{content.openPlan}
					<ArrowUpRightIcon aria-hidden="true" size={16} weight="bold" />
				</Link>
			</div>
		</>
	);
}
