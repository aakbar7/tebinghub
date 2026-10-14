import type { MetadataRoute } from "next";
import { localizedHref, SITE_URL, staticSitePaths } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
	const now = new Date();
	const entries: MetadataRoute.Sitemap = [];

	for (const path of staticSitePaths) {
		for (const locale of ["id", "en"] as const) {
			entries.push({
				url: new URL(localizedHref(locale, path), SITE_URL).toString(),
				lastModified: now,
				changeFrequency: path === "" ? "weekly" : "monthly",
				priority: path === "" ? 1 : 0.7,
			});
		}
	}

	return entries;
}
