import { expect, test } from "@playwright/test";

test("homepage remains editorial, responsive, and console-clean on desktop", async ({ page }) => {
	const browserProblems: string[] = [];
	page.on("console", (message) => {
		if (message.type() !== "error" && message.type() !== "warning") return;
		if (
			message.text().includes("tiles.openfreemap.org") ||
			message.text().includes("AJAXError") ||
			message.location().url.includes("tiles.openfreemap.org")
		)
			return;
		browserProblems.push(`${message.type()}: ${message.text()} @ ${message.location().url}`);
	});
	page.on("response", (response) => {
		if (response.status() >= 400) browserProblems.push(`response ${response.status()}: ${response.url()}`);
	});
	page.on("pageerror", (error) => browserProblems.push(`pageerror: ${error.message}`));
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto("/");

	await expect(page.getByRole("heading", { name: "Layak Disinggahi, Bukan Cuma Dilewati" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Berapa lama kamu bisa singgah?" })).toBeVisible();
	await expect(
		page.getByRole("heading", { name: "Bara batok, bambu, dan alasan paling hangat untuk berhenti." }),
	).toBeVisible();
	await page.locator("#atlas").scrollIntoViewIfNeeded();
	await expect(page.getByRole("region", { name: "Peta interaktif Tebing Tinggi" })).toBeVisible({ timeout: 15_000 });
	await page.screenshot({ fullPage: true, path: "test-results/phase1-home-desktop.png" });

	const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
	expect(overflow).toBeLessThanOrEqual(1);
	expect(browserProblems).toEqual([]);
});

test("320px layout keeps hero actions and mobile navigation usable", async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 800 });
	await page.goto("/");

	await expect(page.getByRole("link", { name: "Susun persinggahan" })).toBeVisible();
	await expect(page.getByRole("link", { name: "Buka peta" })).toBeVisible();
	await page.screenshot({ path: "test-results/phase1-home-mobile.png" });
	await page.getByText("Menu", { exact: true }).click();
	await expect(page.getByRole("navigation", { name: "Navigasi utama" }).last()).toBeVisible();
	await page.screenshot({ path: "test-results/phase1-mobile-menu.png" });

	const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
	expect(overflow).toBeLessThanOrEqual(1);
});

test("locale switching preserves the supporting route", async ({ page }) => {
	await page.goto("/peta?scope=day-trip");
	await page.getByRole("link", { name: "English", exact: true }).click();
	await expect(page).toHaveURL(/\/en\/peta\?scope=day-trip/);
	await expect(page.getByRole("heading", { name: "Read the city, one point at a time." })).toBeVisible();
});

test("navbar keeps its wayfinding controls aligned and visible", async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 800 });
	await page.goto("/");

	await expect(page.getByRole("link", { name: "Bahasa Indonesia", exact: true })).toBeVisible();
	await expect(page.getByRole("link", { name: "English", exact: true })).toBeVisible();

	const rail = page.locator(".site-header__rail");
	const menu = page.locator(".site-menu-toggle");
	const railBox = await rail.boundingBox();
	const menuBox = await menu.boundingBox();
	expect(railBox).not.toBeNull();
	expect(menuBox).not.toBeNull();
	expect((menuBox?.x ?? 0) + (menuBox?.width ?? 0)).toBeGreaterThan((railBox?.x ?? 0) + (railBox?.width ?? 0) * 0.88);

	await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.45));
	await page.waitForTimeout(450);
	const scrolledRailBox = await rail.boundingBox();
	expect(scrolledRailBox?.y ?? -1).toBeGreaterThanOrEqual(0);

	await page.setViewportSize({ width: 1024, height: 900 });
	const lineBox = await page.locator(".site-header__spine-line").boundingBox();
	const beadBox = await page.locator(".site-header__spine-bead").boundingBox();
	expect(lineBox).not.toBeNull();
	expect(beadBox).not.toBeNull();
	const lineCenter = (lineBox?.y ?? 0) + (lineBox?.height ?? 0) / 2;
	const beadCenter = (beadBox?.y ?? 0) + (beadBox?.height ?? 0) / 2;
	expect(Math.abs(lineCenter - beadCenter)).toBeLessThanOrEqual(1);
});

