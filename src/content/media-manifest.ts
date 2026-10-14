import type { LocalizedText } from "@/domain";

export type MediaManifestEntry = {
	id: string;
	path: string;
	kind: "data" | "image";
	status: "ready" | "planned" | "locked";
	alt?: LocalizedText;
};

export const mediaManifest = [
	{
		id: "hero-selamat-datang",
		path: "/images/hero/selamat-datang-tebing-tinggi.png",
		kind: "image",
		status: "locked",
		alt: {
			id: "Gerbang Selamat Datang Kota Tebing Tinggi membentang di atas jalan pada siang hari.",
			en: "The Welcome to Tebing Tinggi gate spanning a city road in daylight.",
		},
	},
	{
		id: "cafes-geojson",
		path: "/data/cafes.geojson",
		kind: "data",
		status: "ready",
	},
	{
		id: "landmark-tugu-13-desember-hero",
		path: "/images/webp/tugu-13-desember-hero.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Tugu 13 Desember dengan pilar putih, ornamen merah-emas, dan mahkota hijau di tengah taman kota.",
			en: "The 13 December Monument with a white column, red-and-gold ornaments, and a green crown in a city park.",
		},
	},
	{
		id: "landmark-tugu-13-desember-isolated",
		path: "/images/webp/tugu-13-desember-isolated.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Tugu 13 Desember terisolasi dengan pilar putih dan ornamen merah-emas.",
			en: "An isolated 13 December Monument with a white column and red-and-gold ornaments.",
		},
	},
	{
		id: "landmark-patung-kuda",
		path: "/images/webp/patung-kuda.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Patung Kuda Simpang Dolok berupa penunggang kuda perunggu yang sedang bergerak di atas pedestal biru-kuning.",
			en: "The Simpang Dolok Horse Statue, a bronze rider in motion above a blue-and-yellow pedestal.",
		},
	},
	{
		id: "landmark-tugu-simpang-beo",
		path: "/images/webp/tugu-simpang-beo.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Tugu Simpang Beo berupa patung burung beo hitam di taman kecil dekat jalan kota.",
			en: "The Simpang Beo Monument, a black bird statue in a small garden beside a city road.",
		},
	},
	{
		id: "landmark-masjid-agung",
		path: "/images/webp/masjid-agung.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Masjid Agung Kota Tebing Tinggi dengan fasad putih, dua menara, dan kubah hijau di bawah langit biru.",
			en: "Tebing Tinggi Grand Mosque with a white facade, two minarets, and green domes beneath a blue sky.",
		},
	},
	{
		id: "landmark-puri-melayu-sri-menanti",
		path: "/images/webp/puri-melayu-sri-menanti-v2.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Puri Melayu Sri Menanti, rumah panggung kayu berwarna hijau dan kuning di Tebing Tinggi.",
			en: "Puri Melayu Sri Menanti, a green-and-yellow wooden Malay stilt house in Tebing Tinggi.",
		},
	},
	{
		id: "landmark-tugu-selamat-datang",
		path: "/images/webp/tugu-selamat-datang.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Gerbang Selamat Datang Kota Tebing Tinggi dengan dua menara biru-kuning yang membentang di atas jalan.",
			en: "The Tebing Tinggi Welcome Gate with two blue-and-yellow towers spanning a city road.",
		},
	},
	{
		id: "origin-istana-pre-fire",
		path: "/images/webp/istana-pre-fire.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Istana Negeri Padang sebelum kebakaran, berupa rumah panggung Melayu dengan ukiran kuning dan rangka merah marun.",
			en: "Negeri Padang Palace before the fire, a Malay raised house with yellow fretwork and maroon framing.",
		},
	},
	{
		id: "origin-istana-post-fire",
		path: "/images/webp/istana-post-fire.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Sisa Istana Negeri Padang setelah kebakaran dengan rangka kayu hangus, puing, petugas, dan selang pemadam.",
			en: "The remains of Negeri Padang Palace after the fire, with charred timber, debris, responders, and fire hoses.",
		},
	},
	{
		id: "planned-food-lemang-batok",
		path: "/images/webp/lemang-batok-tebing-tinggi.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Ilustrasi proses memasak lemang dalam bambu di atas bara, dengan daun pisang dan tangan perajin.",
			en: "An illustration of lemang cooking in bamboo over embers, with banana leaves and a maker's hands.",
		},
	},
	{
		id: "planned-food-roti-kacang",
		path: "/images/webp/roti-kacang-tebing-tinggi.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Foto roti kacang Tebing Tinggi berwarna keemasan dengan taburan wijen di dalam loyang.",
			en: "A photograph of golden Tebing Tinggi peanut buns topped with sesame seeds in a baking tray.",
		},
	},
	{
		id: "planned-food-halua",
		path: "/images/webp/halua-melayu.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Ilustrasi aneka halua Melayu: manisan buah dan sayur dalam sirup gula.",
			en: "An illustration of assorted Malay halua: fruit and vegetables preserved in sugar syrup.",
		},
	},
	{
		id: "planned-made-rm-deblot-sundoro",
		path: "/images/webp/rm-deblot-sundoro.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Ilustrasi monumen RM Deblot Sundoro di ruang hijau kota, dengan patung dada dan pedestal bertingkat.",
			en: "An illustration of the RM Deblot Sundoro monument in a city park, with its bust and stepped pedestal.",
		},
	},
	{
		id: "planned-made-soekarno-tino",
		path: "/images/webp/soekarno-m-noer-tino-sidin.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Diptych ilustrasi editorial Soekarno M. Noer dalam potret monokrom dan Tino Sidin sedang menggambar.",
			en: "An editorial illustrated diptych of Soekarno M. Noer in monochrome and Tino Sidin drawing.",
		},
	},
	{
		id: "planned-made-ansyari-bene",
		path: "/images/webp/ansyari-lubis-bene-dion.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Diptych editorial Ansyari Lubis di panel kiri dan Bene Dion di panel kanan, dipisahkan garis arang.",
			en: "An editorial diptych with Ansyari Lubis on the left and Bene Dion on the right, divided by a charcoal line.",
		},
	},
	{
		id: "planned-culture-masjid-raya-nur-addin",
		path: "/images/webp/masjid-raya-nur-addin.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Ilustrasi halaman Masjid Raya Nur Addin dengan kolom hijau, atap utama, kubah, dan menara.",
			en: "An illustration of Nur Addin Grand Mosque's courtyard, green columns, main roof, dome, and minaret.",
		},
	},
	{
		id: "planned-culture-songket-melayu",
		path: "/images/webp/songket-melayu-tenun.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Ilustrasi tangan perajin menenun songket Melayu merah-emas pada alat tenun kayu.",
			en: "An illustration of a maker weaving red-and-gold Malay songket on a wooden loom.",
		},
	},
	{
		id: "planned-travel-museum-taman-kota",
		path: "/images/webp/museum-kota-tebing-tinggi-v2.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Fasad terbaru Museum Kota Tebing Tinggi dengan panel merah, hitam, dan kuning serta papan nama di bagian depan.",
			en: "The updated Tebing Tinggi City Museum facade with red, black, and yellow panels and its name sign at the front.",
		},
	},
	{
		id: "planned-travel-kong-mah",
		path: "/images/webp/taman-rekreasi-kong-mah-v2.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Kolase editorial dua pandangan Taman Rekreasi Kong-Mah: kolam keluarga beratap dan pintu masuk bermonumen buah.",
			en: "An editorial two-view composite of Kong-Mah Recreation Park: its covered family pool and fruit-monument entrance.",
		},
	},
	{
		id: "planned-travel-fantasy-waterpark",
		path: "/images/webp/fantasy-waterpark-tebing-tinggi.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Ilustrasi panorama Fantasy Waterpark dengan menara seluncur putih, kolam luas, dan lingkungan kota.",
			en: "An illustrated panorama of Fantasy Waterpark with its white slide tower, broad pool, and urban surroundings.",
		},
	},
	{
		id: "planned-travel-bah-bolon-batu-nongol",
		path: "/images/webp/bah-bolon-batu-nongol.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Ilustrasi arus Bah Bolon di antara dinding batu dan hutan lebat, dengan dua perahu arung jeram di kejauhan.",
			en: "An illustration of the Bah Bolon current between rock walls and dense forest, with two distant rafting boats.",
		},
	},
	{
		id: "planned-travel-danau-laut-tador",
		path: "/images/webp/danau-laut-tador.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Ilustrasi panorama datar Danau Laut Tador dengan air tenang, pulau kecil, dan vegetasi tropis rendah.",
			en: "An illustrated flat panorama of Lake Laut Tador with calm water, a small island, and low tropical vegetation.",
		},
	},
	{
		id: "planned-travel-bartong",
		path: "/images/webp/bartong.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Ilustrasi sungai dangkal berbatu di Bartong dengan pondok sederhana dan aktivitas rekreasi di tepian.",
			en: "An illustration of Bartong's shallow rocky river, simple shelters, and recreation along the banks.",
		},
	},
	{
		id: "planned-modern-tol-mktt-panorama",
		path: "/images/webp/tol-mktt-panorama-v2.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Panorama udara simpang Tol MKTT dengan jalur utama dan ramp melingkar di antara lahan pertanian dan permukiman.",
			en: "An aerial panorama of the MKTT toll interchange, with its mainline and looping ramps among farmland and settlements.",
		},
	},
	{
		id: "origin-arus-sungai-padang",
		path: "/images/webp/origin-sungai-padang.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Interpretasi visual Sungai Padang sekitar 1864 dengan arus tenang, tepian rendah, vegetasi tropis, dan sampan kecil; bukan foto sejarah.",
			en: "A visual interpretation of the Padang River around 1864, with a slow current, low banks, tropical vegetation, and a small boat; not a historical photograph.",
		},
	},
	{
		id: "origin-tanjung-marulak",
		path: "/images/webp/origin-tanjung-marulak.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Interpretasi visual ingatan tempat di tepian Sungai Padang; bukan dokumentasi titik pendaratan historis.",
			en: "A visual interpretation of place-memory on the Padang River bank; not documentation of a historical landing point.",
		},
	},
	{
		id: "origin-tebing-tinggi",
		path: "/images/webp/origin-tebing-tinggi.webp",
		kind: "image",
		status: "ready",
		alt: {
			id: "Interpretasi visual permukiman awal di tebing Sungai Padang yang lebih tinggi; bukan foto atau bukti lokasi presisi.",
			en: "A visual interpretation of an early settlement on a higher Padang River bank; not a photograph or evidence of a precise location.",
		},
	},
] as const satisfies readonly MediaManifestEntry[];
