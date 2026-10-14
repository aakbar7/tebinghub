import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchOsrmRoute, resetOsrmRouteCache } from "@/features/atlas/osrm-route";

const waypoints: [number, number][] = [
	[99.1623117, 3.3275084],
	[99.159653, 3.329094],
];

afterEach(() => {
	resetOsrmRouteCache();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("OSRM route helper", () => {
	it("uses the provider geometry when the response is Ok", async () => {
		const geometry: [number, number][] = [
			[99.16, 3.327],
			[99.161, 3.328],
			[99.159, 3.329],
		];
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => ({
				ok: true,
				json: async () => ({
					code: "Ok",
					routes: [{ geometry: { coordinates: geometry } }],
				}),
			})),
		);

		await expect(fetchOsrmRoute(waypoints)).resolves.toEqual(geometry);
	});

	it("falls back to the waypoint polyline when the request fails", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				throw new Error("network");
			}),
		);

		await expect(fetchOsrmRoute(waypoints)).resolves.toEqual(waypoints);
	});
});
