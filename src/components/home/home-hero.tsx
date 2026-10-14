"use client";

import { ArrowDownIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useRef } from "react";
import { homeContent } from "@/content/home";
import type { Locale } from "@/domain";
import { Link } from "@/i18n/navigation";
import { gsap, prefersReducedMotion, SplitText, useGSAP } from "@/lib/motion";

export function HomeHero({ locale }: { locale: Locale }) {
	const content = homeContent[locale].hero;
	const sectionRef = useRef<HTMLElement>(null);
	const next =
		locale === "id"
			? { kicker: "Selanjutnya", label: "Berapa lama kamu bisa singgah?" }
			: { kicker: "Up next", label: "How long can you stay?" };
	const coordinates = "3°19′ LU · 99°09′ BT";

	useGSAP(
		(_, contextSafe) => {
			if (prefersReducedMotion() || !contextSafe) return;
			const section = sectionRef.current;
			if (!section) return;

			let split: SplitText | null = null;

			const intro = contextSafe(() => {
				const title = section.querySelector<HTMLElement>("[data-hero-title]");
				if (!title) return;
				// Skip line masks so overhanging glyphs are not clipped during the reveal
				split = SplitText.create(title, { type: "lines" });

				gsap
					.timeline({
						defaults: { ease: "power4.out" },
						onComplete: () => {
							split?.revert();
							split = null;
						},
					})
					.to("[data-hero-frame-x]", { scaleX: 1, duration: 1.15, ease: "power2.inOut", stagger: 0.08 }, 0)
					.to("[data-hero-frame-y]", { scaleY: 1, duration: 1.15, ease: "power2.inOut", stagger: 0.08 }, 0)
					.to("[data-hero-kicker]", { autoAlpha: 1, letterSpacing: "0.2em", duration: 1 }, 0.2)
					.from(split.lines, { autoAlpha: 0, yPercent: 42, duration: 1.1, stagger: 0.09 }, 0.3)
					// Keep hero collage visible on first paint for LCP
					.fromTo("[data-hero-diorama]", { y: 40 }, { y: 0, duration: 1.15, ease: "power4.out" }, 0.55)
					.to("[data-hero-seam]", { scaleX: 1, duration: 0.9, ease: "power2.inOut" }, 0.7)
					.to("[data-hero-lede]", { autoAlpha: 1, y: 0, duration: 0.9 }, 0.9)
					.to("[data-hero-cta] .hero-action", { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.12 }, 1.05)
					.to("[data-hero-meta]", { autoAlpha: 1, y: 0, duration: 0.7 }, 1.3);
			});

			gsap.set("[data-hero-frame-x]", { scaleX: 0 });
			gsap.set("[data-hero-frame-y]", { scaleY: 0 });
			gsap.set("[data-hero-kicker]", { autoAlpha: 0, letterSpacing: "0.42em" });
			gsap.set("[data-hero-seam]", { scaleX: 0, transformOrigin: "left center" });
			gsap.set("[data-hero-lede]", { autoAlpha: 0, y: 22 });
			gsap.set("[data-hero-cta] .hero-action", { autoAlpha: 0, y: 16 });
			gsap.set("[data-hero-meta]", { autoAlpha: 0, y: 12 });

			document.fonts.ready.then(intro);

			gsap.to("[data-hero-diorama]", {
				yPercent: 6,
				ease: "none",
				scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true },
			});
			gsap.to("[data-hero-copy]", {
				yPercent: -8,
				autoAlpha: 0.25,
				ease: "none",
				scrollTrigger: { trigger: section, start: "top top", end: "bottom 35%", scrub: true },
			});

			return () => split?.revert();
		},
		{ scope: sectionRef },
	);

	return (
		<section className="home-hero" id="hero" ref={sectionRef}>
			<div aria-hidden="true" className="home-hero__poster-frame">
				<span className="home-hero__frame-line home-hero__frame-line--top" data-hero-frame-x />
				<span className="home-hero__frame-line home-hero__frame-line--bottom" data-hero-frame-x />
				<span className="home-hero__frame-line home-hero__frame-line--left" data-hero-frame-y />
				<span className="home-hero__frame-line home-hero__frame-line--right" data-hero-frame-y />
			</div>

			<div className="home-hero__stage">
				<div className="home-hero__copy" data-hero-copy>
					<p className="home-hero__kicker" data-hero-kicker>
						{content.eyebrow}
					</p>

					<h1 className="home-hero__title" data-hero-title>
						{content.title}
					</h1>

					<p className="home-hero__lede" data-hero-lede>
						{content.description}
					</p>

					<div className="hero-actions" data-hero-cta>
						<a
							className="hero-action hero-action--primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emas"
							href="#planner"
						>
							<span aria-hidden="true" className="hero-action__mark" />
							<span className="hero-action__label">{content.primaryCta}</span>
							<span aria-hidden="true" className="hero-action__arrow">
								<ArrowDownIcon size={17} weight="bold" />
							</span>
						</a>
						<Link
							className="hero-action hero-action--ghost focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-river"
							href="/peta"
						>
							<span className="hero-action__label">{content.secondaryCta}</span>
							<span aria-hidden="true" className="hero-action__arrow">
								<ArrowUpRightIcon size={17} weight="bold" />
							</span>
						</Link>
					</div>
				</div>

				<div className="home-hero__diorama" data-hero-diorama>
					<span aria-hidden="true" className="home-hero__ground-shadow" />
					<Image
						alt={content.imageAlt}
						className="home-hero__collage"
						decoding="sync"
						fetchPriority="high"
						fill
						preload
						sizes="(min-width: 64rem) 34rem, 88vw"
						src="/images/webp/hero-collage.webp"
					/>
				</div>
				<span aria-hidden="true" className="home-hero__seam" data-hero-seam />

				<div className="home-hero__foot" data-hero-meta>
					<a
						className="home-hero__next focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emas"
						href="#planner"
					>
						<span className="home-hero__next-kicker">
							<span aria-hidden="true" className="home-hero__next-patok" />
							{next.kicker}
						</span>
						<span className="home-hero__next-label">
							{next.label}
							<ArrowDownIcon aria-hidden="true" className="home-hero__next-arrow" size={15} weight="bold" />
						</span>
					</a>
					<p aria-hidden="true" className="home-hero__coordinates">
						{coordinates}
					</p>
				</div>
			</div>
		</section>
	);
}
