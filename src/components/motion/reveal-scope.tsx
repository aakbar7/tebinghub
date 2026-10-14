"use client";

import { type ReactNode, useRef } from "react";
import { gsap, motionVocab, prefersReducedMotion, ScrollTrigger, SplitText, useGSAP } from "@/lib/motion";

type RevealScopeProps = {
	children: ReactNode;
	className?: string;
};

// Scroll-triggered reveal wrapper for [data-reveal="heading" | "fade" | "line" | "media"]
export function RevealScope({ children, className }: RevealScopeProps) {
	const rootRef = useRef<HTMLDivElement>(null);

	useGSAP(
		(_, contextSafe) => {
			if (prefersReducedMotion() || !contextSafe) return;
			const root = rootRef.current;
			if (!root) return;

			const splits: SplitText[] = [];

			const build = contextSafe(() => {
				for (const heading of gsap.utils.toArray<HTMLElement>("[data-reveal='heading']", root)) {
					const split = SplitText.create(heading, { type: "lines", mask: "lines" });
					splits.push(split);
					gsap.from(split.lines, {
						yPercent: 112,
						duration: motionVocab.duration,
						ease: motionVocab.ease,
						stagger: motionVocab.stagger,
						scrollTrigger: { trigger: heading, start: "top 88%", once: true },
					});
				}

				const fades = gsap.utils.toArray<HTMLElement>("[data-reveal='fade']", root);
				if (fades.length) {
					gsap.set(fades, { autoAlpha: 0, y: 26 });
					ScrollTrigger.batch(fades, {
						start: "top 90%",
						once: true,
						onEnter: (batch) =>
							gsap.to(batch, {
								autoAlpha: 1,
								y: 0,
								duration: motionVocab.durationSoft,
								ease: motionVocab.easeSoft,
								stagger: motionVocab.stagger,
							}),
					});
				}

				for (const line of gsap.utils.toArray<HTMLElement>("[data-reveal='line']", root)) {
					gsap.from(line, {
						scaleX: 0,
						transformOrigin: "left center",
						duration: motionVocab.duration,
						ease: motionVocab.easeSoft,
						scrollTrigger: { trigger: line, start: "top 92%", once: true },
					});
				}

				for (const media of gsap.utils.toArray<HTMLElement>("[data-reveal='media']", root)) {
					const frame = gsap.utils.toArray<HTMLElement>("[data-reveal-media-inner]", media);
					gsap.from(media, {
						clipPath: "inset(0% 0% 100% 0%)",
						duration: motionVocab.duration * 1.15,
						ease: motionVocab.ease,
						scrollTrigger: { trigger: media, start: "top 85%", once: true },
					});
					if (frame.length) {
						gsap.from(frame, {
							scale: 1.08,
							duration: motionVocab.duration * 1.4,
							ease: motionVocab.easeSoft,
							scrollTrigger: { trigger: media, start: "top 85%", once: true },
						});
					}
				}

				ScrollTrigger.refresh();
			});

			// Wait for fonts before splitting text
			document.fonts.ready.then(build);

			return () => {
				for (const split of splits) split.revert();
			};
		},
		{ scope: rootRef },
	);

	return (
		<div className={className} ref={rootRef}>
			{children}
		</div>
	);
}
