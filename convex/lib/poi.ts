export const PLANNER_POI_IDS = [
	"tugu-13-desember",
	"lemang-batok",
	"sentra-lemang",
	"kedai-kopi-aghara",
	"goodfella-tebing-tinggi",
	"legenda-cafe-tebing-tinggi",
	"masjid-raya-nur-addin",
	"puri-melayu-sri-menanti",
	"taman-kota",
	"rasio-seduh",
	"masjid-agung",
	"museum-kota",
	"waterpark-gundaling",
	"skuy-coffee",
] as const;

export type PlannerPoiId = (typeof PLANNER_POI_IDS)[number];

const plannerPoiSet = new Set<string>(PLANNER_POI_IDS);

export function isPlannerPoiId(value: string): value is PlannerPoiId {
	return plannerPoiSet.has(value);
}

export const MAX_PLAN_STOPS = 12;
export const MAX_PLAN_TITLE_LENGTH = 80;
export const DEFAULT_VISIT_MINUTES = 30;

export type SeedStop = {
	poiId: PlannerPoiId;
	visitDurationMinutes: number;
};

const seeds: Record<"two-hours" | "half-day" | "full-day", { title: { id: string; en: string }; stops: SeedStop[] }> = {
	"two-hours": {
		title: { id: "Dua jam, tiga rasa kota", en: "Two hours, three city notes" },
		stops: [
			{ poiId: "tugu-13-desember", visitDurationMinutes: 20 },
			{ poiId: "lemang-batok", visitDurationMinutes: 30 },
			{ poiId: "kedai-kopi-aghara", visitDurationMinutes: 40 },
		],
	},
	"half-day": {
		title: { id: "Setengah hari, berjalan pelan", en: "Half a day, taken slowly" },
		stops: [
			{ poiId: "tugu-13-desember", visitDurationMinutes: 30 },
			{ poiId: "masjid-raya-nur-addin", visitDurationMinutes: 30 },
			{ poiId: "puri-melayu-sri-menanti", visitDurationMinutes: 30 },
			{ poiId: "lemang-batok", visitDurationMinutes: 45 },
			{ poiId: "taman-kota", visitDurationMinutes: 45 },
			{ poiId: "legenda-cafe-tebing-tinggi", visitDurationMinutes: 45 },
		],
	},
	"full-day": {
		title: { id: "Sehari penuh di dalam kota", en: "A full day within the city" },
		stops: [
			{ poiId: "sentra-lemang", visitDurationMinutes: 60 },
			{ poiId: "masjid-agung", visitDurationMinutes: 45 },
			{ poiId: "museum-kota", visitDurationMinutes: 60 },
			{ poiId: "waterpark-gundaling", visitDurationMinutes: 90 },
			{ poiId: "taman-kota", visitDurationMinutes: 45 },
			{ poiId: "goodfella-tebing-tinggi", visitDurationMinutes: 60 },
		],
	},
};

export function getSeedForDuration(duration: "two-hours" | "half-day" | "full-day", locale: "id" | "en") {
	const seed = seeds[duration];
	return {
		title: seed.title[locale],
		stops: seed.stops,
	};
}

export type PlanTitleSource = "seed" | "user" | "ai";

export function inferPlanTitleSource(plan: {
	title: string;
	duration: "two-hours" | "half-day" | "full-day";
	locale: "id" | "en";
	titleSource?: PlanTitleSource;
}): PlanTitleSource {
	if (plan.titleSource) return plan.titleSource;
	// Legacy docs omit the field. Matching the duration seed keeps unknown custom titles as user-owned.
	const seed = getSeedForDuration(plan.duration, plan.locale);
	return plan.title === seed.title ? "seed" : "user";
}

export function clampPlanTitle(title: string) {
	return title.trim().slice(0, MAX_PLAN_TITLE_LENGTH);
}

export function createStopId() {
	return `stop_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
}

export function generateEditToken() {
	const bytes = new Uint8Array(24);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashEditKey(token: string) {
	const data = new TextEncoder().encode(token);
	const digest = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export type PlanStop = {
	id: string;
	poiId: string;
	visitDurationMinutes: number;
};

export function assertValidStops(stops: PlanStop[]) {
	if (stops.length === 0) {
		throw new Error("Plan must include at least one stop.");
	}
	if (stops.length > MAX_PLAN_STOPS) {
		throw new Error(`Plan cannot exceed ${MAX_PLAN_STOPS} stops.`);
	}
	const seen = new Set<string>();
	for (const stop of stops) {
		if (!isPlannerPoiId(stop.poiId)) {
			throw new Error(`POI is not allowed in collaborative plans: ${stop.poiId}`);
		}
		if (seen.has(stop.poiId)) {
			throw new Error("Plan stops must use unique POI IDs.");
		}
		seen.add(stop.poiId);
		if (
			!Number.isFinite(stop.visitDurationMinutes) ||
			stop.visitDurationMinutes < 5 ||
			stop.visitDurationMinutes > 240
		) {
			throw new Error("Visit duration must be between 5 and 240 minutes.");
		}
	}
}
