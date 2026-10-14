import { expect, test } from "@playwright/test";

test("default locale route renders the Indonesian shell", async ({ page }) => {
	await page.goto("/");

	await expect(page).toHaveTitle(/tebinghub\.id/);
	await expect(page.getByRole("heading", { name: "Layak Disinggahi, Bukan Cuma Dilewati" })).toBeVisible();
});

test("English locale route renders the translated shell", async ({ page }) => {
	await page.goto("/en");

	await expect(page).toHaveTitle(/tebinghub\.id/);
	await expect(page.getByRole("heading", { name: "Worth Stopping For, Not Just Passing Through" })).toBeVisible();
});

test("supporting route skeletons and locale guard are reachable", async ({ page }) => {
	for (const route of [
		"/peta",
		"/budaya",
		"/kuliner",
		"/sejarah",
		"/wisata",
		"/teknologi",
		"/tokoh",
		"/rencana",
		"/sumber",
		"/tentang",
	]) {
		const response = await page.goto(route);
		expect(response?.ok(), route).toBeTruthy();
		await expect(page.locator("h1")).toBeVisible();
	}

	const unsupported = await page.goto("/ms");
	expect(unsupported?.status()).toBe(404);
});
