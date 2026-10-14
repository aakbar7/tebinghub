import { notFound, redirect } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

// Redirect legacy /sumber route to the sources section on /tentang
export default async function SourcesPage({ params }: { params: Promise<{ locale: string }> }) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	redirect(locale === "en" ? "/en/tentang#sumber" : "/tentang#sumber");
}
