"use client";

import Lenis from "lenis";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";

const LenisContext = createContext<Lenis | null>(null);

export function useLenis() {
	return useContext(LenisContext);
}

// Sync Lenis smooth scrolling with the GSAP ticker
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
	const [lenis, setLenis] = useState<Lenis | null>(null);

	useEffect(() => {
		if (prefersReducedMotion()) return;

		const instance = new Lenis({
			autoRaf: false,
			anchors: true,
			duration: 1.05,
			// Let nested scroll containers handle their own wheel events
			prevent: (node) => Boolean(node.closest("[data-lenis-prevent]")),
		});
		const update = (time: number) => instance.raf(time * 1000);

		instance.on("scroll", ScrollTrigger.update);
		gsap.ticker.add(update);
		gsap.ticker.lagSmoothing(0);
		setLenis(instance);
		ScrollTrigger.refresh();

		return () => {
			gsap.ticker.remove(update);
			instance.destroy();
			setLenis(null);
		};
	}, []);

	return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
