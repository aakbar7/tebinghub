import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { EditorialRoute } from "@/components/site/editorial-route";
import { editorialContent } from "@/content/editorial";
import { routing } from "@/i18n/routing";
import { buildRouteMetadata } from "@/lib/route-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
	return buildRouteMetadata(params, "culture", "budaya");
}

export default async function CulturePage({ params }: { params: Promise<{ locale: string }> }) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);
	return <EditorialRoute locale={locale} section={editorialContent[locale].culture} />;
}
