import Image from "next/image";
import { mediaManifest } from "@/content/media-manifest";
import type { Locale } from "@/domain";

type EditorialMediaItem = {
	id: string;
	path: string;
	alt: { id: string; en: string };
	caption: { id: string; en: string };
	width: number;
	height: number;
	layout: "feature" | "landscape" | "panorama" | "portrait" | "square";
};

function mediaItem(
	id: string,
	width: number,
	height: number,
	layout: EditorialMediaItem["layout"],
	caption: EditorialMediaItem["caption"],
): EditorialMediaItem {
	const entry = mediaManifest.find((candidate) => candidate.id === id);
	if (entry?.kind !== "image" || !("alt" in entry) || !entry.alt) {
		throw new Error(`Editorial media ${id} is not ready`);
	}
	return { id, path: entry.path, alt: entry.alt, caption, width, height, layout };
}

function mediaSizes(item: EditorialMediaItem, sectionId: string): string {
	const fullWidth =
		item.layout === "panorama" || sectionId === "modern" || (sectionId === "made" && item.layout === "feature");
	const desktopWidth = fullWidth
		? "92vw"
		: item.layout === "feature"
			? "67vw"
			: item.layout === "landscape"
				? "50vw"
				: "42vw";
	return `(min-width: 1024px) ${desktopWidth}, calc(100vw - 2.5rem)`;
}

const mediaBySection: Partial<Record<string, readonly EditorialMediaItem[]>> = {
	history: [
		mediaItem("origin-arus-sungai-padang", 1456, 720, "panorama", {
			id: "Interpretasi editorial Sungai Padang sekitar 1864 (bukan foto sejarah).",
			en: "An editorial interpretation of the Padang River around 1864 (not a historical photograph).",
		}),
		mediaItem("origin-tanjung-marulak", 1248, 832, "feature", {
			id: "Interpretasi visual ingatan tempat di tepian Sungai Padang; bukan dokumentasi titik pendaratan historis.",
			en: "A visual interpretation of place-memory on the Padang River bank; not documentation of a historical landing point.",
		}),
		mediaItem("origin-tebing-tinggi", 912, 1152, "portrait", {
			id: "Interpretasi medan tebing yang lebih tinggi (bukan bukti lokasi permukiman presisi).",
			en: "A higher-riverbank terrain interpretation (not evidence of a precise settlement site).",
		}),
		mediaItem("origin-istana-pre-fire", 2512, 1680, "landscape", {
			id: "Istana Negeri Padang sebelum kebakaran.",
			en: "Negeri Padang Palace before the fire.",
		}),
		mediaItem("origin-istana-post-fire", 2512, 1680, "landscape", {
			id: "Dokumentasi sisa Istana Negeri Padang setelah kebakaran.",
			en: "Documentation of the Negeri Padang Palace remains after the fire.",
		}),
	],
	culture: [
		mediaItem("planned-culture-masjid-raya-nur-addin", 1184, 880, "landscape", {
			id: "Interpretasi arsitektur Masjid Raya Nur Addin",
			en: "An architectural interpretation of Nur Addin Grand Mosque",
		}),
		mediaItem("planned-culture-songket-melayu", 912, 1152, "portrait", {
			id: "Ilustrasi proses menenun songket Melayu",
			en: "An illustration of Malay songket weaving",
		}),
	],
	travel: [
		mediaItem("planned-travel-museum-taman-kota", 1600, 1000, "feature", {
			id: "Dalam kota · Museum Kota Tebing Tinggi",
			en: "In the city · Tebing Tinggi City Museum",
		}),
		mediaItem("planned-travel-kong-mah", 1600, 720, "panorama", {
			id: "Dalam kota · Taman Rekreasi Kong-Mah",
			en: "In the city · Kong-Mah Recreation Park",
		}),
		mediaItem("planned-travel-fantasy-waterpark", 1360, 768, "panorama", {
			id: "Dalam kota · Fantasy Waterpark",
			en: "In the city · Fantasy Waterpark",
		}),
		mediaItem("planned-travel-bah-bolon-batu-nongol", 1360, 768, "panorama", {
			id: "Ide day trip · Bah Bolon dan Batu Nongol",
			en: "Day-trip idea · Bah Bolon and Batu Nongol",
		}),
		mediaItem("planned-travel-danau-laut-tador", 1456, 720, "panorama", {
			id: "Ide day trip · Danau Laut Tador",
			en: "Day-trip idea · Lake Laut Tador",
		}),
		mediaItem("planned-travel-bartong", 912, 1152, "portrait", {
			id: "Ide day trip · Bartong",
			en: "Day-trip idea · Bartong",
		}),
	],
	food: [
		mediaItem("planned-food-lemang-batok", 912, 1152, "portrait", {
			id: "Ilustrasi proses lemang batok",
			en: "An illustration of the lemang batok process",
		}),
		mediaItem("planned-food-roti-kacang", 4032, 3024, "feature", {
			id: "Roti kacang · Foto Lim Natee, CC BY 4.0",
			en: "Peanut buns · Photograph by Lim Natee, CC BY 4.0",
		}),
		mediaItem("planned-food-halua", 1024, 1024, "square", {
			id: "Ilustrasi aneka halua Melayu: manisan buah dan sayur dalam sirup gula.",
			en: "An illustration of assorted Malay halua: fruit and vegetables preserved in sugar syrup.",
		}),
	],
	made: [
		mediaItem("planned-made-rm-deblot-sundoro", 1248, 832, "feature", {
			id: "Interpretasi monumen RM Deblot Sundoro",
			en: "An interpretation of the RM Deblot Sundoro monument",
		}),
		mediaItem("planned-made-soekarno-tino", 1776, 1184, "landscape", {
			id: "Ilustrasi editorial · Soekarno M. Noer dan Tino Sidin",
			en: "Editorial illustration · Soekarno M. Noer and Tino Sidin",
		}),
		mediaItem("planned-made-ansyari-bene", 1776, 1184, "landscape", {
			id: "Ansyari Lubis dan Bene Dion · diptych dari dua sumber terpisah",
			en: "Ansyari Lubis and Bene Dion · a diptych from two separate sources",
		}),
	],
	modern: [
		mediaItem("planned-modern-tol-mktt-panorama", 1400, 600, "panorama", {
			id: "Interpretasi panorama koridor Tol MKTT",
			en: "An interpreted panorama of the MKTT toll corridor",
		}),
	],
};

export function EditorialMedia({
	locale,
	sectionId,
	compact = false,
	strip = false,
}: {
	locale: Locale;
	sectionId: string;
	compact?: boolean;
	strip?: boolean;
}) {
	const media = mediaBySection[sectionId];
	if (!media?.length) return null;

	return (
		<div
			className={`editorial-media editorial-media-${sectionId}${compact ? " editorial-media-compact" : ""}${strip ? " editorial-media-strip" : ""}`}
		>
			{media.map((item) => (
				<figure
					className={`editorial-media__item editorial-media__item--${item.layout}`}
					data-media-id={item.id}
					key={item.id}
				>
					<Image
						alt={item.alt[locale]}
						height={item.height}
						sizes={strip ? "(min-width: 64rem) 30rem, 78vw" : mediaSizes(item, sectionId)}
						src={item.path}
						width={item.width}
					/>
					<figcaption>{item.caption[locale]}</figcaption>
				</figure>
			))}
		</div>
	);
}
