import { afterEach, describe, expect, it, vi } from "vitest";
import { mediaManifest } from "@/content/media-manifest";
import { detectCinemaCapability, getCinemaMode } from "@/features/cinema/capability";
import { landmarkStories } from "@/features/cinema/landmark-content";
import { originStories } from "@/features/cinema/origin-content";

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe("cinema capability", () => {
	it("uses cinematic mode only for capable desktop visitors", () => {
		expect(getCinemaMode({ desktop: true, reducedMotion: false })).toBe("cinematic");
		expect(getCinemaMode({ desktop: false, reducedMotion: false })).toBe("still");
		expect(getCinemaMode({ desktop: true, reducedMotion: true })).toBe("still");
		expect(getCinemaMode({ desktop: true, reducedMotion: false })).toBe("cinematic");
	});

	it("uses only viewport and motion signals for the visual mode", () => {
		let reducedMotion = false;
		vi.stubGlobal(
			"matchMedia",
			vi.fn((query: string) => ({
				matches: query === "(min-width: 1024px)" || (query.includes("reduced-motion") && reducedMotion),
			})),
		);

		expect(detectCinemaCapability()).toEqual({ desktop: true, reducedMotion: false });

		reducedMotion = true;
		expect(detectCinemaCapability()).toEqual({ desktop: true, reducedMotion: true });
	});
});

describe("cinema content", () => {
	it("keeps six equivalent sourced origin beats in both locales", () => {
		expect(originStories.id.beats).toHaveLength(6);
		expect(originStories.en.beats).toHaveLength(6);
		expect(originStories.en.beats.map((beat) => beat.id)).toEqual(originStories.id.beats.map((beat) => beat.id));
		for (const story of Object.values(originStories)) {
			expect(
				story.beats.every((beat) => beat.title.length > 0 && beat.body.length > 0 && beat.sourceIds.length > 0),
			).toBe(true);
		}
	});

	it("keeps the landmark gallery active and excludes the historical palace", () => {
		expect(landmarkStories).toHaveLength(5);
		expect(landmarkStories.some((landmark) => String(landmark.poiId) === "istana-negeri-padang")).toBe(false);
		expect(landmarkStories.filter((landmark) => landmark.poiId !== null).map((landmark) => landmark.poiId)).toEqual([
			"tugu-13-desember",
			"tugu-simpang-beo",
			"patung-kuda-simpang-dolok",
			"selamat-datang",
			"masjid-agung",
		]);
	});

	it("keeps the production media surface image-led", () => {
		expect(mediaManifest.filter((entry) => entry.status === "ready").map((entry) => entry.id)).toEqual([
			"cafes-geojson",
			"landmark-tugu-13-desember-hero",
			"landmark-tugu-13-desember-isolated",
			"landmark-patung-kuda",
			"landmark-tugu-simpang-beo",
			"landmark-masjid-agung",
			"landmark-puri-melayu-sri-menanti",
			"landmark-tugu-selamat-datang",
			"origin-istana-pre-fire",
			"origin-istana-post-fire",
			"planned-food-lemang-batok",
			"planned-food-roti-kacang",
			"planned-food-halua",
			"planned-made-rm-deblot-sundoro",
			"planned-made-soekarno-tino",
			"planned-made-ansyari-bene",
			"planned-culture-masjid-raya-nur-addin",
			"planned-culture-songket-melayu",
			"planned-travel-museum-taman-kota",
			"planned-travel-kong-mah",
			"planned-travel-fantasy-waterpark",
			"planned-travel-bah-bolon-batu-nongol",
			"planned-travel-danau-laut-tador",
			"planned-travel-bartong",
			"planned-modern-tol-mktt-panorama",
			"origin-arus-sungai-padang",
			"origin-tanjung-marulak",
			"origin-tebing-tinggi",
		]);
	});

	it("keeps the corrected place media ready at their published paths", () => {
		const correctedAssets = new Map([
			["landmark-puri-melayu-sri-menanti", "/images/webp/puri-melayu-sri-menanti-v2.webp"],
			["planned-travel-museum-taman-kota", "/images/webp/museum-kota-tebing-tinggi-v2.webp"],
			["planned-travel-kong-mah", "/images/webp/taman-rekreasi-kong-mah-v2.webp"],
			["planned-modern-tol-mktt-panorama", "/images/webp/tol-mktt-panorama-v2.webp"],
		]);

		for (const [id, path] of correctedAssets) {
			const entry = mediaManifest.find((item) => item.id === id);
			expect(entry?.status).toBe("ready");
			expect(entry?.path).toBe(path);
		}
	});

	it("uses the three interpretive origin visuals without presenting them as historical photographs", () => {
		for (const story of Object.values(originStories)) {
			expect(story.beats.slice(0, 3).map((beat) => beat.mediaPath)).toEqual([
				"/images/webp/origin-sungai-padang.webp",
				"/images/webp/origin-tanjung-marulak.webp",
				"/images/webp/origin-tebing-tinggi.webp",
			]);
			expect(story.beats[1]?.body.toLowerCase()).toMatch(/interpret|ingatan/);
		}
	});
});
