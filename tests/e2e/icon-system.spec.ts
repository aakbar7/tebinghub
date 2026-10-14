import { expect, test } from "@playwright/test";

test("Phosphor icons render across navigation, map controls, and source links", async ({ page }) => {
	await page.goto("/");

	const menuButton = page.locator('button[aria-controls="site-route-panel"]');
	await expect(menuButton).toBeVisible();
	await expect(menuButton.locator('svg[viewBox="0 0 256 256"]')).toBeVisible();

	await menuButton.click({ force: true });
	const routePanel = page.locator("#site-route-panel");
	await expect(routePanel).toHaveAttribute("aria-hidden", "false");
	await expect(routePanel).toBeVisible();
	await expect(routePanel.locator('svg[viewBox="0 0 256 256"]').first()).toBeVisible();

	await page.goto("/peta");
	const zoomIn = page.getByRole("button", { name: "Zoom in" });
	await expect(zoomIn).toBeVisible({ timeout: 15_000 });
	await expect(zoomIn.locator('svg[viewBox="0 0 256 256"]')).toBeVisible();

	await page.goto("/sumber");
	const sourceLink = page.getByRole("link", { name: /Buka sumber:/ }).first();
	await expect(sourceLink).toBeVisible();
	await expect(sourceLink.locator('svg[viewBox="0 0 256 256"]')).toBeVisible();
});
