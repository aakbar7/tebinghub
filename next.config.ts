import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const isDevelopment = process.env.NODE_ENV === "development";
const contentSecurityPolicy = [
	"default-src 'self'",
	`script-src 'self' 'unsafe-inline' blob:${isDevelopment ? " 'unsafe-eval'" : ""}`,
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
	"font-src 'self' data: https://fonts.gstatic.com",
	"img-src 'self' blob: data: https:",
	`connect-src 'self' https://tiles.openfreemap.org https://router.project-osrm.org https://*.convex.cloud https://*.convex.site wss://*.convex.cloud wss://*.convex.site${isDevelopment ? " http: ws:" : ""}`,
	"media-src 'self'",
	"worker-src 'self' blob:",
	"child-src 'self' blob:",
	"object-src 'none'",
	"base-uri 'self'",
	"form-action 'self'",
	"frame-ancestors 'none'",
	...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
	allowedDevOrigins: ["127.0.0.1"],
	images: {
		remotePatterns: [{ protocol: "https", hostname: "placehold.co", pathname: "/**" }],
	},
	experimental: {
		optimizePackageImports: ["@phosphor-icons/react"],
	},
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{ key: "Content-Security-Policy", value: contentSecurityPolicy },
					{
						key: "Permissions-Policy",
						value: "camera=(), microphone=(), payment=(), usb=(), browsing-topics=(), geolocation=(self)",
					},
					{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
					{ key: "Strict-Transport-Security", value: "max-age=63072000" },
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "X-Frame-Options", value: "DENY" },
				],
			},
		];
	},
	poweredByHeader: false,
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();
