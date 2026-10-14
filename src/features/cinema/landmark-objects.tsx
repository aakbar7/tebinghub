import { RevealScope } from "@/components/motion/reveal-scope";
import type { Locale } from "@/domain";
import { landmarkStories } from "./landmark-content";
import { LandmarkGallery } from "./landmark-gallery";

export function LandmarkObjects({ locale }: { locale: Locale }) {
	const copy =
		locale === "id"
			? {
					label: "Wajah kota",
					title: "Landmark sebagai pemeran, bukan dekorasi.",
					intro: "Lima bentuk yang membantu mengenali Tebing Tinggi dari jalan, simpang, dan ingatan bersama.",
					region: "Landmark kota",
				}
			: {
					label: "Faces of the city",
					title: "Landmarks as characters, not decoration.",
					intro: "Five forms that make Tebing Tinggi recognisable through its roads, junctions, and shared memory.",
					region: "City landmarks",
				};

	return (
		<section
			aria-label={copy.region}
			className="relative overflow-hidden bg-paper py-8 text-ink sm:py-10 lg:py-12"
			id="landmarks"
		>
			<RevealScope className="mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-16">
				<h2
					className="max-w-[13ch] text-balance font-display text-[clamp(2.8rem,6vw,6rem)] font-medium leading-[0.92] tracking-[-0.04em]"
					data-reveal="heading"
				>
					{copy.title}
				</h2>
				<p className="mt-7 max-w-2xl text-base leading-7 text-ink-muted sm:text-lg sm:leading-8" data-reveal="fade">
					{copy.intro}
				</p>
				<LandmarkGallery landmarks={landmarkStories} locale={locale} />
			</RevealScope>
		</section>
	);
}