test("navbar ornament, menu hover, and footer keep distinct visual layers", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto("/");

	const fieldPattern = page.locator(".th-awan-larat").first();
	await expect(fieldPattern).toBeAttached();
	await expect(fieldPattern).toHaveCSS("background-image", /awan-larat-serdang/);

	const menu = page.locator(".site-menu-toggle");
	await menu.hover();
	const hoverColors = await menu.evaluate((element) => {
		const style = getComputedStyle(element);
		return { background: style.backgroundColor, foreground: style.color };
	});
	expect(hoverColors.background).not.toBe("rgb(213, 163, 43)");
	expect(hoverColors.foreground).not.toBe("rgb(8, 31, 30)");

	await menu.click();
	const footer = page.locator(".site-route-panel__footer");
	const lisplang = page.locator(".site-route-panel__lisplang");
	await expect(footer).toBeVisible();
	await expect(lisplang).toBeVisible();
	const footerBox = await footer.boundingBox();
	const lisplangBox = await lisplang.boundingBox();
	expect(footerBox).not.toBeNull();
	expect(lisplangBox).not.toBeNull();
	expect((footerBox?.y ?? 0) + (footerBox?.height ?? 0)).toBeLessThanOrEqual((lisplangBox?.y ?? 0) + 1);
});

test("animated display headings leave room for letterforms inside their masks", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto("/");
	await page.evaluate(() => document.fonts.ready);

	// The hero title now animates unmasked; reveal headings still use line masks.
	const firstLineMask = page.locator('#planner [data-reveal="heading"] > div').first();
	await expect(firstLineMask).toBeAttached();
	const maskRoom = await firstLineMask.evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			paddingTop: Number.parseFloat(style.paddingTop),
			paddingBottom: Number.parseFloat(style.paddingBottom),
		};
	});
	expect(maskRoom.paddingTop).toBeGreaterThan(0);
	expect(maskRoom.paddingBottom).toBeGreaterThan(maskRoom.paddingTop);
});

test("mobile editorial fill images keep a positioned, clipped frame", async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 800 });
	await page.goto("/");

	const image = page.locator("#landmarks .landmark-visual__image").first();
	await expect(image).toBeAttached();
	const frameStyle = await page.locator("[data-landmark-media-frame]").evaluate((element) => {
		const style = getComputedStyle(element);
		return { position: style.position, overflow: style.overflow, minHeight: Number.parseFloat(style.minHeight) };
	});
	expect(frameStyle.position).toBe("relative");
	expect(frameStyle.overflow).toBe("hidden");
	expect(frameStyle.minHeight).toBeGreaterThanOrEqual(256);
});

