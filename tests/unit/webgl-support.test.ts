import { afterEach, describe, expect, it, vi } from "vitest";
import { supportsWebGL } from "@/features/atlas/webgl-support";

describe("supportsWebGL", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("releases the probe context so later MapLibre init is not starved", () => {
		const loseContext = vi.fn();
		const getExtension = vi.fn().mockReturnValue({ loseContext });
		const getContext = vi.fn().mockImplementation((type: string) => {
			if (type === "webgl2") return { getExtension };
			return null;
		});
		vi.spyOn(document, "createElement").mockReturnValue({ getContext } as unknown as HTMLCanvasElement);

		expect(supportsWebGL()).toBe(true);
		expect(getContext).toHaveBeenCalledWith("webgl2", {
			failIfMajorPerformanceCaveat: false,
			powerPreference: "default",
		});
		expect(loseContext).toHaveBeenCalledTimes(1);
	});

	it("tries WebGL1 on a fresh canvas when WebGL2 is unavailable", () => {
		const loseContext = vi.fn();
		const getContext = vi.fn().mockImplementation((type: string) => {
			if (type === "webgl") {
				return { getExtension: () => ({ loseContext }) };
			}
			return null;
		});
		vi.spyOn(document, "createElement").mockReturnValue({ getContext } as unknown as HTMLCanvasElement);

		expect(supportsWebGL()).toBe(true);
		expect(getContext).toHaveBeenCalledWith("webgl2", {
			failIfMajorPerformanceCaveat: false,
			powerPreference: "default",
		});
		expect(getContext).toHaveBeenCalledWith("webgl", {
			failIfMajorPerformanceCaveat: false,
			powerPreference: "default",
		});
		expect(document.createElement).toHaveBeenCalledTimes(2);
		expect(loseContext).toHaveBeenCalledTimes(1);
	});
});
