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
	// Center the control so the sticky dock cannot intercept the real click.
	await createButton.evaluate((node) => {
		node.scrollIntoView({ block: "center", inline: "nearest" });
	});
	await expect(createButton).toBeInViewport();
	await createButton.click();
	await expect(page).toHaveURL(/\/rencana\/[a-z0-9]+/i, { timeout: 20_000 });
	await expect(page).toHaveURL(/#edit=/);
	await expect(page.locator('[data-plan-mode="editor"]')).toBeVisible({ timeout: 20_000 });
}

test("editor shows co-pilot while viewer does not", async ({ page }) => {
	await page.goto("/#planner");
	await createCollaborativePlan(page);
	await expect(page.locator('[data-plan-copilot="editor"]')).toBeVisible();
	await expect(page.getByRole("heading", { name: "Revisi rencana dengan bantuan" })).toBeVisible();

	const viewerUrl = stripHash(page.url());
	await page.goto(viewerUrl);
	await expect(page.locator('[data-plan-mode="viewer"]')).toBeVisible({ timeout: 20_000 });
	await expect(page.locator('[data-plan-copilot="editor"]')).toHaveCount(0);
	await expect(page.getByRole("heading", { name: "Revisi rencana dengan bantuan" })).toHaveCount(0);
});

test("homepage AI tab is reachable via #concierge and keyboard operable", async ({ page }) => {
	const gsapTargetWarnings: string[] = [];
	page.on("console", (message) => {
		if (message.type() === "warning" && message.text().includes("GSAP target")) {
			gsapTargetWarnings.push(message.text());
		}
	});

	await page.goto("/#concierge");
	const concierge = page.locator("#concierge");
	await expect(concierge).toBeVisible();
	await expect(concierge.getByRole("heading", { name: "Mau rute yang lebih pas?" })).toBeVisible();
	const planner = page.locator("#planner");
	await planner.scrollIntoViewIfNeeded();
	await expect(planner.getByText("Pilih waktu singgah atau susun rute sendiri.")).toBeVisible();
	await expect(planner.getByRole("tablist")).toHaveAttribute("aria-describedby", "planner-choice-guidance");

	const aiTab = planner.getByRole("tab", { name: /Rute versimu/ });
	await expect(aiTab).toHaveAttribute("aria-selected", "true");
	await expect(planner.getByRole("heading", { name: "Buat rute versimu" })).toBeVisible();

	const twoHourTab = planner.getByRole("tab", { name: /2 jam/ });
	const halfDayTab = planner.getByRole("tab", { name: /5 jam/ });
	await twoHourTab.focus();
	await page.keyboard.press("ArrowRight");
	await expect(halfDayTab).toBeVisible();
	await expect(halfDayTab).toBeFocused();
	await expect(halfDayTab).toHaveAttribute("aria-selected", "true");
	await expect(aiTab).toHaveAttribute("aria-selected", "false");
	await expect(concierge).toHaveCount(0);

	await page.keyboard.press("End");
	await expect(aiTab).toBeFocused();
	await expect(aiTab).toHaveAttribute("aria-selected", "true");
	await page.keyboard.press("Home");
	await expect(twoHourTab).toBeFocused();
	await expect(twoHourTab).toHaveAttribute("aria-selected", "true");

	await aiTab.click();
	await expect(concierge).toBeVisible();
	const request = concierge.getByRole("textbox", { name: "Ceritakan rute yang kamu inginkan" });
	await request.fill("Lebih banyak ruang hijau");
	await expect(concierge.getByText("Kirim dengan Ctrl/Command + Enter.")).toBeVisible();
	await expect(concierge.getByRole("button", { name: "Susun dengan AI" })).toBeEnabled();
	expect(gsapTargetWarnings).toEqual([]);
});

test("homepage planner and AI guidance keep English parity", async ({ page }) => {
	await page.goto("/en/#concierge");
	const planner = page.locator("#planner");
	await expect(planner.getByText("Choose your stopover time or make your own route.")).toBeVisible();
	const concierge = page.locator("#concierge");
	await expect(concierge.getByRole("textbox", { name: "Describe the route you want" })).toBeVisible();
	await expect(concierge.getByText("Submit with Ctrl/Command + Enter.")).toBeVisible();
});

test("mobile #concierge keeps the AI heading clear of the fixed header", async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 780 });
	await page.goto("/#concierge");

	const header = page.locator(".site-header__rail");
	const heading = page.getByRole("heading", { name: "Mau rute yang lebih pas?" });
	await expect(heading).toBeVisible();

	const headerBox = await header.boundingBox();
	const headingBox = await heading.boundingBox();
	expect(headerBox).not.toBeNull();
	expect(headingBox).not.toBeNull();
	if (!headerBox || !headingBox) return;
	expect(headingBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height + 28);
});
