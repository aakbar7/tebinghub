import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { routing } from "@/i18n/routing";
import { buildHomeMetadata } from "@/lib/route-metadata";
import "../globals.css";

type LocaleLayoutProps = Readonly<{
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}>;

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
	return buildHomeMetadata(params);
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
	const { locale } = await params;

	if (!hasLocale(routing.locales, locale)) notFound();

	setRequestLocale(locale);
	const messages = await getMessages();

	return (
		<html data-scroll-behavior="smooth" lang={locale}>
			<body>
				<ConvexClientProvider>
					<NextIntlClientProvider messages={messages}>
						<SmoothScrollProvider>
							<SiteHeader locale={locale} />
							{children}
							<SiteFooter locale={locale} />
						</SmoothScrollProvider>
					</NextIntlClientProvider>
				</ConvexClientProvider>
			</body>
		</html>
	);
}
