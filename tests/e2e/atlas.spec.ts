import { expect, test } from "@playwright/test";

test("atlas supports direct shared state and browser history", async ({ page }) => {
	await page.goto("/peta?category=kuliner&scope=in-city&plan=two-hours&poi=lemang-batok");

	await expect(page.getByRole("heading", { name: "Baca kota, satu titik demi satu." })).toBeVisible();
	await expect(page.locator('[data-testid="atlas-fallback-list"]:visible')).toBeVisible();
	await expect(page.getByRole("heading", { name: "Lemang Batok" })).toBeVisible();

	await page.getByRole("button", { name: "Kafe", exact: true }).click();
	await expect(page).toHaveURL(/category=kafe/);
	await expect(page).not.toHaveURL(/poi=/);

	await page.goBack();
	await expect(page).toHaveURL(/category=kuliner.*scope=in-city.*plan=two-hours.*poi=lemang-batok/);
	await expect(page.getByRole("heading", { name: "Lemang Batok" })).toBeVisible();
});

test("switching route presets replaces the visible POIs and refits the map", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });

	const list = page.getByTestId("atlas-fallback-list");
	const tuguMarker = page.locator('.atlas-marker[aria-label^="Tugu 13 Desember"]');
	const sentraMarker = page.locator('.atlas-marker[aria-label^="Lemang Batok"]');
	const sharedMarkerDistance = async () => {
		const [tuguBox, sentraBox] = await Promise.all([tuguMarker.boundingBox(), sentraMarker.boundingBox()]);
		if (!tuguBox || !sentraBox) throw new Error("Expected both shared route markers to have bounding boxes");
		const tuguCenter = { x: tuguBox.x + tuguBox.width / 2, y: tuguBox.y + tuguBox.height / 2 };
		const sentraCenter = { x: sentraBox.x + sentraBox.width / 2, y: sentraBox.y + sentraBox.height / 2 };
		return Math.hypot(tuguCenter.x - sentraCenter.x, tuguCenter.y - sentraCenter.y);
	};
	const waitForStableSharedMarkerDistance = async (differentFrom?: number, minimumDelta = 0) => {
		let previous: number | undefined;
		let settledDistance = 0;
		let stableSamples = 0;
		await expect
			.poll(
				async () => {
					const current = await sharedMarkerDistance();
					const isDifferent = differentFrom === undefined || Math.abs(current - differentFrom) > minimumDelta;
					const isStable = previous !== undefined && Math.abs(current - previous) < 0.1;
					stableSamples = isDifferent && isStable ? stableSamples + 1 : 0;
					previous = current;
					settledDistance = current;
					return stableSamples;
				},
				{ intervals: [50, 75, 100, 150, 200], timeout: 5_000 },
			)
			.toBeGreaterThanOrEqual(2);
		return settledDistance;
	};

	await page.goto("/peta?scope=in-city");
	const noPlanMarkerDistance = await waitForStableSharedMarkerDistance();

	await page.goto("/peta?scope=in-city&plan=two-hours&poi=kedai-kopi-aghara");
	await expect(list.getByRole("button")).toHaveCount(3);
	await expect(page.locator(".atlas-marker")).toHaveCount(3);
	await expect(page.getByRole("heading", { name: "Kedai Kopi Aghara" })).toBeVisible();
	const initialMarkerDistance = await waitForStableSharedMarkerDistance(noPlanMarkerDistance, 2);
	expect(initialMarkerDistance).toBeGreaterThan(noPlanMarkerDistance * 1.5);

	await list.getByRole("button", { name: /Kedai Kopi Aghara/ }).click();
	const selectedFocusDistance = await waitForStableSharedMarkerDistance(initialMarkerDistance, 0.5);

	await page.getByRole("button", { name: "Setengah hari", exact: true }).click();

	await expect(page).toHaveURL(/plan=half-day/);
	await expect(page).not.toHaveURL(/poi=/);
	await expect(list.getByRole("button")).toHaveCount(6);
	await expect(list.getByRole("button", { name: /Puri Melayu Sri Menanti/ })).toBeVisible();
	await expect(list.getByRole("button", { name: /Legenda Cafe/ })).toBeVisible();
	await expect(page.locator(".atlas-marker")).toHaveCount(6);
	await expect(page.getByRole("heading", { name: "Kedai Kopi Aghara" })).toHaveCount(0);
	const halfDayMarkerDistance = await waitForStableSharedMarkerDistance(selectedFocusDistance, 2);
	expect(Math.abs(halfDayMarkerDistance - initialMarkerDistance)).toBeGreaterThan(2);

	await page.getByRole("button", { name: "Sehari", exact: true }).click();
	await expect(page).toHaveURL(/plan=full-day/);
	await expect(list.getByRole("button", { name: /Goodfella Tebing Tinggi/ })).toBeVisible();
	await expect(list.getByRole("button", { name: /Skuy Coffee/ })).toHaveCount(0);
	await expect(list.getByRole("button", { name: /Coffeeshop Rasio Seduh/ })).toHaveCount(0);
});

