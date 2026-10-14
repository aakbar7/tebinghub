import Image from "next/image";
import type { Locale } from "@/domain";

const seals = [
	{
		alt: "Logo HUT ke-81 Republik Indonesia",
		altEn: "81st anniversary of the Republic of Indonesia logo",
		src: "/images/brand/commemorations/2026/hut-ri-81.webp",
		mediaClass: "aspect-5/3 w-[clamp(4.25rem,9vw,5.25rem)]",
		sizes: "(min-width: 40rem) 5.25rem, 9vw",
	},
	{
		alt: "Logo Hari Jadi ke-109 Kota Tebing Tinggi, 1917–2026",
		altEn: "109th anniversary of Tebing Tinggi logo, 1917–2026",
		src: "/images/brand/commemorations/2026/hari-jadi-tebing-tinggi-109.webp",
		mediaClass: "aspect-[1200/645] w-[clamp(6rem,13vw,7.5rem)]",
		sizes: "(min-width: 40rem) 7.5rem, 13vw",
	},
] as const;

export function CommemorativeSeals({ locale }: { locale: Locale }) {
	return (
		<div className="commemorative-seals">
			<div className="commemorative-seals__row">
				{seals.map((seal) => (
					<span className="commemorative-seals__item" key={seal.src}>
						<span className={`relative block ${seal.mediaClass}`}>
							<Image
								alt={locale === "id" ? seal.alt : seal.altEn}
								className="object-contain"
								fill
								sizes={seal.sizes}
								src={seal.src}
							/>
						</span>
					</span>
				))}
			</div>
		</div>
	);
}
