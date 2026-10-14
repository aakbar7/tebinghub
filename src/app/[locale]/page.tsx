import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { AtlasTeaser } from "@/components/home/atlas-teaser";
import { EditorialSpine } from "@/components/home/editorial-spine";
import { HomeHero } from "@/components/home/home-hero";
import { StopoverPlanner } from "@/components/home/stopover-planner";
import { LandmarkObjects } from "@/features/cinema/landmark-objects";
import { OriginStory } from "@/features/cinema/origin-story";
import { routing } from "@/i18n/routing";
import { buildHomeMetadata } from "@/lib/route-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
	return buildHomeMetadata(params);
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);

	return (
		<main className="min-h-screen bg-paper text-ink">
			<HomeHero locale={locale} />
			<StopoverPlanner locale={locale} />
			<AtlasTeaser locale={locale} />
			<OriginStory locale={locale} />
			<LandmarkObjects locale={locale} />
			<EditorialSpine locale={locale} />
		</main>
	);
}
