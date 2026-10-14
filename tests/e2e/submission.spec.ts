import { expect, type Page, test } from "@playwright/test";

const staticPaths = [
	"",
	"peta",
	"budaya",
	"kuliner",
	"wisata",
	"sejarah",
	"teknologi",
	"tokoh",
	"rencana",
	"sumber",
	"tentang",
] as const;

function localePath(locale: "id" | "en", path: string) {
	const clean = path.replace(/^\/+|\/+$/g, "");
	if (locale === "id") return clean ? `/${clean}` : "/";
	return clean ? `/en/${clean}` : "/en";
}

function localeFromHref(href: string): "id" | "en" {
	return href === "/en" || href.startsWith("/en/") ? "en" : "id";
}

async function collectShellLinks(page: Page, locale: "id" | "en") {
	const hrefs = await page.evaluate(() => {
		const roots = [...document.querySelectorAll("header a[href], footer a[href], nav a[href]")] as HTMLAnchorElement[];
		return roots
			.map((anchor) => anchor.getAttribute("href") ?? "")
			.filter((href) => href.startsWith("/") && !href.startsWith("//"));
	});
	return [
		...new Set(
			hrefs
				.map((href) => href.split("#")[0] ?? href)
				.filter(Boolean)
				.filter((href) => localeFromHref(href) === locale),
		),
	];
}

test.describe("submission link crawl and a11y shell", () => {
	for (const locale of ["id", "en"] as const) {
		test(`${locale}: footer carries the competition credit`, async ({ page }) => {
			await page.goto(localePath(locale, ""));

			const credit = page.locator("[data-competition-credit]");
			await expect(credit).toContainText("#kompetisiwebsitedigitalnusantaracity2026");
			await expect(credit.getByRole("img", { name: "Media Cloud Indonesia" })).toBeVisible();

			const creditBox = await credit.boundingBox();
			const footerBox = await page.locator("footer").boundingBox();
			expect(creditBox).not.toBeNull();
			expect(footerBox).not.toBeNull();
			expect(creditBox?.width ?? 0).toBeLessThan((footerBox?.width ?? 0) / 2);
		});

		test(`${locale}: nav and footer links resolve without shell errors`, async ({ page }) => {
			const browserProblems: string[] = [];
			page.on("console", (message) => {
				if (message.type() !== "error") return;
				const text = message.text();
				// MapLibre tile fetch can fail transiently in CI/local without failing the page shell.
				if (text.includes("tiles.openfreemap.org") || text.includes("AJAXError")) return;
				browserProblems.push(`console: ${text}`);
			});
			page.on("pageerror", (error) => browserProblems.push(`pageerror: ${error.message}`));

			const home = localePath(locale, "");
			const homeResponse = await page.goto(home);
			expect(homeResponse?.ok(), home).toBeTruthy();

			const shellLinks = await collectShellLinks(page, locale);
			expect(shellLinks.length).toBeGreaterThan(5);

			const visited = new Set<string>();
			for (const href of shellLinks) {
				if (visited.has(href)) continue;
				visited.add(href);
				const response = await page.goto(href);
				expect(response?.ok(), href).toBeTruthy();
				await expect(page.locator("html")).toHaveAttribute("lang", locale);
				await expect(page.locator("main")).toBeVisible();
				await expect(page.locator("h1").first()).toBeVisible();
			}

			expect(browserProblems, browserProblems.join("\n")).toEqual([]);
		});

		test(`${locale}: static route matrix keeps landmarks and focus styles`, async ({ page }) => {
			for (const path of staticPaths) {
				const route = localePath(locale, path);
				const response = await page.goto(route);
				expect(response?.ok(), route).toBeTruthy();
				await expect(page.locator("html")).toHaveAttribute("lang", locale);
				await expect(page.locator("main")).toBeVisible();
				await expect(page.locator("header").first()).toBeVisible();
				await expect(page.locator('button[aria-controls="site-route-panel"]')).toBeVisible();
				await expect(page.locator("footer")).toBeVisible();
			}

			await page.goto(localePath(locale, ""));
			await page.keyboard.press("Tab");
			const focused = page.locator(":focus-visible");
			await expect(focused.first()).toBeVisible();
			const outlineWidth = await focused.first().evaluate((el) => getComputedStyle(el).outlineWidth);
			expect(Number.parseFloat(outlineWidth)).toBeGreaterThan(0);
		});
	}

	test("robots and sitemap are published", async ({ request }) => {
		const robots = await request.get("/robots.txt");
		expect(robots.ok()).toBeTruthy();
		const robotsBody = await robots.text();
		expect(robotsBody).toContain("Sitemap: https://tebinghub.id/sitemap.xml");

		const sitemap = await request.get("/sitemap.xml");
		expect(sitemap.ok()).toBeTruthy();
		const sitemapBody = await sitemap.text();
		expect(sitemapBody).toContain("https://tebinghub.id/");
		expect(sitemapBody).toContain("https://tebinghub.id/en");
		expect(sitemapBody).toContain("https://tebinghub.id/peta");
		expect(sitemapBody).not.toContain("/rencana/");
	});

	test("application responses include the launch security baseline", async ({ request }) => {
		const response = await request.get("/");
		expect(response.ok()).toBeTruthy();

		const headers = response.headers();
		expect(headers["content-security-policy"]).toContain("default-src 'self'");
		expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
		expect(headers["permissions-policy"]).toContain("camera=()");
		expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
		expect(headers["strict-transport-security"]).toContain("max-age=");
		expect(headers["x-content-type-options"]).toBe("nosniff");
		expect(headers["x-frame-options"]).toBe("DENY");
		expect(headers["x-powered-by"]).toBeUndefined();
	});
});
