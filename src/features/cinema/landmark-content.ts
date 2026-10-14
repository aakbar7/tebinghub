import type { LocalizedText } from "@/domain";

export type LandmarkStory = {
	id: string;
	poiId: string | null;
	name: LocalizedText;
	summary: LocalizedText;
	signature: boolean;
};

export const landmarkStories = [
	{
		id: "tugu-13-desember",
		poiId: "tugu-13-desember",
		name: { id: "Tugu 13 Desember", en: "13 December Monument" },
		summary: {
			id: "Pilar putih dengan lingkar ornamen merah-emas yang menjaga ingatan perjuangan di pusat kota.",
			en: "A white memorial column with red-and-gold ornaments holding the memory of resistance in the city centre.",
		},
		signature: true,
	},
	{
		id: "tugu-simpang-beo",
		poiId: "tugu-simpang-beo",
		name: { id: "Tugu Simpang Beo", en: "Simpang Beo Monument" },
		summary: {
			id: "Penanda simpang yang hidup di antara arus kendaraan dan keseharian kota.",
			en: "A junction marker set within the movement and daily rhythm of the city.",
		},
		signature: false,
	},
	{
		id: "patung-kuda-simpang-dolok",
		poiId: "patung-kuda-simpang-dolok",
		name: { id: "Patung Kuda Simpang Dolok", en: "Simpang Dolok Horse Statue" },
		summary: {
			id: "Siluet gerak yang menjadi wajah kuat di salah satu persimpangan kota.",
			en: "A silhouette of motion that gives one of the city's junctions a distinctive face.",
		},
		signature: true,
	},
	{
		id: "selamat-datang",
		poiId: "selamat-datang",
		name: { id: "Gerbang Selamat Datang", en: "Welcome Gate" },
		summary: {
			id: "Gerbang biru dan kuning yang mengubah perjalanan lewat menjadi momen tiba.",
			en: "The blue and yellow gate that turns passing through into a moment of arrival.",
		},
		signature: false,
	},
	{
		id: "masjid-agung",
		poiId: "masjid-agung",
		name: { id: "Masjid Agung", en: "Grand Mosque" },
		summary: {
			id: "Landmark religi modern yang menandai sisi utara Tebing Tinggi.",
			en: "A modern religious landmark marking the northern side of Tebing Tinggi.",
		},
		signature: false,
	},
] as const satisfies readonly LandmarkStory[];
