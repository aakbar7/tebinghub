import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { atlasContent } from "@/content/atlas";
import { AtlasExplorer, AtlasStaticFallback } from "@/features/atlas/atlas-explorer";
import { routing } from "@/i18n/routing";
import { buildRouteMetadata } from "@/lib/route-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
	return buildRouteMetadata(params, "map", "peta");
}

export default async function MapPage({ params }: { params: Promise<{ locale: string }> }) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);
	const content = atlasContent[locale];

	return (
		<main className="min-h-screen bg-paper text-ink">
			<header className="border-b border-river/15 bg-paper">
				<div className="mx-auto flex w-full max-w-[90rem] flex-col gap-3 px-5 py-6 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-16 lg:py-7">
					<h1 className="max-w-[16ch] text-balance font-display text-[clamp(2rem,3vw,2.9rem)] font-medium leading-[0.96] tracking-[-0.04em] text-river">
						{content.title}
					</h1>
					<p className="max-w-md text-sm leading-6 text-ink-muted lg:pb-1 lg:text-right">{content.description}</p>
				</div>
			</header>

			<div className="lg:pb-0">
				<Suspense
					fallback={
						<div className="mx-auto w-full max-w-[90rem] px-5 py-8 sm:px-8 lg:px-16">
							<AtlasStaticFallback locale={locale} />
						</div>
					}
				>
					<AtlasExplorer locale={locale} />
				</Suspense>
			</div>
		</main>
	);
}
