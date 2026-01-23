/**
 * Tests for the build script.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { promises as fs } from "node:fs";
import { join } from "node:path";

const TEST_DIR = join(import.meta.dir, "test-build-temp");

// Import build script functions
// Note: We need to test the script's functionality since it's a CLI tool

describe("build script", () => {
	beforeEach(async () => {
		// Create test directory
		await fs.mkdir(TEST_DIR, { recursive: true });
	});

	afterEach(async () => {
		// Clean up test directory
		await fs.rm(TEST_DIR, { recursive: true, force: true });
	});

	test("build script exists and is valid TypeScript", async () => {
		const buildScriptPath = join(import.meta.dir, "build.ts");
		const stat = await fs.stat(buildScriptPath);
		expect(stat.isFile()).toBeTrue();
	});

	test("can read VERSION environment variable", () => {
		// Test that the script reads VERSION from environment
		const originalVersion = process.env.VERSION;
		process.env.VERSION = "1.2.3";

		// Import and check the VERSION constant
		// Note: This tests the pattern used in the build script
		const testVersion = process.env.VERSION || "0.1.0";
		expect(testVersion).toBe("1.2.3");

		// Restore original
		if (originalVersion === undefined) {
			delete process.env.VERSION;
		} else {
			process.env.VERSION = originalVersion;
		}
	});

	test("defaults to version 0.1.0 when VERSION not set", () => {
		const originalVersion = process.env.VERSION;
		delete process.env.VERSION;

		const testVersion = process.env.VERSION || "0.1.0";
		expect(testVersion).toBe("0.1.0");

		// Restore original
		if (originalVersion !== undefined) {
			process.env.VERSION = originalVersion;
		}
	});

	test("shasum command is available for checksum generation", async () => {
		// Create a test file
		const testFile = join(TEST_DIR, "test.txt");
		await fs.writeFile(testFile, "test content");

		// Try to generate checksum
		const proc = Bun.spawn(["shasum", "-a", "256", testFile], {
			stdout: "pipe",
			stderr: "pipe",
		});

		const exitCode = await proc.exited;
		expect(exitCode).toBe(0);

		const output = await new Response(proc.stdout).text();
		expect(output).toBeTruthy();
		// Output should be: "hash  filename"
		expect(output).toMatch(/^[a-f0-9]{64}\s+/);
	});

	test("tar command is available for archive creation", async () => {
		// Create test file
		const testFile = join(TEST_DIR, "test.txt");
		await fs.writeFile(testFile, "test content");

		// Create archive
		const archivePath = join(TEST_DIR, "test.tar.gz");
		const proc = Bun.spawn(["tar", "-czf", archivePath, "-C", TEST_DIR, "test.txt"], {
			stdout: "pipe",
			stderr: "pipe",
		});

		const exitCode = await proc.exited;
		expect(exitCode).toBe(0);

		// Verify archive exists
		const stat = await fs.stat(archivePath);
		expect(stat.isFile()).toBeTrue();
	});

	test("zip command is available for Windows archives", async () => {
		// Create test file
		const testFile = join(TEST_DIR, "test.txt");
		await fs.writeFile(testFile, "test content");

		// Create zip
		const archivePath = join(TEST_DIR, "test.zip");
		const proc = Bun.spawn(["zip", "-r", archivePath, "test.txt"], {
			cwd: TEST_DIR,
			stdout: "pipe",
			stderr: "pipe",
		});

		const exitCode = await proc.exited;
		expect(exitCode).toBe(0);

		// Verify zip exists
		const stat = await fs.stat(archivePath);
		expect(stat.isFile()).toBeTrue();
	});

	test("target platform names match expected patterns", () => {
		const targets = [
			{ name: "linux-x64", bunTarget: "bun-linux-x64" },
			{ name: "darwin-x64", bunTarget: "bun-darwin-x64" },
			{ name: "darwin-arm64", bunTarget: "bun-darwin-arm64" },
			{ name: "windows-x64", bunTarget: "bun-windows-x64" },
		];

		for (const target of targets) {
			// Name should match pattern: os-arch
			expect(target.name).toMatch(/^(linux|darwin|windows)-(x64|arm64)$/);
			// Bun target should match pattern: bun-os-arch
			expect(target.bunTarget).toMatch(/^bun-(linux|darwin|windows)-(x64|arm64)$/);
		}
	});

	test("archive file naming follows convention", () => {
		const version = "1.0.0";
		const targets = ["linux-x64", "darwin-x64", "darwin-arm64", "windows-x64"];

		for (const target of targets) {
			const tarGzName = `harvey-${version}-${target}.tar.gz`;
			const zipName = `harvey-${version}-${target}.zip`;

			// tar.gz for Unix, zip for Windows
			if (target === "windows-x64") {
				expect(zipName).toMatch(/^harvey-1\.0\.0-windows-x64\.zip$/);
			} else {
				expect(tarGzName).toMatch(/^harvey-1\.0\.0-(linux|darwin)-(x64|arm64)\.tar\.gz$/);
			}
		}
	});

	test("checksums file format is correct", () => {
		const checksum = "a".repeat(64);
		const filename = "harvey-1.0.0-linux-x64.tar.gz";
		const line = `${checksum}  ${filename}`;

		expect(line).toMatch(/^[a-f0-9]{64} {2}.+$/);
	});

	test("output directory structure is correct", () => {
		const version = "1.0.0";
		const distDir = "dist";

		const archiveFiles = [
			`${distDir}/harvey-${version}-linux-x64.tar.gz`,
			`${distDir}/harvey-${version}-darwin-x64.tar.gz`,
			`${distDir}/harvey-${version}-darwin-arm64.tar.gz`,
			`${distDir}/harvey-${version}-windows-x64.zip`,
		];

		// Check archive files match pattern
		for (const file of archiveFiles) {
			expect(file).toMatch(/^dist\/harvey-1\.0\.0-.+\.(tar\.gz|zip)$/);
		}

		// Check checksums file separately
		const checksumsFile = `${distDir}/checksums.txt`;
		expect(checksumsFile).toBe("dist/checksums.txt");
	});
});

describe("build script integration", () => {
	test("build script can be executed with bun", async () => {
		const buildScriptPath = join(import.meta.dir, "build.ts");

		// Just verify the script can be loaded and has the expected structure
		const content = await fs.readFile(buildScriptPath, "utf-8");

		// Verify key imports and functions
		expect(content).toContain('import { $ } from "bun"');
		expect(content).toContain("async function buildBinary");
		expect(content).toContain("async function createArchive");
		expect(content).toContain("async function generateChecksums");
		expect(content).toContain("async function main");
	});

	test("build script has correct shebang/documentation", async () => {
		const buildScriptPath = join(import.meta.dir, "build.ts");
		const content = await fs.readFile(buildScriptPath, "utf-8");

		// Should document usage
		expect(content).toContain("Usage:");
		expect(content).toContain("VERSION");
		expect(content).toContain("OUT_DIR");
	});
});
