import { DEFAULT_VISIT_MINUTES, PLANNER_POI_IDS, type PlannerPoiId } from "./poi";

export type AiPoiCatalogEntry = {
	id: PlannerPoiId;
	name: { id: string; en: string };
	category: string;
	traits: string[];
	defaultVisitMinutes: number;
	lat: number;
	lng: number;
	boundary: "in-city-active";
};

// Prompt-only metadata; PLANNER_POI_IDS stays the allowlist authority.
export const AI_POI_CATALOG: readonly AiPoiCatalogEntry[] = [
	{
		id: "tugu-13-desember",
		name: { id: "Tugu 13 Desember", en: "13 December Monument" },
		category: "landmark",
		traits: ["sejarah", "landmark", "foto"],
		defaultVisitMinutes: 20,
		lat: 3.3275084,
		lng: 99.1623117,
		boundary: "in-city-active",
	},
	{
		id: "lemang-batok",
		name: { id: "Lemang Batok", en: "Lemang Batok" },
		category: "kuliner",
		traits: ["kuliner", "lemang", "kaki-lima"],
		defaultVisitMinutes: 30,
		lat: 3.329094,
		lng: 99.159653,
		boundary: "in-city-active",
	},
	{
		id: "sentra-lemang",
		name: { id: "Sentra Lemang Pusat Oleh-oleh", en: "Lemang centre at the souvenir complex" },
		category: "kuliner",
		traits: ["kuliner", "lemang", "oleh-oleh"],
		defaultVisitMinutes: 60,
		lat: 3.37238,
		lng: 99.166589,
		boundary: "in-city-active",
	},
	{
		id: "kedai-kopi-aghara",
		name: { id: "Kedai Kopi Aghara", en: "Aghara Coffee" },
		category: "kafe",
		traits: ["kopi", "kafe", "istirahat"],
		defaultVisitMinutes: 40,
		lat: 3.327773,
		lng: 99.16226,
		boundary: "in-city-active",
	},
	{
		id: "goodfella-tebing-tinggi",
		name: { id: "Goodfella Tebing Tinggi", en: "Goodfella Tebing Tinggi" },
		category: "kafe",
		traits: ["kopi", "kafe", "makanan"],
		defaultVisitMinutes: 60,
		lat: 3.323729,
		lng: 99.170468,
		boundary: "in-city-active",
	},
	{
		id: "legenda-cafe-tebing-tinggi",
		name: { id: "Legenda Cafe", en: "Legenda Cafe" },
		category: "kafe",
		traits: ["kopi", "kafe", "kuliner"],
		defaultVisitMinutes: 45,
		lat: 3.329238,
		lng: 99.161275,
		boundary: "in-city-active",
	},
	{
		id: "masjid-raya-nur-addin",
		name: { id: "Masjid Raya Nur Addin", en: "Nur Addin Grand Mosque" },
		category: "budaya",
		traits: ["budaya", "ibadah", "arsitektur"],
		defaultVisitMinutes: 30,
		lat: 3.3293865,
		lng: 99.1598896,
		boundary: "in-city-active",
	},
	{
		id: "puri-melayu-sri-menanti",
		name: { id: "Puri Melayu Sri Menanti", en: "Puri Melayu Sri Menanti" },
		category: "budaya",
		traits: ["budaya", "melayu", "rumah-adat"],
		defaultVisitMinutes: 30,
		lat: 3.334419,
		lng: 99.159915,
		boundary: "in-city-active",
	},
	{
		id: "taman-kota",
		name: { id: "Taman Kota", en: "City Park" },
		category: "ruang-publik",
		traits: ["ruang-hijau", "keluarga", "teduh", "taman"],
		defaultVisitMinutes: 45,
		lat: 3.3215028,
		lng: 99.1641968,
		boundary: "in-city-active",
	},
	{
		id: "rasio-seduh",
		name: { id: "Coffeeshop Rasio Seduh", en: "Rasio Seduh Coffee Shop" },
		category: "kafe",
		traits: ["kopi", "kafe", "santai"],
		defaultVisitMinutes: 45,
		lat: 3.3212201,
		lng: 99.1651266,
		boundary: "in-city-active",
	},
	{
		id: "masjid-agung",
		name: { id: "Masjid Agung Kota Tebing Tinggi", en: "Tebing Tinggi Grand Mosque" },
		category: "landmark",
		traits: ["budaya", "ibadah", "landmark"],
		defaultVisitMinutes: 45,
		lat: 3.3541081,
		lng: 99.166095,
		boundary: "in-city-active",
	},
	{
		id: "museum-kota",
		name: { id: "Museum Kota Tebing Tinggi", en: "Tebing Tinggi City Museum" },
		category: "heritage",
		traits: ["sejarah", "museum", "keluarga"],
		defaultVisitMinutes: 60,
		lat: 3.328668,
		lng: 99.162887,
		boundary: "in-city-active",
	},
	{
		id: "waterpark-gundaling",
		name: { id: "Waterpark Gundaling", en: "Gundaling Waterpark" },
		category: "rekreasi",
		traits: ["keluarga", "rekreasi", "air"],
		defaultVisitMinutes: 90,
		lat: 3.342634,
		lng: 99.190493,
		boundary: "in-city-active",
	},
	{
		id: "skuy-coffee",
		name: { id: "Skuy Coffee", en: "Skuy Coffee" },
		category: "kafe",
		traits: ["kopi", "kafe", "modern"],
		defaultVisitMinutes: DEFAULT_VISIT_MINUTES,
		lat: 3.3243186,
		lng: 99.1653224,
		boundary: "in-city-active",
	},
] as const;

const visitMinutesById = new Map<string, number>(AI_POI_CATALOG.map((entry) => [entry.id, entry.defaultVisitMinutes]));

export function defaultVisitMinutesFor(poiId: string): number {
	return visitMinutesById.get(poiId) ?? DEFAULT_VISIT_MINUTES;
}

export function getAiCatalogForPrompt() {
	return AI_POI_CATALOG.map((entry) => ({
		id: entry.id,
		name: entry.name,
		category: entry.category,
		traits: entry.traits,
		defaultVisitMinutes: entry.defaultVisitMinutes,
		lat: entry.lat,
		lng: entry.lng,
		boundary: entry.boundary,
	}));
}

export function assertAiCatalogCoversAllowlist() {
	const catalogIds = new Set(AI_POI_CATALOG.map((entry) => entry.id));
	for (const id of PLANNER_POI_IDS) {
		if (!catalogIds.has(id)) {
			throw new Error(`AI catalog missing planner POI: ${id}`);
		}
	}
	if (AI_POI_CATALOG.length !== PLANNER_POI_IDS.length) {
		throw new Error("AI catalog length does not match planner allowlist.");
	}
}
