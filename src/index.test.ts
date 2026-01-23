/**
 * Tests for the main entry point.
 *
 * These tests verify that:
 * - The entry module can be imported without executing the runtime path
 * - The entry module exports a main function for CLI execution
 */

import { expect, test } from "bun:test";

test("main entry point exports main without running on import", async () => {
	const module = await import("./index.js");
	expect(typeof module.main).toBe("function");
});
