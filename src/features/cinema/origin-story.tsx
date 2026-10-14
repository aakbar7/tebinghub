import dynamic from "next/dynamic";
import { RevealScope } from "@/components/motion/reveal-scope";
import type { Locale } from "@/domain";
import { originStories } from "./origin-content";

const OriginStage = dynamic(() => import("./origin-stage").then((module) => module.OriginStage));

export function OriginStory({ locale }: { locale: Locale }) {
	const story = originStories[locale];
	const regionLabel = locale === "id" ? "Kisah asal Tebing Tinggi" : "The origin of Tebing Tinggi";

	return (
		<section aria-label={regionLabel} className="relative overflow-hidden bg-river text-paper" id="origin">
			<div
				aria-hidden="true"
				className="th-awan-larat th-awan-larat-from-right absolute right-0 top-20 h-[34rem] w-[58%] opacity-18"
			/>
			<RevealScope className="relative mx-auto max-w-[90rem] px-5 pb-8 pt-16 sm:px-8 sm:pt-20 lg:px-16 lg:pb-10 lg:pt-24">
				<p className="flex items-center gap-3 font-display text-xl italic leading-none text-emas" data-reveal="fade">
					<span aria-hidden="true" className="size-2 shrink-0 rotate-45 bg-emas" />
					{story.label}
				</p>
				<h2
					className="mt-5 max-w-[11ch] text-balance font-display text-[clamp(3rem,5.6vw,6rem)] font-medium leading-[0.94] tracking-[-0.04em]"
					data-reveal="heading"
				>
					{story.title}
				</h2>
				<p className="mt-7 max-w-2xl text-base leading-7 text-paper/72 sm:text-lg sm:leading-8" data-reveal="fade">
					{story.intro}
				</p>
			</RevealScope>
			<OriginStage beats={story.beats} />
		</section>
	);
}
