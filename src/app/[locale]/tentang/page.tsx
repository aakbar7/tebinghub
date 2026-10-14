import { ArrowSquareOutIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { colophonContent, sourceKindLabels, sourceStatusLabels, team } from "@/content/colophon";
import { sourceRegistry } from "@/content/source-registry";
import { routing } from "@/i18n/routing";
import { buildRouteMetadata } from "@/lib/route-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
	return buildRouteMetadata(params, "about", "tentang");
}

function PenandaBab({ dark, label }: { dark?: boolean; label: string }) {
	return (
		<p
			className={`flex items-center gap-3 font-display text-xl italic leading-none ${dark ? "text-emas" : "text-river-bright"}`}
		>
			<span aria-hidden="true" className={`size-2 shrink-0 rotate-45 ${dark ? "bg-emas" : "bg-river-bright"}`} />
			{label}
		</p>
	);
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);
	const content = colophonContent[locale];
	const kindLabels = sourceKindLabels[locale];
	const statusLabels = sourceStatusLabels[locale];

	return (
		<main className="min-h-screen bg-paper text-ink">
			<header className="page-masthead relative overflow-hidden bg-marwah text-paper">
				<span aria-hidden="true" className="th-ornament-field" />
				<Image
					alt=""
					aria-hidden="true"
					className="pointer-events-none absolute -right-16 top-1/2 hidden w-[24rem] -translate-y-1/2 opacity-25 lg:block"
					height={1024}
					src="/images/v2/ornament/aurellia_03.webp"
					width={1024}
				/>
				<span aria-hidden="true" className="th-seam-divider absolute inset-x-0 bottom-0 opacity-60" />
				<div className="relative mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-16">
					<p className="flex items-center gap-3 font-display text-xl italic leading-none text-emas">
						<span aria-hidden="true" className="size-2 shrink-0 rotate-45 bg-emas" />
						{content.kicker}
					</p>
					<h1 className="mt-5 max-w-[12ch] font-display text-[clamp(3rem,5.6vw,6rem)] font-medium leading-[0.9] tracking-[-0.04em]">
						{content.title}
					</h1>
					<p className="mt-7 max-w-2xl text-base leading-7 text-paper/78 sm:text-lg sm:leading-8">{content.lede}</p>
				</div>
			</header>

			<section className="mx-auto grid w-full max-w-[90rem] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-12 lg:px-16 lg:py-24">
				<div className="lg:col-span-4">
					<PenandaBab label={content.background.heading} />
				</div>
				<div className="lg:col-span-8">
					<h2 className="max-w-[18ch] text-balance font-display text-[clamp(2.1rem,3.6vw,3.6rem)] font-medium leading-[1.02] tracking-[-0.04em] text-river">
						{content.background.display}
					</h2>
					<div className="mt-8 max-w-3xl space-y-5 text-base leading-7 text-ink-muted sm:text-lg sm:leading-8">
						{content.background.paragraphs.map((paragraph) => (
							<p key={paragraph}>{paragraph}</p>
						))}
					</div>
				</div>
			</section>

			<section className="relative overflow-hidden bg-paper-deep py-16 sm:py-20 lg:py-24">
				<div className="mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-16">
					<div className="grid gap-6 lg:grid-cols-12 lg:items-end">
						<div className="lg:col-span-7">
							<PenandaBab label={content.team.heading} />
							<h2 className="mt-5 max-w-[16ch] text-balance font-display text-[clamp(2.1rem,3.6vw,3.6rem)] font-medium leading-[1.02] tracking-[-0.04em] text-river">
								{content.team.intro}
							</h2>
						</div>
					</div>

					<div className="mt-10 max-w-xl">
						{team.map((member) => (
							<article
								className="relative overflow-hidden border border-river/20 bg-paper p-6 sm:p-8"
								key={member.name}
							>
								<Image
									alt=""
									aria-hidden="true"
									className="pointer-events-none absolute -right-10 -top-10 w-36 opacity-[0.14]"
									height={1024}
									src="/images/v2/ornament/aurellia_01.webp"
									width={1024}
								/>
								<p aria-hidden="true" className="font-display text-4xl font-medium italic leading-none text-emas">
									{member.monogram}
								</p>
								<h3 className="mt-5 font-display text-2xl font-semibold leading-tight text-river">{member.name}</h3>
								<p className="mt-1 font-display text-base italic text-marwah">{member.role[locale]}</p>
								<p className="mt-4 max-w-md text-sm leading-6 text-ink-muted">{member.contribution[locale]}</p>
								{member.link ? (
									<a
										className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-river underline decoration-emas decoration-2 underline-offset-4"
										href={member.link.href}
										rel="noreferrer"
										target="_blank"
									>
										{member.link.label}
										<ArrowSquareOutIcon aria-hidden="true" size={15} weight="bold" />
									</a>
								) : null}
							</article>
						))}
					</div>
				</div>
			</section>

			<section className="mx-auto grid w-full max-w-[90rem] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-12 lg:px-16 lg:py-24">
				<div className="lg:col-span-4">
					<PenandaBab label={content.principles.heading} />
				</div>
				<div className="divide-y divide-river/15 border-y border-river/15 lg:col-span-8">
					{content.principles.items.map((principle, index) => (
						<p className="grid grid-cols-[2.5rem_1fr] gap-3 py-5 text-base leading-7 text-ink-muted" key={principle}>
							<span className="font-display text-xl italic text-marwah">0{index + 1}</span>
							{principle}
						</p>
					))}
				</div>
			</section>

			<section className="relative overflow-hidden bg-river py-16 text-paper sm:py-20 lg:py-24" id="sumber">
				<span aria-hidden="true" className="th-ornament-field th-ornament-field--faint" />
				<div className="relative mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-16">
					<PenandaBab dark label={content.sources.heading} />
					<h2 className="mt-5 max-w-[14ch] text-balance font-display text-[clamp(2.4rem,4.4vw,4.5rem)] font-medium leading-[0.94] tracking-[-0.04em]">
						{content.sources.display}
					</h2>
					<p className="mt-6 max-w-2xl text-base leading-7 text-paper/72 sm:text-lg sm:leading-8">
						{content.sources.intro}
					</p>

					<div className="mt-12 divide-y divide-white/12 border-y border-white/15">
						{sourceRegistry.map((source, index) => (
							<article className="grid gap-4 py-6 sm:grid-cols-[3rem_1fr_auto] sm:items-start" key={source.id}>
								<span className="font-display text-2xl italic text-emas">{String(index + 1).padStart(2, "0")}</span>
								<div>
									<p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-emas">
										{kindLabels[source.kind]} · {statusLabels[source.status]}
									</p>
									<h3 className="mt-2 font-display text-2xl font-semibold leading-tight text-white">{source.label}</h3>
									{source.note ? <p className="mt-2 max-w-3xl text-sm leading-6 text-paper/68">{source.note}</p> : null}
								</div>
								{"url" in source && source.url ? (
									<a
										aria-label={`${content.sources.openAria}: ${source.label}`}
										className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-paper underline decoration-emas decoration-2 underline-offset-4"
										href={source.url}
										rel="noreferrer"
										target="_blank"
									>
										{content.sources.open} <ArrowSquareOutIcon aria-hidden="true" size={15} weight="bold" />
									</a>
								) : null}
							</article>
						))}
					</div>
				</div>
			</section>

			<section className="border-t border-river/15 bg-paper py-10">
				<div className="mx-auto flex w-full max-w-[90rem] flex-col gap-4 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-16">
					<p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
						<span className="font-display text-base italic text-river-bright">{content.stack.heading}</span>
						{content.stack.items.map((item) => (
							<span className="text-sm font-bold text-ink" key={item}>
								{item}
							</span>
						))}
					</p>
					<p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink-muted">
						{content.stack.note}
					</p>
				</div>
			</section>
		</main>
	);
}
