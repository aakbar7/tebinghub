import type { Locale } from "@/domain";

export type EditorialHighlight = {
	kicker: string;
	title: string;
	body: string;
};

export type EditorialSection = {
	id: "history" | "food" | "culture" | "travel" | "modern" | "made";
	eyebrow: string;
	title: string;
	intro: string;
	highlights: EditorialHighlight[];
	note?: string;
};

export const editorialContent = {
	id: {
		history: {
			id: "history",
			eyebrow: "Arus yang membentuk kota",
			title: "Nama kota ini lahir dari perjalanan di atas air.",
			intro:
				"Pada 1864, perjalanan Datuk Bandar Kajum menyusuri Sungai Padang membawa cerita menuju Tanjung Marulak dan sebuah tebing tinggi di bibir sungai, asal nama yang masih dibawa kota hari ini.",
			highlights: [
				{
					kicker: "1864",
					title: "Dari Sungai Padang",
					body: "Perjalanan, pendaratan, lalu perpindahan menjadi pembuka narasi Tebing Tinggi.",
				},
				{
					kicker: "1 Juli 1917",
					title: "Hari jadi resmi",
					body: "Gemeente Tebing Tinggi menjadi penanda administratif yang diperingati sebagai hari jadi kota.",
				},
				{
					kicker: "13 Desember 1945",
					title: "Ingatan perjuangan",
					body: "Peristiwa Berdarah dikenang melalui Tugu 13 Desember dan kisah RM Deblot Sundoro.",
				},
			],
			note: "Istana Negeri Padang terbakar pada 13 Maret 2022. TebingHub menampilkannya sebagai jejak sejarah dokumenter, bukan destinasi aktif.",
		},
		food: {
			id: "food",
			eyebrow: "Kota Lemang & Kuliner",
			title: "Bara batok, bambu, dan alasan paling hangat untuk berhenti.",
			intro:
				"Kuliner di sini bukan daftar oleh-oleh panjang. Mulailah dari teknik, tekstur, dan kebiasaan yang membentuk rasa kota.",
			highlights: [
				{
					kicker: "Ikon kota",
					title: "Lemang Batok",
					body: "Ketan dimasak dalam bambu di atas bara batok kelapa. Di pusat kota ini kaki lima; kumpulan oleh-oleh ada di Sentra Lemang Pusat Oleh-oleh dekat gerbang utara.",
				},
				{
					kicker: "Sejak ±2005",
					title: "Roti Kacang",
					body: "Kotak oleh-oleh yang tumbuh bersama merek lokal seperti Rajawali, Beo, dan Garuda.",
				},
				{
					kicker: "Jamuan",
					title: "Halua",
					body: "Manisan buah bercita rasa manis-asam yang hadir di pinggir jalan dan jamuan adat.",
				},
			],
		},
		culture: {
			id: "culture",
			eyebrow: "Budaya Hidup",
			title: "Percampuran terasa ketika kota dijalani, bukan sekadar didaftar.",
			intro:
				"Warisan Melayu, ruang ibadah, rumah keluarga, sanggar, dan meja makan bertemu dalam radius kota yang ringkas.",
			highlights: [
				{
					kicker: "Rumah yang menanti",
					title: "Puri Melayu Sri Menanti",
					body: "Rumah panggung Melayu awal abad ke-20 di Kampung Semut, yang menghubungkan keluarga, adat, songket, tari, dan silat.",
				},
				{
					kicker: "Arsitektur",
					title: "Masjid Raya Nur Addin",
					body: "Jejak Kerajaan Negeri Padang dengan pertemuan bahasa Melayu dan Eropa.",
				},
				{
					kicker: "Kerajinan",
					title: "Songket Melayu",
					body: "Puri menjadi salah satu ruang yang menghubungkan keterampilan menenun dengan cerita keluarga dan ekonomi kreatif kota.",
				},
			],
			note: "Sumber publik berbeda pada tahun dan asal-usul pendirian Puri; TebingHub memakai formulasi konservatif 'awal abad ke-20' dan tidak menyebutnya cagar budaya resmi.",
		},
		travel: {
			id: "travel",
			eyebrow: "Wisata dalam kota & day-trip",
			title: "Satu hari bisa berarti dua jenis perjalanan yang berbeda.",
			intro:
				"Rute sehari TebingHub tetap berada di dalam Kota Tebing Tinggi. Pilihan alam di Sipispis dan sekitarnya dipisahkan agar jarak dan waktu tidak menipu.",
			highlights: [
				{
					kicker: "Dalam kota",
					title: "Museum, taman, dan rekreasi",
					body: "Museum Kota, Taman Kota, Masjid Agung, dan Waterpark Gundaling dapat dirangkai tanpa keluar kota.",
				},
				{
					kicker: "Day-trip",
					title: "Bah Bolon & Batu Nongol",
					body: "Keduanya berada di Sipispis, Kabupaten Serdang Bedagai; siapkan waktu dan cek akses.",
				},
				{
					kicker: "Day-trip",
					title: "Danau Laut Tador",
					body: "Pilihan panorama di sekitar kota dengan koordinat dan kondisi akses yang masih perlu dicek sebelum berangkat.",
				},
			],
		},
		modern: {
			id: "modern",
			eyebrow: "Kota Modern",
			title: "Jalan tol memendekkan perjalanan, sekaligus membuat kota lebih mudah terlewat.",
			intro:
				"Itulah problem yang dijawab TebingHub: mengubah kemudahan melintas menjadi alasan untuk turun, melihat, dan berbelanja di kota jasa dan perdagangan ini.",
			highlights: [
				{
					kicker: "61,80 km",
					title: "Tol MKTT",
					body: "Koridor Medan–Kualanamu–Tebing Tinggi terhubung ke kota; ruas menuju Tebing Tinggi dibuka 25 Maret 2019.",
				},
				{
					kicker: "182.226",
					title: "Penduduk 2024",
					body: "Snapshot BPS pertengahan 2024 untuk kota seluas 38,44 km².",
				},
				{
					kicker: "5 · 35",
					title: "Kecamatan · kelurahan",
					body: "Skala kota yang ringkas membuat eksplorasi singkat tetap masuk akal.",
				},
			],
			note: "Angka ditampilkan sebagai snapshot bertahun, bukan data realtime. Detail layanan WA IDAMAN belum dipublikasikan sebelum verifikasi ulang.",
		},
		made: {
			id: "made",
			eyebrow: "Made in Tebing Tinggi",
			title: "Prestasinya datang lebih dulu. Namanya menyusul.",
			intro:
				"Kota dibaca juga melalui orang-orang yang membawa pendidikan, seni, olahraga, dan film ke panggung yang lebih luas.",
			highlights: [
				{
					kicker: "Pendidikan & perjuangan",
					title: "RM Deblot Sundoro",
					body: "Ketua Taman Siswa yang gugur dalam peristiwa 13 Desember 1945; patungnya berdiri di Taman Kota.",
				},
				{
					kicker: "Seni & pendidikan",
					title: "Soekarno M. Noer · Tino Sidin",
					body: "Aktor peraih tiga Piala Citra dan guru menggambar TVRI yang membekas lintas generasi.",
				},
				{
					kicker: "Olahraga & film",
					title: "Ansyari Lubis · Bene Dion",
					body: "Dari sepak bola nasional hingga Ngeri-Ngeri Sedap, film yang mewakili Indonesia ke Oscar 2023 (bukan nominasi Oscar).",
				},
			],
		},
	},
	en: {
		history: {
			id: "history",
			eyebrow: "The current that shaped the city",
			title: "The city's name began with a journey on water.",
			intro:
				"In 1864, Datuk Bandar Kajum's journey along the Padang River led toward Tanjung Marulak and a high riverbank: the name the city still carries today.",
			highlights: [
				{
					kicker: "1864",
					title: "From the Padang River",
					body: "Journey, landing, and relocation open the story of Tebing Tinggi.",
				},
				{
					kicker: "1 July 1917",
					title: "Official anniversary",
					body: "Gemeente Tebing Tinggi marks the administrative date commemorated as the city's anniversary.",
				},
				{
					kicker: "13 December 1945",
					title: "A memory of resistance",
					body: "The Bloody Incident is remembered through the monument and RM Deblot Sundoro's story.",
				},
			],
			note: "Negeri Padang Palace burned on 13 March 2022. TebingHub presents it as a documentary historical trace, not an active destination.",
		},
		food: {
			id: "food",
			eyebrow: "Lemang & the food city",
			title: "Coconut-shell embers, bamboo, and the warmest reason to stop.",
			intro:
				"Food here is not a long souvenir list. Start with the techniques, textures, and habits that shape the city's flavour.",
			highlights: [
				{
					kicker: "City icon",
					title: "Lemang Batok",
					body: "Glutinous rice cooked in bamboo over coconut-shell embers. Downtown it is street-side; the packed souvenir cluster is the northern lemang centre near the welcome gate.",
				},
				{
					kicker: "Since around 2005",
					title: "Peanut buns",
					body: "A boxed souvenir that grew with local names such as Rajawali, Beo, and Garuda.",
				},
				{
					kicker: "At the table",
					title: "Halua",
					body: "A sweet-tart preserved fruit found at roadside stalls and customary gatherings.",
				},
			],
		},
		culture: {
			id: "culture",
			eyebrow: "Living Culture",
			title: "Mixture becomes tangible when a city is lived, not merely listed.",
			intro:
				"Malay heritage, places of worship, family houses, studios, and dining tables meet within a compact city radius.",
			highlights: [
				{
					kicker: "A house that waits",
					title: "Puri Melayu Sri Menanti",
					body: "An early-20th-century Malay stilt house in Kampung Semut, connecting family, adat, songket, dance, and silat.",
				},
				{
					kicker: "Architecture",
					title: "Nur Addin Grand Mosque",
					body: "A Negeri Padang legacy where Malay and European architectural languages meet.",
				},
				{
					kicker: "Craft",
					title: "Malay songket",
					body: "Puri is one of the spaces connecting weaving skill with family memory and the city's creative economy.",
				},
			],
			note: "Public sources differ on the house's founding date and origin; TebingHub uses the conservative phrase 'early 20th century' and does not call it an officially designated cultural heritage site.",
		},
		travel: {
			id: "travel",
			eyebrow: "Within the city & day trips",
			title: "One day can describe two very different journeys.",
			intro:
				"TebingHub's full-day route remains within Tebing Tinggi. Nature trips around Sipispis stay separate so distance and time are never disguised.",
			highlights: [
				{
					kicker: "Within the city",
					title: "Museum, park, and recreation",
					body: "The City Museum, City Park, Grand Mosque, and Gundaling Waterpark can be linked without leaving town.",
				},
				{
					kicker: "Day trip",
					title: "Bah Bolon & Batu Nongol",
					body: "Both are in Sipispis, Serdang Bedagai Regency; allow time and check access.",
				},
				{
					kicker: "Day trip",
					title: "Lake Laut Tador",
					body: "A landscape option beyond town whose coordinates and access should be checked before leaving.",
				},
			],
		},
		modern: {
			id: "modern",
			eyebrow: "The Modern City",
			title: "The toll road shortens the journey, and makes the city easier to miss.",
			intro:
				"That is TebingHub's problem to solve: turn easy passage into a reason to stop, look, and spend in this service and trading city.",
			highlights: [
				{
					kicker: "61.80 km",
					title: "MKTT toll road",
					body: "The Medan–Kualanamu–Tebing Tinggi corridor reaches the city; its Tebing Tinggi section opened on 25 March 2019.",
				},
				{
					kicker: "182,226",
					title: "Population in 2024",
					body: "A mid-2024 BPS snapshot for a city covering 38.44 km².",
				},
				{
					kicker: "5 · 35",
					title: "Districts · urban villages",
					body: "A compact scale that makes a meaningful short visit realistic.",
				},
			],
			note: "Figures are dated snapshots, not live data. WA IDAMAN service details remain unpublished until re-verification.",
		},
		made: {
			id: "made",
			eyebrow: "Made in Tebing Tinggi",
			title: "The achievement comes first. The name follows.",
			intro: "The city can also be read through people who carried education, art, sport, and film to wider stages.",
			highlights: [
				{
					kicker: "Education & resistance",
					title: "RM Deblot Sundoro",
					body: "The Taman Siswa leader killed in the events of 13 December 1945; his statue stands in City Park.",
				},
				{
					kicker: "Arts & education",
					title: "Soekarno M. Noer · Tino Sidin",
					body: "A three-time Citra-winning actor and TVRI drawing teacher remembered across generations.",
				},
				{
					kicker: "Sport & film",
					title: "Ansyari Lubis · Bene Dion",
					body: "From national football to Missing Home, Indonesia's submission to the 2023 Oscars (not an Oscar nominee).",
				},
			],
		},
	},
} as const satisfies Record<Locale, Record<string, EditorialSection>>;
