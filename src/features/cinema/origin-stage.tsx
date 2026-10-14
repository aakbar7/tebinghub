"use client";

import Image from "next/image";
import { type RefObject, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion";
import { type CinemaMode, detectCinemaCapability, getCinemaMode } from "./capability";
import type { OriginBeat } from "./origin-content";

function OriginVisual({ beat }: { beat: OriginBeat }) {
	const hasMedia = Boolean(beat.mediaPath);
	return (
		<div aria-hidden="true" className={`origin-visual origin-visual-${beat.tone}`}>
			{beat.mediaPath ? (
				<Image
					alt=""
					className="origin-visual__image"
					fill
					sizes="(min-width: 1024px) 52vw, 100vw"
					src={beat.mediaPath}
				/>
			) : null}
			{hasMedia ? null : (
				<>
					<div className="origin-visual__field" />
					<div className="origin-visual__route" />
					<div className="origin-visual__marker" />
				</>
			)}
			<div className="origin-visual__shade" />
			<div className="origin-visual__caption">
				<span>{beat.year}</span>
			</div>
		</div>
	);
}

function StillSequence({ beats }: { beats: readonly OriginBeat[] }) {
	return (
		<div className="relative isolate">
			<div aria-hidden="true" className="origin-stage__motif origin-stage__motif--still" />
			<ol className="relative mx-auto max-w-[90rem] px-5 pb-20 sm:px-8 sm:pb-28 lg:px-16 lg:pb-36">
				{beats.map((beat) => (
					<li
						className="grid gap-8 border-t border-paper/16 py-10 sm:py-14 lg:grid-cols-12 lg:items-center lg:gap-8"
						key={beat.id}
					>
						<div className="lg:col-span-6">
							<OriginVisual beat={beat} />
						</div>
						<article className="lg:col-span-5 lg:col-start-8">
							<p className="font-display text-2xl italic text-emas">{beat.year}</p>
							<h3 className="mt-4 font-display text-[clamp(2rem,4vw,4.25rem)] font-medium leading-none tracking-[-0.035em]">
								{beat.title}
							</h3>
							<p className="mt-5 max-w-xl text-base leading-7 text-paper/72 sm:text-lg sm:leading-8">{beat.body}</p>
						</article>
					</li>
				))}
			</ol>
		</div>
	);
}

function CinematicSequence({
	beats,
	stageRef,
}: {
	beats: readonly OriginBeat[];
	stageRef: RefObject<HTMLDivElement | null>;
}) {
	return (
		<>
			<ol className="sr-only">
				{beats.map((beat) => (
					<li key={beat.id}>
						<h3>{beat.title}</h3>
						<p>{beat.body}</p>
					</li>
				))}
			</ol>

			<div data-active-beat="0" ref={stageRef}>
				<div className="relative min-h-[100dvh] overflow-hidden">
					<div aria-hidden="true" className="origin-stage__motif" />
					<svg
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 h-full w-full opacity-30"
						fill="none"
						preserveAspectRatio="xMidYMid slice"
						viewBox="0 0 1440 900"
					>
						<path
							d="M-40 130 C 190 210, 260 60, 470 150 S 780 330, 940 260 S 1240 120, 1360 300 C 1430 410, 1300 520, 1140 540 S 820 500, 660 620 S 380 830, 120 760"
							data-river-path
							stroke="#D5A32B"
							strokeLinecap="round"
							strokeWidth="1.6"
						/>
					</svg>

					{beats.map((beat, index) => (
						<div
							aria-hidden="true"
							className={`grid content-center px-5 py-20 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:px-16 ${
								index === 0 ? "relative min-h-[100dvh]" : "absolute inset-0"
							}`}
							data-beat-panel={index}
							key={beat.id}
						>
							<div className="relative lg:col-span-7" data-beat-visual>
								<OriginVisual beat={beat} />
							</div>
							<article className="relative mt-10 lg:col-span-4 lg:col-start-9 lg:mt-0">
								<p className="flex items-baseline gap-4 font-display text-[clamp(2.5rem,4vw,4rem)] italic leading-[0.9] tracking-[-0.035em] text-emas">
									{beat.year}
									<span className="text-sm not-italic tracking-normal text-paper/50">
										{String(index + 1).padStart(2, "0")} / {String(beats.length).padStart(2, "0")}
									</span>
								</p>
								<h3 className="mt-6 max-w-[11ch] text-balance font-display text-[clamp(2.5rem,3.6vw,4.25rem)] font-medium leading-[0.98] tracking-[-0.04em]">
									{beat.title}
								</h3>
								<p className="mt-6 max-w-[34rem] text-[clamp(1rem,1.35vw,1.125rem)] leading-8 text-paper/76">
									{beat.body}
								</p>
							</article>
						</div>
					))}

					<div
						aria-hidden="true"
						className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex"
					>
						{beats.map((beat, index) => (
							<span
								className="block size-2 rounded-full bg-paper/25 transition-all duration-300 data-[active=true]:scale-125 data-[active=true]:bg-emas"
								data-active={index === 0}
								data-beat-dot
								key={beat.id}
							/>
						))}
					</div>
				</div>
			</div>
		</>
	);
}

// Relative timeline units per scrubbed chapter transition
const SEGMENT = 1.4;
const DWELL = 0.55;

function killOriginScrollTriggers(root: HTMLElement | null) {
	if (!root) return;
	for (const trigger of ScrollTrigger.getAll()) {
		const node = trigger.trigger;
		if (!(node instanceof Element)) continue;
		if (node === root || root.contains(node)) {
			// Revert pin spacers while the cinematic DOM is still mounted
			trigger.kill(true);
		}
	}
}

export function OriginStage({ beats }: { beats: readonly OriginBeat[] }) {
	const rootRef = useRef<HTMLDivElement>(null);
	const stageRef = useRef<HTMLDivElement>(null);
	const modeRef = useRef<CinemaMode>("still");
	const [mode, setMode] = useState<CinemaMode>("still");

	useEffect(() => {
		const desktop = window.matchMedia("(min-width: 1024px)");
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
		const updateMode = () => {
			const next = getCinemaMode(detectCinemaCapability());
			if (next === modeRef.current) return;
			// Clean up GSAP pin wrappers before React unmounts
			if (modeRef.current === "cinematic") {
				killOriginScrollTriggers(rootRef.current);
			}
			modeRef.current = next;
			setMode(next);
		};
		updateMode();
		desktop.addEventListener("change", updateMode);
		reduced.addEventListener("change", updateMode);
		return () => {
			desktop.removeEventListener("change", updateMode);
			reduced.removeEventListener("change", updateMode);
			killOriginScrollTriggers(rootRef.current);
		};
	}, []);

	useGSAP(
		() => {
			if (mode !== "cinematic") return;
			const root = rootRef.current;
			const stage = stageRef.current;
			if (!root || !stage) return;

			const panels = gsap.utils.toArray<HTMLElement>("[data-beat-panel]", stage);
			const dots = gsap.utils.toArray<HTMLElement>("[data-beat-dot]", stage);
			if (panels.length === 0) return;

			gsap.set(panels, { autoAlpha: 0 });
			gsap.set(panels[0], { autoAlpha: 1 });

			const setActive = (index: number) => {
				stage.dataset.activeBeat = String(index);
				dots.forEach((dot, dotIndex) => {
					dot.dataset.active = String(dotIndex === index);
				});
			};
			setActive(0);

			const timeline = gsap.timeline({
				defaults: { ease: "none" },
				scrollTrigger: {
					trigger: root,
					start: "top top",
					end: () => `+=${(beats.length - 1) * 100}%`,
					pin: stage,
					pinSpacing: true,
					scrub: 0.8,
					snap: {
						snapTo: "labelsDirectional",
						duration: { min: 0.2, max: 0.6 },
						delay: 0.1,
						ease: "power2.inOut",
					},
					invalidateOnRefresh: true,
					onUpdate: (self) => {
						setActive(Math.min(beats.length - 1, Math.round(self.progress * (beats.length - 1))));
					},
				},
			});

			timeline.addLabel("beat-0");
			for (let index = 1; index < panels.length; index += 1) {
				const previous = panels[index - 1];
				const next = panels[index];
				const at = `beat-${index - 1}+=${DWELL}`;

				timeline
					.to(previous, { autoAlpha: 0, y: -44, duration: SEGMENT * 0.42, ease: "power1.in" }, at)
					.fromTo(
						next,
						{ autoAlpha: 0, y: 48 },
						{ autoAlpha: 1, y: 0, duration: SEGMENT * 0.48, ease: "power1.out" },
						`beat-${index - 1}+=${DWELL + SEGMENT * 0.3}`,
					)
					.fromTo(
						next.querySelector("[data-beat-visual]"),
						{ scale: 1.06 },
						{ scale: 1, duration: SEGMENT * 0.6, ease: "power1.out" },
						`beat-${index - 1}+=${DWELL + SEGMENT * 0.3}`,
					)
					.addLabel(`beat-${index}`, `beat-${index - 1}+=${SEGMENT}`);
			}
			// Hold the final chapter briefly before unpinning
			timeline.to({}, { duration: DWELL });

			const river = stage.querySelector("[data-river-path]");
			if (river) {
				timeline.fromTo(river, { drawSVG: "0%" }, { drawSVG: "100%", duration: timeline.duration() }, 0);
			}
		},
		{ dependencies: [mode, beats], scope: rootRef, revertOnUpdate: true },
	);

	return (
		<div data-cinema-mode={mode} ref={rootRef}>
			{mode === "still" ? <StillSequence beats={beats} /> : <CinematicSequence beats={beats} stageRef={stageRef} />}
		</div>
	);
}
