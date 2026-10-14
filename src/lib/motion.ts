"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip, DrawSVGPlugin);

export function prefersReducedMotion(): boolean {
	return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const motionVocab = {
	ease: "power4.out",
	easeSoft: "power2.out",
	duration: 1.1,
	durationSoft: 0.8,
	stagger: 0.08,
} as const;

export { DrawSVGPlugin, Flip, gsap, ScrollTrigger, SplitText, useGSAP };
