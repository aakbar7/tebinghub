import { expect, test } from "@playwright/test";

test("reduced motion keeps all six origin chapters readable", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/#origin");

	const origin = page.getByRole("region", { name: "Kisah asal Tebing Tinggi" });
	await expect(origin).toBeVisible();
	await expect(origin.locator('[data-cinema-mode="still"]')).toBeVisible();
	await expect(origin.getByRole("heading", { level: 3 })).toHaveCount(6);
	await expect(origin.getByRole("heading", { name: "Yang hilang, yang diteruskan" })).toBeVisible();
	await page.screenshot({ fullPage: true, path: "test-results/phase2-origin-reduced-motion.png" });
});

test("capable desktop activates the scrubbed origin stage", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/#origin");

	const stage = page.locator('[data-cinema-mode="cinematic"]');
	await expect(stage).toBeVisible();
	await stage.scrollIntoViewIfNeeded();
	await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2.5));
	await expect(stage.locator("[data-active-beat]")).not.toHaveAttribute("data-active-beat", "0");
	await page.screenshot({ path: "test-results/phase2-origin-desktop.png" });
});

test("landmark gallery is keyboard operable and excludes the palace", async ({ page }) => {
	await page.goto("/#landmarks");

	const gallery = page.getByRole("region", { name: "Landmark kota" });
	await expect(page.locator('[data-cinema-mode="cinematic"]')).toBeVisible();
	await gallery.evaluate((element) => {
		document.documentElement.style.scrollBehavior = "auto";
		element.scrollIntoView({ block: "start" });
	});
	const monument = gallery.getByRole("tab", { name: "Tugu 13 Desember" });
	const junction = gallery.getByRole("tab", { name: "Tugu Simpang Beo" });
	const horse = gallery.getByRole("tab", { name: "Patung Kuda Simpang Dolok" });
	await monument.focus();
	await page.keyboard.press("ArrowRight");
	await expect(junction).toHaveAttribute("aria-selected", "true");
	await page.keyboard.press("ArrowRight");

	await expect(horse).toHaveAttribute("aria-selected", "true");
	const panel = gallery.getByRole("tabpanel");
	await panel.dispatchEvent("pointerdown", { clientX: 300 });
	await panel.dispatchEvent("pointerup", { clientX: 100 });
	await expect(gallery.getByRole("tab", { name: "Gerbang Selamat Datang" })).toHaveAttribute("aria-selected", "true");
	await expect(gallery.getByText("Istana Negeri Padang")).toHaveCount(0);
	await page.screenshot({ path: "test-results/phase2-landmarks-desktop.png" });
});

test("mobile uses the complete stacked origin fallback without overflow", async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 800 });
	await page.goto("/#origin");

	const origin = page.getByRole("region", { name: "Kisah asal Tebing Tinggi" });
	await expect(origin.locator('[data-cinema-mode="still"]')).toBeVisible();
	await expect(origin.getByRole("heading", { level: 3 })).toHaveCount(6);
	await origin.evaluate((element) => {
		document.documentElement.style.scrollBehavior = "auto";
		element.scrollIntoView({ block: "start" });
	});
	const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
	expect(overflow).toBeLessThanOrEqual(1);
	await page.screenshot({ path: "test-results/phase2-origin-mobile.png" });
});

test("resizing from cinematic desktop to mobile does not throw", async ({ page }) => {
	const pageErrors: string[] = [];
	page.on("pageerror", (error) => {
		pageErrors.push(error.message);
	});

	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/#origin");
	const origin = page.getByRole("region", { name: "Kisah asal Tebing Tinggi" });
	await expect(origin.locator('[data-cinema-mode="cinematic"]')).toBeVisible();
	await origin.locator('[data-cinema-mode="cinematic"]').scrollIntoViewIfNeeded();

	await page.setViewportSize({ width: 390, height: 844 });
	await expect(origin.locator('[data-cinema-mode="still"]')).toBeVisible();
	await expect(origin.getByRole("heading", { level: 3 })).toHaveCount(6);
	expect(pageErrors.join("\n")).not.toMatch(/removeChild|Node\.removeChild|couldn't load/i);
});
