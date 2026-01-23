/**
 * Build script for Harvey release artifacts.
 *
 * Usage:
 *   bun run scripts/build.ts                    # Use default version
 *   VERSION=1.0.0 bun run scripts/build.ts      # Use specific version
 *
 * Environment variables:
 *   VERSION - Version tag (default: 0.1.0)
 *   OUT_DIR - Output directory (default: dist)
 */

import { $ } from "bun";

// Build configuration
const VERSION = process.env.VERSION || "0.1.0";
const OUT_DIR = process.env.OUT_DIR || "dist";
const PROJECT_ROOT = import.meta.dir;
const DIST_DIR = `${PROJECT_ROOT}/../${OUT_DIR}`;

// Platform targets
interface Target {
	name: string;
	bunTarget: string;
	extension: string;
	archiveType: "tar.gz" | "zip";
}

const TARGETS: Target[] = [
	{ name: "linux-x64", bunTarget: "bun-linux-x64", extension: "", archiveType: "tar.gz" },
	{ name: "darwin-x64", bunTarget: "bun-darwin-x64", extension: "", archiveType: "tar.gz" },
	{ name: "darwin-arm64", bunTarget: "bun-darwin-arm64", extension: "", archiveType: "tar.gz" },
	{ name: "windows-x64", bunTarget: "bun-windows-x64", extension: ".exe", archiveType: "zip" },
];

/**
 * Create output directory if it doesn't exist.
 */
async function ensureDistDir(): Promise<void> {
	await $`mkdir -p ${DIST_DIR}`;
}

/**
 * Build the binary for a specific target.
 */
async function buildBinary(target: Target): Promise<string> {
	const basename = `harvey-${VERSION}-${target.name}`;
	const outfile = `${DIST_DIR}/${basename}${target.extension}`;

	console.log(`Building ${basename}...`);

	await $`bun build --compile --target=${target.bunTarget} --outfile=${outfile} ${PROJECT_ROOT}/../src/index.tsx`;

	return outfile;
}

/**
 * Create a tar.gz archive.
 */
async function createTarGz(binaryPath: string, target: Target): Promise<string> {
	const basename = `harvey-${VERSION}-${target.name}`;
	const archivePath = `${DIST_DIR}/${basename}.tar.gz`;
	const binaryName = `harvey${target.extension}`;

	// Create archive with the binary renamed to just "harvey"
	await $`cd ${DIST_DIR} && tar -czf ${archivePath} --transform='s|.*|${binaryName}|' ${binaryPath}`;

	return archivePath;
}

/**
 * Create a zip archive.
 */
async function createZip(binaryPath: string, target: Target): Promise<string> {
	const basename = `harvey-${VERSION}-${target.name}`;
	const archivePath = `${DIST_DIR}/${basename}.zip`;
	const binaryName = `harvey${target.extension}`;

	// Create archive with the binary renamed to just "harvey"
	const tempDir = `${DIST_DIR}/${basename}-temp`;
	await $`mkdir -p ${tempDir}`;
	await $`cp ${binaryPath} ${tempDir}/${binaryName}`;
	await $`cd ${tempDir} && zip -r ${archivePath} ${binaryName}`;
	await $`rm -rf ${tempDir}`;

	return archivePath;
}

/**
 * Create an archive for the built binary.
 */
async function createArchive(binaryPath: string, target: Target): Promise<string> {
	console.log(`Creating archive for ${target.name}...`);

	if (target.archiveType === "tar.gz") {
		return createTarGz(binaryPath, target);
	} else {
		return createZip(binaryPath, target);
	}
}

/**
 * Generate SHA256 checksum for a file.
 */
async function generateChecksum(filepath: string): Promise<string> {
	const result = await $`shasum -a 256 ${filepath}`.quiet();
	return result.stdout.toString().trim().split(" ")[0];
}

/**
 * Generate checksums for all archives.
 */
async function generateChecksums(archives: string[]): Promise<void> {
	console.log("Generating checksums...");

	const checksumFile = `${DIST_DIR}/checksums.txt`;
	const checksums: string[] = [];

	for (const archive of archives) {
		const checksum = await generateChecksum(archive);
		const basename = archive.split("/").pop();
		if (!basename) {
			throw new Error(`Invalid archive path: ${archive}`);
		}
		checksums.push(`${checksum}  ${basename}`);
	}

	// Sort for consistent ordering
	checksums.sort();

	// Write checksums file
	await Bun.write(checksumFile, `${checksums.join("\n")}\n`);
}

/**
 * Clean up temporary build files.
 */
async function cleanup(binaries: string[]): Promise<void> {
	console.log("Cleaning up temporary files...");

	for (const binary of binaries) {
		await $`rm ${binary}`.quiet();
	}
}

/**
 * Main build process.
 */
async function main(): Promise<void> {
	console.log(`Building Harvey v${VERSION}`);
	console.log(`Output directory: ${DIST_DIR}`);
	console.log();

	await ensureDistDir();

	const binaries: string[] = [];
	const archives: string[] = [];

	// Build for each target
	for (const target of TARGETS) {
		const binary = await buildBinary(target);
		binaries.push(binary);

		const archive = await createArchive(binary, target);
		archives.push(archive);

		console.log(`✓ Built ${target.name}`);
	}

	// Generate checksums
	await generateChecksums(archives);

	// Clean up temporary binaries
	await cleanup(binaries);

	console.log();
	console.log("Build complete!");
	console.log();
	console.log("Artifacts:");
	for (const archive of archives) {
		console.log(`  ${archive}`);
	}
	console.log(`  ${DIST_DIR}/checksums.txt`);
}

// Run the build
main().catch((error) => {
	console.error("Build failed:", error);
	process.exit(1);
});
