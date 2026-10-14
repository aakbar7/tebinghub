import { expect, test } from "@playwright/test";

function stripHash(url: string) {
	return url.split("#")[0] ?? url;
}

async function createCollaborativePlan(page: import("@playwright/test").Page) {
	const planner = page.locator("#planner");
	await planner.scrollIntoViewIfNeeded();
	const createButton = planner.getByRole("button", { name: "Buat rencana bersama" });
	await expect(createButton).toBeVisible();
	await expect(createButton).toBeEnabled({ timeout: 20_000 });
	await expect(createButton).toHaveAttribute("data-plan-create", "ready");
	await createButton.evaluate((node) => {
		node.scrollIntoView({ block: "center", inline: "nearest" });
	});
	await expect(createButton).toBeInViewport();
	await createButton.click();
	await expect(page).toHaveURL(/\/rencana\/[a-z0-9]+/i, { timeout: 20_000 });
	await expect(page).toHaveURL(/#edit=/);
	await expect(page.locator('[data-plan-mode="editor"]')).toBeVisible({ timeout: 20_000 });
}

test("collaborative plan create, share, and live edit across two contexts", async ({ browser, page }) => {
	await page.goto("/#planner");
	await createCollaborativePlan(page);
	await expect(page.getByRole("heading", { level: 2, name: "Urutan singgah" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Geser urutan" })).toHaveCount(3);

	const editorUrl = page.url();
	expect(editorUrl).toContain("#edit=");

	const viewerUrl = stripHash(editorUrl);
	const viewerContext = await browser.newContext();
	const viewerPage = await viewerContext.newPage();
	await viewerPage.goto(viewerUrl);

	await expect(viewerPage.locator('[data-plan-mode="viewer"]')).toBeVisible({ timeout: 20_000 });
	await expect(viewerPage.getByRole("button", { name: "Hapus" })).toHaveCount(0);
	await expect(viewerPage.getByRole("button", { name: "Geser urutan" })).toHaveCount(0);

	await page.getByRole("combobox").selectOption({ label: "Skuy Coffee" });
	await page.getByRole("button", { name: "Tambah" }).click();

	await expect(page.getByText("Skuy Coffee")).toBeVisible();
	await expect(viewerPage.getByText("Skuy Coffee")).toBeVisible({ timeout: 15_000 });

	const atlasLink = page.getByRole("link", { name: "Buka di atlas" });
	await expect(atlasLink).toHaveAttribute("href", /route=/);
	await expect(atlasLink).not.toHaveAttribute("href", /plan=/);

	await viewerContext.close();
});

test("viewer cannot mutate without the edit capability hash", async ({ page }) => {
	await page.goto("/#planner");
	await createCollaborativePlan(page);

	const viewerUrl = stripHash(page.url());
	await page.goto(viewerUrl);
	await expect(page.locator('[data-plan-mode="viewer"]')).toBeVisible({ timeout: 20_000 });
	await expect(page.getByRole("combobox")).toHaveCount(0);
	await expect(page.getByRole("button", { name: "Tambah" })).toHaveCount(0);
});
