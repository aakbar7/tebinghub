export type CinemaCapability = {
	desktop: boolean;
	reducedMotion: boolean;
};

export type CinemaMode = "cinematic" | "still";

export function getCinemaMode(capability: CinemaCapability): CinemaMode {
	return capability.desktop && !capability.reducedMotion ? "cinematic" : "still";
}

export function detectCinemaCapability(): CinemaCapability {
	const desktop = window.matchMedia("(min-width: 1024px)").matches;
	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	return {
		desktop,
		reducedMotion,
	};
}
