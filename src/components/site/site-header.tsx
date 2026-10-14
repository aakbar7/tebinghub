"use client";

import { ArrowUpRightIcon, DiamondsFourIcon, XIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useLenis } from "@/components/providers/smooth-scroll-provider";
import type { Locale } from "@/domain";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/lib/motion";
import { LocaleSwitcher } from "./locale-switcher";

function normalizePathname(pathname: string) {
	return pathname.replace(/^\/(?:id|en)(?=\/|$)/, "") || "/";
}

export function SiteHeader({ locale }: { locale: Locale }) {
	const t = useTranslations("Nav");
	const pathname = usePathname();
	const lenis = useLenis();
	const normalizedPathname = normalizePathname(pathname);
	const isHome = normalizedPathname === "/";
	const [menuOpen, setMenuOpen] = useState(false);
	const headerRef = useRef<HTMLElement>(null);
	const beadRef = useRef<HTMLSpanElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const menuTimeline = useRef<gsap.core.Timeline | null>(null);
	const menuButtonRef = useRef<HTMLButtonElement>(null);
	const firstMenuLinkRef = useRef<HTMLAnchorElement>(null);
	const overlay = false;

	useEffect(() => {
		if (pathname) setMenuOpen(false);
	}, [pathname]);

	// Update scroll progress indicator along the header spine
	useGSAP(
		() => {
			const bead = beadRef.current;
			if (!bead || prefersReducedMotion()) return;

			ScrollTrigger.create({
				start: "top top",
				end: "max",
				onUpdate: (self) => {
					gsap.set(bead, { left: `${self.progress * 100}%` });
				},
			});
		},
		{ scope: headerRef },
	);

	// Compact header once scrolled past the top
	useGSAP(
		() => {
			const shell = headerRef.current?.querySelector<HTMLElement>(".site-header__shell");
			if (!shell) return;

			ScrollTrigger.create({
				start: 24,
				end: "max",
				onToggle: (self) => {
					shell.dataset.scrolled = String(self.isActive);
				},
			});
		},
		{ scope: headerRef },
	);

	useGSAP(
		() => {
			const panel = panelRef.current;
			if (!panel) return;
			gsap.set(panel, { clipPath: "inset(0% 0% 100% 0%)", visibility: "hidden" });

			menuTimeline.current = gsap
				.timeline({ paused: true })
				.set(panel, { visibility: "visible" })
				.to(panel, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.72, ease: "power4.inOut" })
				.from(
					panel.querySelectorAll("[data-menu-intro] > *"),
					{ autoAlpha: 0, y: 30, duration: 0.6, ease: "power3.out", stagger: 0.07 },
					"-=0.34",
				)
				.from(
					panel.querySelectorAll("[data-menu-link]"),
					{ autoAlpha: 0, y: 34, duration: 0.55, ease: "power3.out", stagger: 0.045 },
					"<+=0.08",
				)
				.from(
					panel.querySelectorAll("[data-menu-footer]"),
					{ autoAlpha: 0, y: 14, duration: 0.4, ease: "power2.out" },
					"-=0.3",
				);
		},
		{ scope: headerRef },
	);

	useEffect(() => {
		const timeline = menuTimeline.current;
		const panel = panelRef.current;
		if (!timeline || !panel) return;

		if (prefersReducedMotion()) {
			timeline.progress(menuOpen ? 1 : 0).pause();
			gsap.set(panel, { visibility: menuOpen ? "visible" : "hidden" });
			return;
		}

		if (menuOpen) {
			timeline.timeScale(1).play();
		} else {
			timeline.timeScale(1.6).reverse();
		}
	}, [menuOpen]);

	useEffect(() => {
		if (!menuOpen) return;

		lenis?.stop();
		const previousOverflow = document.body.style.overflow;
		const focusTimer = window.setTimeout(() => firstMenuLinkRef.current?.focus(), 120);
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setMenuOpen(false);
				window.setTimeout(() => menuButtonRef.current?.focus(), 0);
				return;
			}

			if (event.key !== "Tab") return;
			const focusableElements = Array.from(
				headerRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [],
			).filter((element) => element.offsetParent !== null && !element.closest("[inert]"));
			const firstFocusable = focusableElements[0];
			const lastFocusable = focusableElements.at(-1);

			if (event.shiftKey && document.activeElement === firstFocusable) {
				event.preventDefault();
				lastFocusable?.focus();
			} else if (!event.shiftKey && document.activeElement === lastFocusable) {
				event.preventDefault();
				firstFocusable?.focus();
			}
		};

		document.body.style.overflow = "hidden";
		document.addEventListener("keydown", onKeyDown);
		return () => {
			window.clearTimeout(focusTimer);
			document.body.style.overflow = previousOverflow;
			document.removeEventListener("keydown", onKeyDown);
			lenis?.start();
		};
	}, [menuOpen, lenis]);

	const links = [
		{ href: "/peta", label: t("map") },
		{ href: "/budaya", label: t("culture") },
		{ href: "/kuliner", label: t("food") },
		{ href: "/wisata", label: t("travel") },
		{ href: "/sejarah", label: t("history") },
		{ href: "/teknologi", label: t("technology") },
		{ href: "/rencana", label: t("plans") },
		{ href: "/tentang", label: t("about") },
	] as const;

	const isActive = (href: string) => normalizedPathname === href || normalizedPathname.startsWith(`${href}/`);

	return (
		<header className={cn("site-header", isHome ? "fixed inset-x-0 top-0" : "sticky top-0")} ref={headerRef}>
			<div className="site-header__shell" data-menu-open={menuOpen} data-overlay={overlay}>
				<div className="site-header__rail">
					<span aria-hidden="true" className="site-header__finial site-header__finial--left" />
					<span aria-hidden="true" className="site-header__finial site-header__finial--right" />
					<span aria-hidden="true" className="site-header__rail-ornament" />
					<Link
						className="site-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emas"
						data-overlay={overlay || menuOpen}
						href={{ pathname: "/", hash: "hero" }}
						onClick={(event) => {
							if (!isHome) return;
							event.preventDefault();
							const hero = document.getElementById("hero");
							if (!hero) return;
							if (lenis) {
								lenis.scrollTo(hero, { immediate: prefersReducedMotion() });
								return;
							}
							hero.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
						}}
					>
						<Image
							alt="TebingHub"
							className="site-brand__logo"
							height={480}
							priority
							src="/images/commemorative/tebinghub-logo-full.webp"
							width={1400}
						/>
					</Link>

					<div aria-hidden="true" className="site-header__spine">
						<span className="site-header__spine-line" />
						<span className="site-header__spine-bead" ref={beadRef} />
					</div>

					<div className="site-header__actions">
						<LocaleSwitcher locale={locale} transparent={overlay || menuOpen} />
						<button
							aria-controls="site-route-panel"
							aria-expanded={menuOpen}
							className="site-menu-toggle focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emas"
							data-open={menuOpen}
							data-overlay={overlay || menuOpen}
							onClick={() => setMenuOpen((open) => !open)}
							ref={menuButtonRef}
							type="button"
						>
							<span className="site-menu-toggle__index" aria-hidden="true">
								{menuOpen ? <XIcon size={14} weight="bold" /> : <DiamondsFourIcon size={14} weight="fill" />}
							</span>
							<span className="site-menu-toggle__label">
								{menuOpen ? (locale === "id" ? "Tutup" : "Close") : t("menu")}
							</span>
						</button>
					</div>
				</div>
			</div>

			<div
				aria-hidden={!menuOpen}
				className="site-route-panel"
				data-lenis-prevent
				id="site-route-panel"
				inert={!menuOpen}
				ref={panelRef}
			>
				<div className="site-route-panel__inner">
					<div className="site-route-panel__intro" data-menu-intro>
						<p className="site-route-panel__eyebrow">{t("chooseDirection")}</p>
						<p className="site-route-panel__title">{t("menuTitle")}</p>
						<p className="site-route-panel__description">{t("menuIntro")}</p>
					</div>

					<nav aria-label={t("primaryLabel")} className="site-route-panel__nav">
						{links.map((link, index) => {
							const active = isActive(link.href);
							return (
								<Link
									aria-current={active ? "page" : undefined}
									className="site-route-panel__link focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emas"
									data-active={active}
									data-menu-link
									href={link.href}
									key={link.href}
									onClick={() => setMenuOpen(false)}
									ref={index === 0 ? firstMenuLinkRef : undefined}
								>
									<span aria-hidden="true" className="site-route-panel__index">
										{String(index + 1).padStart(2, "0")}
									</span>
									<span className="site-route-panel__label">{link.label}</span>
									<span aria-hidden="true" className="site-route-panel__arrow">
										<ArrowUpRightIcon size={24} weight="light" />
									</span>
								</Link>
							);
						})}
					</nav>

					<div className="site-route-panel__footer" data-menu-footer>
						<span>
							{locale === "id"
								? `${links.length} arah untuk disinggahi`
								: `${links.length} directions worth stopping for`}
						</span>
						<span>Kota Tebing Tinggi · Sumatera Utara</span>
					</div>
					<div aria-hidden="true" className="site-route-panel__lisplang" />
				</div>
			</div>
		</header>
	);
}
