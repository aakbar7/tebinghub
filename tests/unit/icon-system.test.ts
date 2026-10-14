import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "../..");
const sourceRoot = join(projectRoot, "src");

function collectSourceFiles(directory: string): string[] {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const entryPath = join(directory, entry.name);
		if (entry.isDirectory()) return collectSourceFiles(entryPath);
		return [".ts", ".tsx"].includes(extname(entry.name)) ? [entryPath] : [];
	});
}

const sourceFiles = collectSourceFiles(sourceRoot);

describe("Phosphor icon system", () => {
	it("uses the supported Phosphor package without Lucide", () => {
		const packageJson = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf8")) as {
			dependencies: Record<string, string>;
		};

		expect(packageJson.dependencies["@phosphor-icons/react"]).toBeTruthy();
		expect(packageJson.dependencies).not.toHaveProperty("lucide-react");
	});

	it("does not import legacy icon libraries", () => {
		const offenders = sourceFiles
			.filter((file) => readFileSync(file, "utf8").includes("lucide-react"))
			.map((file) => relative(projectRoot, file));

		expect(offenders).toEqual([]);
	});

	it("does not use Unicode glyphs as interface icons", () => {
		const iconGlyphs = /[→↓↗×◈●•]/u;
		const offenders = sourceFiles
			.filter((file) => iconGlyphs.test(readFileSync(file, "utf8")))
			.map((file) => relative(projectRoot, file));

		expect(offenders).toEqual([]);
	});

	it("keeps inline SVG reserved for the narrative river artwork", () => {
		const offenders = sourceFiles
			.filter((file) => relative(sourceRoot, file).replaceAll("\\", "/") !== "features/cinema/origin-stage.tsx")
			.filter((file) => readFileSync(file, "utf8").includes("<svg"))
			.map((file) => relative(projectRoot, file));

		expect(offenders).toEqual([]);
	});
});
