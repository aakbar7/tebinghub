import type { EditorialSection } from "@/content/editorial";
import type { Locale } from "@/domain";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { EditorialMedia } from "./editorial-media";

const headerBySection: Record<EditorialSection["id"], string> = {
	history: "bg-paper text-ink",
	food: "bg-paper text-ink",
	travel: "bg-paper text-ink",
	culture: "bg-river text-paper",
	modern: "bg-river text-paper",
	made: "bg-marwah text-paper",
};

export function EditorialRoute({ locale, section }: { locale: Locale; section: EditorialSection }) {
	const darkHeader = section.id === "culture" || section.id === "modern" || section.id === "made";

	return (
		<main className={`editorial-route editorial-route-${section.id} min-h-screen bg-paper text-ink`}>
			<header
				className={cn(
					"relative overflow-hidden",
					darkHeader ? "page-masthead" : "py-16 sm:py-20 lg:py-24",
					headerBySection[section.id],
				)}
			>
				{darkHeader ? <div aria-hidden="true" className="th-awan-larat absolute inset-0 opacity-15" /> : null}
				<div className="relative mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-16">
					<p
						className={cn(
							"flex items-center gap-3 font-display text-xl italic leading-none",
							darkHeader ? "text-emas" : "text-river-bright",
						)}
					>
						<span
							aria-hidden="true"
							className={cn("size-2 shrink-0 rotate-45", darkHeader ? "bg-emas" : "bg-river-bright")}
						/>
						{section.eyebrow}
					</p>
					<h1 className="mt-5 max-w-[14ch] text-balance font-display text-[clamp(3rem,6vw,6rem)] font-medium leading-[0.9] tracking-[-0.04em]">
						{section.title}
					</h1>
					<p
						className={cn(
							"mt-7 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8",
							darkHeader ? "text-paper/72" : "text-ink-muted",
						)}
					>
						{section.intro}
					</p>
				</div>
			</header>

			<section className="mx-auto w-full max-w-[90rem] px-5 py-10 sm:px-8 sm:py-16 lg:px-16 lg:py-20">
				<EditorialMedia compact locale={locale} sectionId={section.id} />

				<div className="mt-12 border-t border-river/15">
					{section.highlights.map((highlight) => (
						<article
							className="grid gap-2 border-b border-river/12 py-7 lg:grid-cols-12 lg:items-baseline lg:gap-8"
							key={highlight.title}
						>
							<p className="font-display text-base italic text-marwah lg:col-span-2">{highlight.kicker}</p>
							<h2 className="font-display text-3xl font-semibold leading-tight text-river lg:col-span-4">
								{highlight.title}
							</h2>
							<p className="text-base leading-7 text-ink-muted lg:col-span-6">{highlight.body}</p>
						</article>
					))}
				</div>

				{section.note ? (
					<p className="mt-8 flex max-w-4xl gap-3 text-sm leading-7 text-ink-muted">
						<span aria-hidden="true" className="mt-2 size-2 shrink-0 rotate-45 bg-marwah" />
						{section.note}
					</p>
				) : null}

				<div className="mt-12 flex flex-wrap gap-5 border-t border-river/15 pt-7">
					<Link className="font-bold text-river underline decoration-emas decoration-2 underline-offset-4" href="/">
						{locale === "id" ? "Kembali ke perjalanan utama" : "Return to the main journey"}
					</Link>
					<Link className="font-bold text-river underline decoration-emas decoration-2 underline-offset-4" href="/peta">
						{locale === "id" ? "Lihat tempat di atlas" : "See places in the atlas"}
					</Link>
				</div>
			</section>
		</main>
	);
}
