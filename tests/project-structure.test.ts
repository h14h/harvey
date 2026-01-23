import { expect, test } from "bun:test";
import { statSync } from "node:fs";
import { join } from "node:path";

const projectRoot = process.cwd();

const requiredDirectories = ["src/db", "src/services", "src/tui", "src/config", "src/types"];

const requiredFiles = ["src/index.ts"];

test("project structure directories exist", () => {
	for (const dir of requiredDirectories) {
		const path = join(projectRoot, dir);
		const stats = statSync(path);
		expect(stats.isDirectory()).toBe(true);
	}
});

test("project structure required files exist", async () => {
	for (const file of requiredFiles) {
		const path = join(projectRoot, file);
		const exists = await Bun.file(path).exists();
		expect(exists).toBe(true);
	}
});
