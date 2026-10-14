import type { Locale } from "@/domain";

export type OriginBeatId = "arus" | "tanjung-marulak" | "tebing-tinggi" | "negeri-padang" | "perjuangan" | "diteruskan";

export type OriginBeat = {
	id: OriginBeatId;
	year: string;
	title: string;
	body: string;
	mediaPath?: string;
	sourceIds: readonly string[];
	tone: "river" | "arrival" | "heritage" | "memory" | "continuance";
};

export type OriginStoryContent = {
	label: string;
	title: string;
	intro: string;
	beats: readonly OriginBeat[];
};

export const originStories = {
	id: {
		label: "Kisah asal",
		title: "Kota ini bermula dari arus.",
		intro: "Enam babak mengikuti perjalanan dari Sungai Padang menuju nama, ingatan, dan kota yang terus hidup.",
		beats: [
			{
				id: "arus",
				year: "1864",
				title: "Arus Sungai Padang",
				body: "Datuk Bandar Kajum menyusuri Sungai Padang. Perjalanan di atas air menjadi awal kisah yang kelak membentuk Tebing Tinggi. Visual ini merupakan interpretasi editorial, bukan foto sejarah.",
				mediaPath: "/images/webp/origin-sungai-padang.webp",
				sourceIds: ["city-content-notes"],
				tone: "river",
			},
			{
				id: "tanjung-marulak",
				year: "1864",
				title: "Tiba di Tanjung Marulak",
				body: "Ia mendarat di Kampung Tanjung Marulak, lalu mencari tempat bermukim yang lebih aman di tepi sungai. Interpretasi visual ingatan tempat di tepian Sungai Padang; bukan dokumentasi titik pendaratan historis.",
				mediaPath: "/images/webp/origin-tanjung-marulak.webp",
				sourceIds: ["city-content-notes"],
				tone: "arrival",
			},
			{
				id: "tebing-tinggi",
				year: "1864",
				title: "Tebing yang tinggi",
				body: "Permukiman berpindah ke bagian tebing yang lebih tinggi. Bentuk tanah itu tinggal dalam nama kota hingga hari ini. Visual ini merupakan interpretasi medan, bukan bukti lokasi permukiman yang presisi.",
				mediaPath: "/images/webp/origin-tebing-tinggi.webp",
				sourceIds: ["city-content-notes"],
				tone: "arrival",
			},
			{
				id: "negeri-padang",
				year: "1887-1917",
				title: "Negeri Padang menjadi kota",
				body: "Jejak Kerajaan Negeri Padang, Bandar Sakti, dan perkembangan pemerintahan bertemu dalam perjalanan menuju gemeente pada 1 Juli 1917.",
				mediaPath: "/images/webp/istana-pre-fire.webp",
				sourceIds: ["city-content-notes"],
				tone: "heritage",
			},
			{
				id: "perjuangan",
				year: "13 Des 1945",
				title: "Ingatan dan perjuangan",
				body: "Peristiwa 13 Desember 1945 dikenang melalui tugu di pusat kota. Monumen itu menjaga cerita keberanian, bukan sekadar penanda jalan.",
				mediaPath: "/images/webp/tugu-13-desember-hero.webp",
				sourceIds: ["city-content-notes"],
				tone: "memory",
			},
			{
				id: "diteruskan",
				year: "13 Mar 2022",
				title: "Yang hilang, yang diteruskan",
				body: "Istana Negeri Padang terbakar dan satu nyawa anak turut hilang. Warisannya kini dibaca melalui arsip, Puri Melayu Sri Menanti, dan ruang budaya yang meneruskan ceritanya.",
				mediaPath: "/images/webp/istana-post-fire.webp",
				sourceIds: ["palace-fire-report", "city-content-notes", "puri-melayu-pemkot"],
				tone: "continuance",
			},
		],
	},
	en: {
		label: "Origin story",
		title: "This city began with a current.",
		intro: "Six chapters follow a journey from the Padang River to a name, a memory, and a city that keeps moving.",
		beats: [
			{
				id: "arus",
				year: "1864",
				title: "The Padang River current",
				body: "Datuk Bandar Kajum travelled along the Padang River. A journey on water began the story that would shape Tebing Tinggi. This visual is an editorial interpretation, not a historical photograph.",
				mediaPath: "/images/webp/origin-sungai-padang.webp",
				sourceIds: ["city-content-notes"],
				tone: "river",
			},
			{
				id: "tanjung-marulak",
				year: "1864",
				title: "Arrival at Tanjung Marulak",
				body: "He landed at Tanjung Marulak village, then sought safer ground for a settlement beside the river. This is a visual interpretation of place-memory on the Padang River bank, not documentation of a historical landing point.",
				mediaPath: "/images/webp/origin-tanjung-marulak.webp",
				sourceIds: ["city-content-notes"],
				tone: "arrival",
			},
			{
				id: "tebing-tinggi",
				year: "1864",
				title: "The high riverbank",
				body: "The settlement moved to a higher riverbank. That shape of the land remains in the city's name today. This is a terrain interpretation, not evidence of a precise settlement site.",
				mediaPath: "/images/webp/origin-tebing-tinggi.webp",
				sourceIds: ["city-content-notes"],
				tone: "arrival",
			},
			{
				id: "negeri-padang",
				year: "1887-1917",
				title: "Negeri Padang becomes a city",
				body: "The Negeri Padang kingdom, Bandar Sakti, and a changing administration converged on the path to gemeente status on 1 July 1917.",
				mediaPath: "/images/webp/istana-pre-fire.webp",
				sourceIds: ["city-content-notes"],
				tone: "heritage",
			},
			{
				id: "perjuangan",
				year: "13 Dec 1945",
				title: "Memory and resistance",
				body: "The events of 13 December 1945 are remembered by a monument in the city centre. It holds a story of courage, not merely a point on a road.",
				mediaPath: "/images/webp/tugu-13-desember-hero.webp",
				sourceIds: ["city-content-notes"],
				tone: "memory",
			},
			{
				id: "diteruskan",
				year: "13 Mar 2022",
				title: "What was lost, what continues",
				body: "Negeri Padang Palace burned and a child's life was also lost. Its legacy now lives in archives, Puri Melayu Sri Menanti, and cultural spaces that carry the story forward.",
				mediaPath: "/images/webp/istana-post-fire.webp",
				sourceIds: ["palace-fire-report", "city-content-notes", "puri-melayu-pemkot"],
				tone: "continuance",
			},
		],
	},
} as const satisfies Record<Locale, OriginStoryContent>;
