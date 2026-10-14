import type { Locale } from "@/domain";

export const homeContent = {
	id: {
		hero: {
			eyebrow: "Kota Tebing Tinggi · Sumatera Utara",
			title: "Layak Disinggahi, Bukan Cuma Dilewati",
			description:
				"Turun sebentar dari arus perjalanan. Temukan sejarah, rasa, dan ruang kota yang cukup dekat untuk dinikmati tanpa terburu-buru.",
			primaryCta: "Susun persinggahan",
			secondaryCta: "Buka peta",
			imageAlt:
				"Gerbang Selamat Datang Kota Tebing Tinggi berwarna biru dan kuning membentang di atas jalan pada siang hari.",
		},
		planner: {
			title: "Berapa lama kamu bisa singgah?",
			description: "Pilih rute sesuai waktu singgah. Urutannya sudah disusun, jadi kamu bisa langsung menikmati kota.",
			minutes: "mnt",
			openPlan: "Lihat rute di peta",
			createPlan: "Buat rencana bersama",
			creatingPlan: "Menyiapkan rencana…",
			createError: "Rencana belum bisa dibuat. Coba lagi sebentar.",
			dayTripEyebrow: "Pilihan di luar kota",
			dayTripLabel: "Masih punya waktu?",
			dayTripNote:
				"Danau Laut Tador, Bah Bolon, dan Batu Nongol berada di luar batas Kota Tebing Tinggi. Pilih terpisah dan cek akses sebelum berangkat.",
			stepChoose: "Pilih lama singgah",
			choiceHint: "Pilih waktu singgah atau susun rute sendiri.",
			stepRoute: "Rute yang disarankan",
			stepAi: "Buat rute versimu",
			stopsUnit: "tempat",
			aiTabTitle: "Rute versimu",
			aiTabHint: "Dibantu AI",
		},
	},
	en: {
		hero: {
			eyebrow: "Tebing Tinggi · North Sumatra",
			title: "Worth Stopping For, Not Just Passing Through",
			description:
				"Step out of the travel current for a while. Find history, flavour, and city spaces close enough to enjoy without rushing.",
			primaryCta: "Plan a stopover",
			secondaryCta: "Open the map",
			imageAlt: "The blue and yellow Welcome to Tebing Tinggi gate spanning a city road in daylight.",
		},
		planner: {
			title: "How long can you stay?",
			description: "Choose a route for the time you have. The order is ready, so you can start exploring right away.",
			minutes: "min",
			openPlan: "See the route on the map",
			createPlan: "Create a collaborative plan",
			creatingPlan: "Preparing your plan…",
			createError: "The plan could not be created. Try again in a moment.",
			dayTripEyebrow: "Beyond the city",
			dayTripLabel: "Have more time?",
			dayTripNote:
				"Lake Laut Tador, Bah Bolon, and Batu Nongol are day trips beyond Tebing Tinggi city limits. Choose them separately and check access before leaving.",
			stepChoose: "Choose how long to stay",
			choiceHint: "Choose your stopover time or make your own route.",
			stepRoute: "The suggested route",
			stepAi: "Make the route yours",
			stopsUnit: "stops",
			aiTabTitle: "Your route",
			aiTabHint: "With AI help",
		},
	},
} as const satisfies Record<Locale, unknown>;
