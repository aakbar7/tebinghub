"use client";

import { ArrowUpRightIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useRef, useState } from "react";
import type { Locale } from "@/domain";
import { Link } from "@/i18n/navigation";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion";
import type { LandmarkStory } from "./landmark-content";

const landmarkImageById = {
	"tugu-13-desember": {
		path: "/images/webp/tugu-13-desember-hero.webp",
		alt: {
			id: "Tugu 13 Desember dengan pilar putih, ornamen merah-emas, dan mahkota hijau di tengah taman kota.",
			en: "The 13 December Monument with a white column, red-and-gold ornaments, and a green crown in a city park.",
		},
	},
	"tugu-simpang-beo": {
		path: "/images/webp/tugu-simpang-beo.webp",
		alt: {
			id: "Tugu Simpang Beo berupa patung burung beo hitam di taman kecil dekat jalan kota.",
			en: "The Simpang Beo Monument, a black bird statue in a small garden beside a city road.",
		},
	},
	"patung-kuda-simpang-dolok": {
		path: "/images/webp/patung-kuda.webp",
		alt: {
			id: "Patung Kuda Simpang Dolok berupa penunggang kuda perunggu yang sedang bergerak di atas pedestal biru-kuning.",
			en: "The Simpang Dolok Horse Statue, a bronze rider in motion above a blue-and-yellow pedestal.",
		},
	},
	"selamat-datang": {
		path: "/images/webp/tugu-selamat-datang.webp",
		alt: {
			id: "Gerbang Selamat Datang Kota Tebing Tinggi dengan dua menara biru-kuning yang membentang di atas jalan.",
			en: "The Tebing Tinggi Welcome Gate with two blue-and-yellow towers spanning a city road.",
		},
	},
	"masjid-agung": {
		path: "/images/webp/masjid-agung.webp",
		alt: {
			id: "Masjid Agung Kota Tebing Tinggi dengan fasad putih, dua menara, dan kubah hijau di bawah langit biru.",
			en: "Tebing Tinggi Grand Mosque with a white facade, two minarets, and green domes beneath a blue sky.",
		},
	},
} as const;

function LandmarkVisual({ landmark, locale }: { landmark: LandmarkStory; locale: Locale }) {
	const image = landmarkImageById[landmark.id as keyof typeof landmarkImageById];

	return (
		<div aria-label={landmark.name[locale]} className="landmark-visual" role="img">
			{image ? (
				<Image
					alt={image.alt[locale]}
					className="landmark-visual__image"
					fill
					sizes="(min-width: 1024px) 58vw, 100vw"
					src={image.path}
				/>
			) : null}
			<div aria-hidden="true" className="landmark-visual__shade" />
			<div className="landmark-visual__line" aria-hidden="true" />
			<p className="landmark-visual__name">{landmark.name[locale]}</p>
		</div>
	);
}

export function LandmarkGallery({ landmarks, locale }: { landmarks: readonly LandmarkStory[]; locale: Locale }) {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const pointerStart = useRef<number | null>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const selected = landmarks[selectedIndex];

	const selectRelative = (direction: -1 | 1) => {
		setSelectedIndex((current) => (current + direction + landmarks.length) % landmarks.length);
	};

	useGSAP(
		() => {
			if (prefersReducedMotion()) return;
			gsap
				.timeline({ defaults: { ease: "power3.out" } })
				.fromTo(
					"[data-landmark-visual]",
					{ autoAlpha: 0, clipPath: "inset(0% 0% 12% 0%)", scale: 1.05 },
					{ autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 0.7 },
					0,
				)
				.fromTo(
					"[data-landmark-copy] > *",
					{ autoAlpha: 0, y: 20 },
					{ autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.07 },
					0.1,
				);
		},
		{ dependencies: [selectedIndex], scope: panelRef },
	);

	return (
		<div className="mt-12 lg:mt-16">
			<div
				aria-label={locale === "id" ? "Pilih landmark" : "Choose a landmark"}
				className="landmark-procession"
				role="tablist"
			>
				{landmarks.map((landmark, index) => {
					const image = landmarkImageById[landmark.id as keyof typeof landmarkImageById];
					const isSelected = selectedIndex === index;
					return (
						<button
							aria-controls="landmark-panel"
							aria-selected={isSelected}
							className="landmark-procession__tab focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emas"
							data-selected={isSelected}
							id={`landmark-tab-${landmark.id}`}
							key={landmark.id}
							onClick={() => setSelectedIndex(index)}
							onKeyDown={(event) => {
								if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
								event.preventDefault();
								const direction = event.key === "ArrowRight" ? 1 : -1;
								const nextIndex = (index + direction + landmarks.length) % landmarks.length;
								setSelectedIndex(nextIndex);
								document.getElementById(`landmark-tab-${landmarks[nextIndex].id}`)?.focus();
							}}
							role="tab"
							tabIndex={isSelected ? 0 : -1}
							type="button"
						>
							<span className="landmark-procession__figure">
								{image ? <Image alt="" aria-hidden="true" fill sizes="7rem" src={image.path} /> : null}
							</span>
							<span aria-hidden="true" className="landmark-procession__stake" />
							<span className="landmark-procession__name">{landmark.name[locale]}</span>
						</button>
					);
				})}
				<span aria-hidden="true" className="landmark-procession__ground" />
			</div>

			<div
				aria-labelledby={`landmark-tab-${selected.id}`}
				className="grid overflow-hidden border-b border-river/16 lg:min-h-[23rem] lg:grid-cols-12"
				id="landmark-panel"
				onPointerDown={(event) => {
					pointerStart.current = event.clientX;
				}}
				onPointerUp={(event) => {
					if (pointerStart.current === null) return;
					const distance = event.clientX - pointerStart.current;
					pointerStart.current = null;
					if (Math.abs(distance) < 48) return;
					selectRelative(distance < 0 ? 1 : -1);
				}}
				ref={panelRef}
				role="tabpanel"
			>
				<div
					className="tepian-bottom relative min-h-80 overflow-hidden lg:col-span-7 lg:min-h-full"
					data-landmark-media-frame
				>
					<div className="absolute inset-0" data-landmark-visual>
						<LandmarkVisual landmark={selected} locale={locale} />
					</div>
				</div>
				<div
					className="flex flex-col justify-end bg-mist/55 px-6 py-10 sm:px-10 lg:col-span-5 lg:px-12 lg:py-14"
					data-landmark-copy
				>
					{selected.signature ? (
						<p className="flex items-center gap-2.5 font-display text-lg italic leading-none text-marwah">
							<span aria-hidden="true" className="size-1.5 shrink-0 rotate-45 bg-marwah" />
							{locale === "id" ? "Landmark signature" : "Signature landmark"}
						</p>
					) : null}
					<h3 className="mt-4 max-w-[12ch] font-display text-[clamp(2.4rem,4vw,4.75rem)] font-medium leading-[0.94] tracking-[-0.04em]">
						{selected.name[locale]}
					</h3>
					<p className="mt-6 max-w-md text-base leading-7 text-ink-muted">{selected.summary[locale]}</p>
					{selected.poiId ? (
						<Link
							className="mt-8 w-fit border-b border-river pb-1 text-sm font-bold text-river focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emas"
							href={`/peta?poi=${selected.poiId}`}
						>
							{locale === "id" ? "Temukan di atlas" : "Find it in the atlas"}{" "}
							<ArrowUpRightIcon aria-hidden="true" className="inline-block" size={16} weight="bold" />
						</Link>
					) : null}
				</div>
			</div>
		</div>
	);
}
