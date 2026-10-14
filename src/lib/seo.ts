import type { Metadata } from "next";
import type { Locale } from "@/domain";

export const SITE_URL = "https://tebinghub.id";
export const SITE_NAME = "tebinghub.id";
export const OG_IMAGE_PATH = "/images/hero/selamat-datang-tebing-tinggi.png";

export const staticSitePaths = [
	"",
	"peta",
	"budaya",
	"kuliner",
	"wisata",
	"sejarah",
	"teknologi",
	"tokoh",
	"rencana",
	"tentang",
] as const;

export type StaticSitePath = (typeof staticSitePaths)[number];

export function localizedHref(locale: Locale, path: string = "") {
	const clean = path.replace(/^\/+|\/+$/g, "");
	if (locale === "id") {
		return clean ? `/${clean}` : "/";
	}
	return clean ? `/en/${clean}` : "/en";
}

export function absoluteUrl(locale: Locale, path: string = "") {
	return new URL(localizedHref(locale, path), SITE_URL).toString();
}

type BuildMetadataInput = {
	locale: Locale;
	title: string;
	description: string;
	path?: string;
};

export function buildLocaleMetadata({ locale, title, description, path = "" }: BuildMetadataInput): Metadata {
	const canonical = localizedHref(locale, path);
	const languages = {
		id: localizedHref("id", path),
		en: localizedHref("en", path),
		"x-default": localizedHref("id", path),
	};

	return {
		metadataBase: new URL(SITE_URL),
		title,
		description,
		alternates: {
			canonical,
			languages,
		},
		openGraph: {
			type: "website",
			siteName: SITE_NAME,
			locale: locale === "id" ? "id_ID" : "en_US",
			alternateLocale: locale === "id" ? ["en_US"] : ["id_ID"],
			url: canonical,
			title,
			description,
			images: [
				{
					url: OG_IMAGE_PATH,
					alt: locale === "id" ? "Gerbang Selamat Datang Kota Tebing Tinggi" : "Welcome gate of Tebing Tinggi",
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: [OG_IMAGE_PATH],
		},
	};
}
