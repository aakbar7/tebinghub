"use client";

import { ArrowRightIcon, MapPinIcon } from "@phosphor-icons/react";
import { useMemo, useRef, useState } from "react";
import { RevealScope } from "@/components/motion/reveal-scope";
import { atlasContent, getAtlasLabels } from "@/content/atlas";
import type { Locale } from "@/domain";
import { AtlasMapIsland } from "@/features/atlas/atlas-map-island";
import type { CafeAtlasCollection } from "@/features/atlas/cafe-data";
import { buildAtlasPlaces } from "@/features/atlas/model";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion";

const EMPTY_CAFES: CafeAtlasCollection = { type: "FeatureCollection", features: [] };

export function AtlasTeaser({ locale }: { locale: Locale }) {
	const content = atlasContent[locale];
	const labels = getAtlasLabels(locale);
	const places = useMemo(
		() =>
			buildAtlasPlaces(locale, EMPTY_CAFES).filter(
				(place) =>
					place.scope === "in-city" &&
					["tugu-13-desember", "lemang-batok", "masjid-raya-nur-addin", "taman-kota"].includes(place.id),
			),
		[locale],
	);
	const [selectedId, setSelectedId] = useState<string | undefined>(places[0]?.id);
	const selected = places.find((place) => place.id === selectedId);
	const rootRef = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			if (prefersReducedMotion()) return;
			gsap.fromTo(
				"[data-atlas-detail] > *",
				{ autoAlpha: 0, y: 14 },
				{ autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.06 },
			);
		},
		{ dependencies: [selectedId], scope: rootRef },
	);

	return (
		<RevealScope>
			<section
				className="relative isolate overflow-hidden bg-river py-14 text-paper sm:py-16 lg:py-20"
				id="atlas"
				ref={rootRef}
			>
				<div
					aria-hidden="true"
					className="th-awan-larat th-awan-larat-from-right absolute inset-y-0 right-0 w-[42%] opacity-12"
				/>
				<div className="relative mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-16">
					<div className="grid gap-8 lg:grid-cols-12 lg:items-end">
						<div className="lg:col-span-7">
							<h2
								className="max-w-[12ch] text-balance font-display text-[clamp(2.75rem,5vw,5.5rem)] font-medium leading-[0.92] tracking-[-0.04em] text-white"
								data-reveal="heading"
							>
								{content.title}
							</h2>
						</div>
						<p
							className="max-w-xl text-base leading-7 text-paper/72 sm:text-lg sm:leading-8 lg:col-span-4 lg:col-start-9"
							data-reveal="fade"
						>
							{content.description}
						</p>
					</div>

					<div className="relative mt-10 lg:mt-12" data-reveal="media">
						<div className="relative overflow-hidden border border-paper/15">
							<div className="h-[30rem] sm:h-[34rem] lg:h-[38rem]" data-reveal-media-inner>
								<AtlasMapIsland
									cafes={EMPTY_CAFES}
									fill
									locale={locale}
									onSelect={setSelectedId}
									places={places}
									routeCoordinates={[]}
									selected={selected}
									showPopup={false}
									variant="night"
								/>
							</div>

							<div
								aria-hidden="true"
								className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgb(4_18_15_/_0.55)]"
							/>
						</div>

						<div className="pointer-events-none lg:absolute lg:inset-y-6 lg:left-6 lg:flex lg:w-[24rem] lg:flex-col">
							<div className="pointer-events-auto mt-6 flex flex-col border border-paper/18 bg-[#0B2823]/88 backdrop-blur-md lg:mt-0 lg:h-full">
								<div className="border-b border-paper/14 px-6 pb-4 pt-5">
									<p className="flex items-center gap-2.5 font-display text-lg italic leading-none text-emas">
										<span aria-hidden="true" className="size-1.5 shrink-0 rotate-45 bg-emas" />
										{locale === "id" ? "Empat titik awal" : "Four places to begin"}
									</p>
								</div>

								<div className="flex-1 px-6">
									{places.map((place) => {
										const isSelected = selectedId === place.id;
										return (
											<button
												aria-pressed={isSelected}
												className={cn(
													"group grid w-full grid-cols-[1.9rem_1fr_auto] items-baseline gap-2 border-b border-paper/10 py-4 text-left transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emas",
													isSelected ? "text-white" : "text-paper/55 hover:text-paper/85",
												)}
												key={place.id}
												onClick={() => setSelectedId(place.id)}
												type="button"
											>
												<span
													aria-hidden="true"
													className={cn(
														"relative top-[-0.1em] inline-block size-2 rotate-45 border transition-colors duration-300",
														isSelected
															? "border-emas bg-emas"
															: "border-paper/40 bg-transparent group-hover:border-paper/70",
													)}
												/>
												<span className="font-display text-lg font-medium leading-6 sm:text-xl">{place.name}</span>
												<span
													aria-hidden="true"
													className={cn(
														"text-sm transition-transform duration-300",
														isSelected
															? "translate-x-0 text-emas"
															: "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-60",
													)}
												>
													<MapPinIcon size={16} weight="fill" />
												</span>
											</button>
										);
									})}
								</div>

								{selected ? (
									<div className="border-t border-emas/40 bg-[#0E2E29]/80 px-6 py-5" data-atlas-detail>
										<p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-emas">
											{labels.category[selected.category]}
										</p>
										<p className="mt-2 font-display text-2xl font-medium leading-7 text-white">{selected.name}</p>
										<p className="mt-2 text-xs leading-5 text-paper/65">
											{selected.verification === "review-needed" ? content.reviewNeeded : selected.address}
										</p>
										<a
											className="mt-3 inline-flex min-h-9 items-center gap-2 text-xs font-bold text-paper/80 underline decoration-emas/70 underline-offset-4 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emas"
											href={selected.mapsUrl}
											rel="noreferrer"
											target="_blank"
										>
											<MapPinIcon aria-hidden="true" size={14} weight="fill" />
											{locale === "id" ? "Rute di Google Maps" : "Directions in Google Maps"}
										</a>
									</div>
								) : null}

								<Link
									className="group flex min-h-13 items-center justify-between gap-4 border-t border-paper/14 px-6 py-4 text-sm font-bold text-emas focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-emas"
									href={selected ? `/peta?poi=${selected.id}` : "/peta"}
								>
									{locale === "id" ? "Buka atlas lengkap" : "Open the full atlas"}
									<span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
										<ArrowRightIcon size={18} weight="bold" />
									</span>
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>
		</RevealScope>
	);
}
