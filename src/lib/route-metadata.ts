import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/domain";
import { routing } from "@/i18n/routing";
import { buildLocaleMetadata } from "@/lib/seo";

type RouteMessageKey =
	| "map"
	| "culture"
	| "food"
	| "travel"
	| "history"
	| "technology"
	| "figures"
	| "plans"
	| "sources"
	| "about";

export async function buildRouteMetadata(
	params: Promise<{ locale: string }>,
	routeKey: RouteMessageKey,
	path: string,
): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);
	const t = await getTranslations({ locale, namespace: "Routes" });
	const site = await getTranslations({ locale, namespace: "Metadata" });
	const title = `${t(`${routeKey}.title`)} — ${site("siteName")}`;
	const description = t(`${routeKey}.description`);
	return buildLocaleMetadata({
		locale: locale as Locale,
		title,
		description,
		path,
	});
}

export async function buildHomeMetadata(params: Promise<{ locale: string }>): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);
	const t = await getTranslations({ locale, namespace: "Metadata" });
	return buildLocaleMetadata({
		locale: locale as Locale,
		title: t("title"),
		description: t("description"),
		path: "",
	});
}
