import { ArrowUpRightIcon } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import { RevealScope } from "@/components/motion/reveal-scope";
import { EditorialMedia } from "@/components/site/editorial-media";
import { type EditorialSection, editorialContent } from "@/content/editorial";
import type { Locale } from "@/domain";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

const routeBySection: Record<EditorialSection["id"], string> = {
	history: "/sejarah",
	food: "/kuliner",
	culture: "/budaya",
	travel: "/wisata",
	modern: "/teknologi",
	made: "/tokoh",
};

function PenandaBab({ dark, label }: { dark: boolean; label: string }) {
	return (
		<p
			className={cn(
				"flex items-center gap-3 font-display text-xl italic leading-none",
				dark ? "text-emas" : "text-river-bright",
			)}
			data-reveal="fade"
		>
			<span aria-hidden="true" className={cn("size-2 shrink-0 rotate-45", dark ? "bg-emas" : "bg-river-bright")} />
			{label}
		</p>
	);
}

function HighlightRows({ dark, highlights }: { dark: boolean; highlights: EditorialSection["highlights"] }) {
	return (
		<div className={cn("mt-10 border-t", dark ? "border-white/18" : "border-river/15")}>
			{highlights.map((highlight) => (
				<article
					className={cn(
						"grid gap-2 border-b py-6 lg:grid-cols-12 lg:items-baseline lg:gap-8",
						dark ? "border-white/14" : "border-river/12",
					)}
					key={highlight.title}
				>
					<p className={cn("font-display text-base italic lg:col-span-2", dark ? "text-emas-bright" : "text-marwah")}>
						{highlight.kicker}
					</p>
					<h3 className="font-display text-2xl font-semibold leading-tight lg:col-span-4">{highlight.title}</h3>
					<p className={cn("text-sm leading-6 lg:col-span-6", dark ? "text-paper/68" : "text-ink-muted")}>
						{highlight.body}
					</p>
				</article>
			))}
		</div>
	);
}

const foodSupportingMedia = [
	{
		path: "/images/webp/roti-kacang-tebing-tinggi.webp",
		width: 4032,
		height: 3024,
		alt: {
			id: "Roti kacang Tebing Tinggi berwarna keemasan dengan taburan wijen di dalam loyang.",
			en: "Golden Tebing Tinggi peanut buns topped with sesame seeds in a baking tray.",
		},
		credit: { id: "Foto Lim Natee · CC BY 4.0", en: "Photo by Lim Natee · CC BY 4.0" },
	},
	{
		path: "/images/webp/halua-melayu.webp",
		width: 1024,
		height: 1024,
		alt: {
			id: "Aneka halua Melayu: manisan buah dan sayur dalam sirup gula.",
			en: "Assorted Malay halua: fruit and vegetables preserved in sugar syrup.",
		},
		credit: { id: "Ilustrasi editorial berbantuan AI", en: "AI-assisted editorial illustration" },
	},
] as const;

function FoodChapterSpread({ locale, section }: { locale: Locale; section: EditorialSection }) {
	const [signature, ...supporting] = section.highlights;
	if (!signature) return null;

	const process = locale === "id" ? "Bambu · ketan · bara batok" : "Bamboo · sticky rice · coconut-shell embers";

	return (
		<>
			<div className="food-spread" data-food-spread>
				<article className="food-spread__signature">
					<Image
						alt={
							locale === "id"
								? "Lemang dimasak dalam bambu di atas bara batok kelapa, dibungkus daun pisang."
								: "Lemang cooking in bamboo over coconut-shell embers, wrapped in banana leaves."
						}
						className="food-spread__signature-photo"
						fill
						sizes="(min-width: 64rem) 52vw, 92vw"
						src="/images/webp/lemang-batok-tebing-tinggi.webp"
					/>
					<div aria-hidden="true" className="food-spread__scrim" />
					<div className="food-spread__signature-copy">
						<p className="food-spread__kicker">{signature.kicker}</p>
						<p className="food-spread__process">{process}</p>
						<h3 className="food-spread__title">{signature.title}</h3>
						<p className="food-spread__body">{signature.body}</p>
					</div>
				</article>

				<div className="food-spread__supporting">
					{supporting.map((highlight, index) => {
						const media = foodSupportingMedia[index];
						return (
							<article className="food-spread__supporting-item" key={highlight.title}>
								{media ? (
									<figure className="food-spread__supporting-media">
										<Image
											alt={media.alt[locale]}
											height={media.height}
											sizes="(min-width: 64rem) 38vw, 92vw"
											src={media.path}
											width={media.width}
										/>
										<figcaption>{media.credit[locale]}</figcaption>
									</figure>
								) : null}
								<div className="food-spread__supporting-head">
									<p>{highlight.kicker}</p>
								</div>
								<h3>{highlight.title}</h3>
								<p>{highlight.body}</p>
							</article>
						);
					})}
				</div>
			</div>

			{section.note ? (
				<p className="food-spread__note">
					<span aria-hidden="true" />
					{section.note}
				</p>
			) : null}
		</>
	);
}

