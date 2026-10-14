import type { Locale } from "@/domain";

export type TeamMember = {
	monogram: string;
	name: string;
	role: { id: string; en: string };
	contribution: { id: string; en: string };
	link?: { label: string; href: string };
};

export const team: readonly TeamMember[] = [
	{
		monogram: "AP",
		name: "M. Akbar Perdana",
		role: { id: "Perancang & pengembang", en: "Design & engineering" },
		contribution: {
			id: "Merancang arah visual, membangun antarmuka, menyusun data tempat, dan mengintegrasikan peta serta planner AI.",
			en: "Designed the visual direction, built the interface, curated place data, and integrated the map and AI planner.",
		},
		link: { label: "Instagram @_4kkbar", href: "https://www.instagram.com/_4kkbar/" },
	},
] as const;

export const colophonContent = {
	id: {
		kicker: "tebinghub.id",
		title: "Di balik panduan ini.",
		lede: "TebingHub dibuat oleh orang yang percaya Tebing Tinggi layak disinggahi, dan bahwa panduan kota harus jujur tentang apa yang diketahuinya.",
		background: {
			heading: "Latar belakang",
			display: "Sebuah kota persinggahan, dibaca ulang dengan hormat.",
			paragraphs: [
				"TebingHub lahir untuk kompetisi Nusantara Digital City 2026: membangun wajah digital sebuah kota Indonesia yang selama ini lebih sering dilewati daripada disinggahi.",
				"Tebing Tinggi punya cerita yang layak diberhentikan: sungai yang memberi nama, lemang yang jadi ikon, rumah panggung yang masih berdiri. Arus tol baru justru membuat cerita itu makin mudah terlewat.",
				"Semua rute dikurasi dari tempat yang benar-benar ada, dan setiap klaim bisa dilacak ke sumbernya.",
			],
		},
		team: {
			heading: "Di balik layar",
			intro: "Satu orang, tanggung jawab penuh. Setiap bagian situs ini punya nama di baliknya.",
		},
		principles: {
			heading: "Prinsip kerja",
			items: [
				"Rute dikurasi dari tempat yang ada di katalog; tidak ada tempat buatan AI.",
				"Jejak sejarah yang sudah hilang tidak dipromosikan sebagai destinasi aktif.",
				"Day-trip di luar batas kota selalu diberi label yang jelas.",
				"Data tempat diverifikasi ke sumber terbuka, dan cerita lokal ditulis apa adanya.",
			],
		},
		sources: {
			heading: "Registry sumber",
			display: "Setiap klaim harus punya jejak.",
			intro:
				"Registry ini mencatat sumber dan dataset yang benar-benar dipakai di situs ini, termasuk batas verifikasinya.",
			open: "Buka",
			openAria: "Buka sumber",
		},
		stack: {
			heading: "Dibangun dengan",
			note: "Dibangun untuk Nusantara Digital City 2026.",
			items: ["Next.js", "Convex", "MapLibre", "GSAP", "Tailwind CSS", "Cloudflare"],
		},
	},
	en: {
		kicker: "tebinghub.id",
		title: "Behind this guide.",
		lede: "TebingHub is made by someone who believes Tebing Tinggi is worth stopping for, and that a city guide should be honest about what it knows.",
		background: {
			heading: "Background",
			display: "A stopover city, re-read with respect.",
			paragraphs: [
				"TebingHub was born for the Nusantara Digital City 2026 competition: building the digital face of an Indonesian city more often passed through than visited.",
				"Tebing Tinggi has stories worth stopping for: a river that named it, lemang that became its icon, stilt houses still standing. The new toll corridor makes those stories easier than ever to miss.",
				"Every route is curated from places that actually exist, and every claim can be traced back to its source.",
			],
		},
		team: {
			heading: "Behind the scenes",
			intro: "One person, full accountability. Every part of this site has a name behind it.",
		},
		principles: {
			heading: "Working principles",
			items: [
				"Routes use places in the curated catalogue; AI does not invent destinations.",
				"Historical traces that no longer stand are not promoted as active destinations.",
				"Day trips beyond city limits are always labelled clearly.",
				"Place data is verified against open sources, and local stories are told as they are.",
			],
		},
		sources: {
			heading: "Source registry",
			display: "Every claim needs a trail.",
			intro:
				"This registry records the sources and datasets actually used on this site, including their verification limits.",
			open: "Open",
			openAria: "Open source",
		},
		stack: {
			heading: "Built with",
			note: "Built for Nusantara Digital City 2026.",
			items: ["Next.js", "Convex", "MapLibre", "GSAP", "Tailwind CSS", "Cloudflare"],
		},
	},
} as const satisfies Record<Locale, unknown>;

export const sourceKindLabels = {
	id: { official: "Resmi", editorial: "Editorial", dataset: "Dataset", reference: "Referensi" },
	en: { official: "Official", editorial: "Editorial", dataset: "Dataset", reference: "Reference" },
} as const;

export const sourceStatusLabels = {
	id: { verified: "Terverifikasi", "pending-verification": "Menunggu verifikasi" },
	en: { verified: "Verified", "pending-verification": "Pending verification" },
} as const;