test("invalid atlas state falls back safely", async ({ page }) => {
	const response = await page.goto("/peta?category=unknown&scope=nearby&plan=weekend&poi=missing");

	expect(response?.ok()).toBeTruthy();
	await expect(page.locator('[data-testid="atlas-fallback-list"]:visible')).toBeVisible();
	await expect(page.getByRole("button", { name: "Semua", exact: true })).toHaveAttribute("aria-pressed", "true");
	await expect(page.locator('p[aria-live="polite"]:visible').first()).toBeVisible();
});

test("atlas keeps the list usable when WebGL is unavailable", async ({ page }) => {
	await page.addInitScript(() => {
		Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
			configurable: true,
			value: () => null,
		});
	});
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/peta?scope=day-trip");

	await expect(page.getByTestId("atlas-map-fallback")).toBeVisible();
	await expect(page.locator('[data-testid="atlas-fallback-list"]:visible')).toBeVisible();
	await expect(page.getByRole("button", { name: /Arung Jeram Bah Bolon/ })).toBeVisible();
});

test("all cafes stay clustered while a review-needed record exposes only visitor detail", async ({ page }) => {
	await page.goto("/peta?category=kafe&poi=cafe-vnine-coffee-house-16");

	await expect(page.getByText("55 tempat")).toBeVisible();
	// Internal QA tallies never reach visitors.
	await expect(page.getByText(/terverifikasi|perlu ditinjau/)).toHaveCount(0);
	await expect(page.getByRole("heading", { name: "Vnine Coffee House" })).toBeVisible();
	await expect(page.getByText(/sedang diperbarui/)).toBeVisible();
	await expect(page.getByText(/Rating saat data dikumpulkan/)).toHaveCount(0);
	await expect(page.locator(".maplibregl-marker")).toHaveCount(0);
	await expect(page.locator(".maplibregl-canvas")).toBeVisible();
	await page.screenshot({ path: "test-results/phase1-atlas-desktop.png" });
});

test("atlas search narrows the list and the clusters", async ({ page }) => {
	await page.goto("/peta");

	const list = page.getByTestId("atlas-fallback-list");
	await page.getByPlaceholder(/Cari tempat/).fill("lemang");
	await expect(list.getByRole("button", { name: /Lemang Batok/ })).toBeVisible();
	await expect(list.getByRole("button", { name: /Sentra Lemang Pusat Oleh-oleh/ })).toBeVisible();
	await expect(list.getByRole("button", { name: /Tugu 13 Desember/ })).toHaveCount(0);

	await page.getByLabel("Hapus pencarian").click();
	await expect(list.getByRole("button", { name: /Tugu 13 Desember/ })).toBeVisible();
});