function CultureStage({ locale }: { locale: Locale }) {
	return (
		<div className="culture-stage" data-reveal="media">
			<div aria-hidden="true" className="culture-stage__plate">
				<span className="culture-stage__lisplang" />
			</div>
			<Image
				alt={
					locale === "id"
						? "Puri Melayu Sri Menanti, rumah panggung kayu kuning dengan ukiran Melayu dan tangga kembar."
						: "Puri Melayu Sri Menanti, a yellow timber stilt house with Malay carvings and twin staircases."
				}
				className="culture-stage__cutout"
				height={832}
				sizes="(min-width: 64rem) 44rem, 92vw"
				src="/images/webp/puri-melayu-sri-menanti-cutout.webp"
				width={1248}
			/>
			<p className="culture-stage__caption">
				{locale === "id" ? "Puri Melayu Sri Menanti · awal abad ke-20" : "Puri Melayu Sri Menanti · early 20th century"}
			</p>
		</div>
	);
}

function EditorialChapter({ locale, section }: { locale: Locale; section: EditorialSection }) {
	const dark = section.id === "culture" || section.id === "modern" || section.id === "made";
	return (
		<section
			className={cn(
				"relative overflow-hidden py-10 sm:py-12 lg:py-16",
				`editorial-chapter-${section.id}`,
				section.id === "culture" || section.id === "modern"
					? "bg-river text-paper"
					: section.id === "made"
						? "bg-marwah text-paper"
						: "bg-paper text-ink",
			)}
			id={section.id}
		>
			<RevealScope className="relative mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-16">
				<div className="grid gap-8 lg:grid-cols-12">
					<div className="lg:col-span-7">
						<PenandaBab dark={dark} label={section.eyebrow} />
						<h2
							className="mt-5 max-w-[16ch] text-balance font-display text-[clamp(2.35rem,4.2vw,4.5rem)] font-medium leading-[0.94] tracking-[-0.04em]"
							data-reveal="heading"
						>
							{section.title}
						</h2>
					</div>
					<div className="lg:col-span-4 lg:col-start-9 lg:pt-10">
						<p
							className={cn("text-base leading-7 sm:text-lg sm:leading-8", dark ? "text-paper/72" : "text-ink-muted")}
							data-reveal="fade"
						>
							{section.intro}
						</p>
						<Link
							className={cn(
								"mt-6 inline-flex min-h-11 items-center gap-3 border-b text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emas",
								dark ? "border-emas text-paper" : "border-river text-river",
							)}
							data-reveal="fade"
							href={routeBySection[section.id]}
						>
							{locale === "id" ? "Baca lebih dalam" : "Read the full chapter"}{" "}
							<ArrowUpRightIcon aria-hidden="true" className="inline-block" size={16} weight="bold" />
						</Link>
					</div>
				</div>

				{section.id === "food" ? (
					<FoodChapterSpread locale={locale} section={section} />
				) : (
					<>
						{section.id === "culture" ? <CultureStage locale={locale} /> : null}
						<EditorialMedia locale={locale} sectionId={section.id} strip={section.id === "travel"} />
						<HighlightRows dark={dark} highlights={section.highlights} />
					</>
				)}

				{section.id !== "food" && section.note ? (
					<p className={cn("mt-7 flex max-w-4xl gap-3 text-sm leading-6", dark ? "text-paper/72" : "text-ink-muted")}>
						<span
							aria-hidden="true"
							className={cn("mt-1.5 size-2 shrink-0 rotate-45", dark ? "bg-emas" : "bg-marwah")}
						/>
						{section.note}
					</p>
				) : null}
			</RevealScope>
		</section>
	);
}

export function EditorialSpine({ locale }: { locale: Locale }) {
	const content = editorialContent[locale];
	const sections = [content.food, content.culture, content.travel, content.modern, content.made];

	return (
		<>
			{sections.map((section) => (
				<EditorialChapter key={section.id} locale={locale} section={section} />
			))}
			<section className="bg-paper-deep py-10 sm:py-12" id="about">
				<RevealScope className="mx-auto grid w-full max-w-[90rem] gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:px-16">
					<div className="lg:col-span-7">
						<h2
							className="max-w-[14ch] text-balance font-display text-[clamp(2.5rem,4.4vw,4.75rem)] font-medium leading-[0.94] tracking-[-0.04em] text-river"
							data-reveal="heading"
						>
							{locale === "id"
								? "Panduan kota yang jujur tentang apa yang diketahui, dan yang belum."
								: "A city guide honest about what is known, and what is not."}
						</h2>
					</div>
					<div
						className="space-y-6 text-base leading-7 text-ink-muted lg:col-span-4 lg:col-start-9 lg:pt-10"
						data-reveal="fade"
					>
						<p>
							{locale === "id"
								? "TebingHub adalah panduan independen yang menyusun sumber pemerintah, statistik, liputan editorial, data tempat, dan proses kreatif berbantuan AI secara terbuka."
								: "TebingHub is an independent guide that openly combines government sources, statistics, editorial reporting, place data, and an AI-assisted creative process."}
						</p>
						<div className="flex flex-wrap gap-5">
							<Link
								className="font-bold text-river underline decoration-emas decoration-2 underline-offset-4"
								href="/tentang"
							>
								{locale === "id" ? "Tentang proses & tim" : "About the process & team"}
							</Link>
							<Link
								className="font-bold text-river underline decoration-emas decoration-2 underline-offset-4"
								href="/tentang#sumber"
							>
								{locale === "id" ? "Lihat registry sumber" : "View the source registry"}
							</Link>
						</div>
					</div>
				</RevealScope>
			</section>
		</>
	);
}