test("hero diorama keeps the collage on paper ground, gold primary CTA, and the origin stage carries its motif", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto("/");

	const diorama = page.locator(".home-hero__diorama");
	await expect(diorama).toBeVisible();
	const collage = page.locator(".home-hero__collage");
	await expect(collage).toBeAttached();
	// next/image `priority` drops the loading attribute entirely (eager default).
	await expect(collage).not.toHaveAttribute("loading", "lazy");
	const collageSrc = await collage.getAttribute("src");
	expect(collageSrc).toContain("hero-collage");
	await expect(page.locator(".home-hero__seam")).toBeAttached();
	const heroSurface = await page.locator(".home-hero").evaluate((element) => getComputedStyle(element).backgroundColor);
	expect(heroSurface).toBe("rgb(246, 242, 233)");

	const actionGroup = page.locator(".hero-actions");
	await expect(actionGroup).toBeVisible();
	const actions = actionGroup.locator(".hero-action");
	await expect(actions).toHaveCount(2);
	for (const action of await actions.all()) {
		await expect(action).toHaveCSS("border-radius", "0px");
	}
	const primary = actions.first();
	const secondary = actions.nth(1);
	await expect(primary).toHaveClass(/hero-action--primary/);
	await expect(secondary).toHaveClass(/hero-action--ghost/);
	const primarySurface = await primary.evaluate((element) => getComputedStyle(element).backgroundColor);
	expect(primarySurface).toBe("rgb(213, 163, 43)");
	const secondarySurface = await secondary.evaluate((element) => getComputedStyle(element).backgroundColor);
	expect(secondarySurface).toBe("rgba(0, 0, 0, 0)");

	const stageMotif = page.locator(".origin-stage__motif");
	await expect(stageMotif).toBeAttached();
	await expect(stageMotif).toHaveCSS("background-image", /awan-larat-serdang/);
	const motifOpacity = await stageMotif.evaluate((element) => Number.parseFloat(getComputedStyle(element).opacity));
	expect(motifOpacity).toBeGreaterThanOrEqual(0.24);
});

test("planner uses Roman steps and a light divider", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto("/");

	const planner = page.locator("#planner");
	const steps = planner.locator("[data-planner-step]");
	await expect(steps).toHaveCount(3);
	await expect(steps.nth(0).locator("[data-step-index]")).toHaveText("I");
	await expect(steps.nth(1).locator("[data-step-index]")).toHaveText("II");
	await expect(steps.nth(2).locator("[data-step-index]")).toHaveText("III");

	const dividers = planner.locator("[data-planner-step-divider]");
	await expect(dividers).toHaveCount(3);
	await expect(dividers.first()).toHaveCSS("background-image", "none");
	await expect(dividers.first()).toHaveCSS("background-color", "rgba(16, 61, 56, 0.16)");
	await expect(dividers.first()).toHaveCSS("height", "1px");
});

test("food chapter uses a purpose-built editorial spread without remote placeholders", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto("/");

	const food = page.locator("#food");
	const spread = food.locator("[data-food-spread]");
	await expect(spread).toBeAttached();
	await expect(food.getByRole("heading", { name: "Lemang Batok" })).toBeAttached();
	await expect(food.getByRole("heading", { name: "Roti Kacang" })).toBeAttached();
	await expect(food.getByRole("heading", { name: "Halua" })).toBeAttached();
	await expect(food.locator('[src*="placehold.co"]')).toHaveCount(0);
	await expect(food.locator("[data-asset-placeholder]")).toHaveCount(0);
});

test("reduced motion keeps the full homepage readable", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/");
	await page.locator("#made").scrollIntoViewIfNeeded();
	await expect(page.getByRole("heading", { name: "Prestasinya datang lebih dulu. Namanya menyusul." })).toBeVisible();
	const scrollBehavior = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
	expect(scrollBehavior).toBe("auto");
});

test("768 and 1024 layouts stay within the viewport", async ({ page }) => {
	await page.goto("/", { waitUntil: "domcontentloaded" });
	await expect(page.getByRole("heading", { name: "Layak Disinggahi, Bukan Cuma Dilewati" })).toBeVisible();

	for (const width of [768, 1024] as const) {
		await page.setViewportSize({ width, height: 900 });
		const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
		expect(overflow).toBeLessThanOrEqual(1);
	}
});

test("keyboard can reach primary navigation and locale controls", async ({ page }) => {
	await page.goto("/peta?category=kuliner&poi=lemang-batok");
	await page.keyboard.press("Tab");
	await page.keyboard.press("Tab");
	await page.keyboard.press("Tab");
	const focused = await page.evaluate(() => {
		const el = document.activeElement;
		return el?.tagName === "BODY" ? null : el?.tagName;
	});
	expect(focused).not.toBeNull();
});
