import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
	ConfigError,
	initConfig,
	loadConfig,
	saveConfig,
	validateConfig,
} from "../src/config/manager";

const originalBunHome = Bun.env.HOME;
const originalProcessHome = process.env.HOME;
let tempHome = "";

function restoreHome(): void {
	if (originalBunHome === undefined) {
		delete Bun.env.HOME;
	} else {
		Bun.env.HOME = originalBunHome;
	}

	if (originalProcessHome === undefined) {
		delete process.env.HOME;
	} else {
		process.env.HOME = originalProcessHome;
	}
}

beforeEach(() => {
	tempHome = mkdtempSync(join(tmpdir(), "harvey-config-"));
	Bun.env.HOME = tempHome;
	process.env.HOME = tempHome;
});

afterEach(() => {
	if (tempHome) {
		rmSync(tempHome, { recursive: true, force: true });
	}
	restoreHome();
});

test("initConfig creates defaults on first run", async () => {
	const config = await initConfig();
	expect(config).toEqual({ openai_api_key: "", turn_frequency: 6 });

	const configPath = join(tempHome, ".config", "harvey", "config.json");
	const file = Bun.file(configPath);
	expect(await file.exists()).toBe(true);
	expect(await file.json()).toEqual(config);
});

test("loadConfig returns saved values", async () => {
	const custom = { openai_api_key: "sk-test", turn_frequency: 10 };
	await saveConfig(custom);

	const loaded = await loadConfig();
	expect(loaded).toEqual(custom);
});

test("loadConfig creates defaults when missing", async () => {
	const loaded = await loadConfig();
	expect(loaded).toEqual({ openai_api_key: "", turn_frequency: 6 });
});

test("loadConfig throws a clear error on invalid JSON", async () => {
	const configPath = join(tempHome, ".config", "harvey", "config.json");
	await Bun.write(configPath, "{");

	await expect(loadConfig()).rejects.toThrow(ConfigError);
	await expect(loadConfig()).rejects.toThrow("corrupted");
});

test("validateConfig rejects invalid values", () => {
	expect(() => validateConfig({})).toThrow(ConfigError);
	expect(() => validateConfig({ openai_api_key: "", turn_frequency: 0 })).toThrow("turn_frequency");
});
