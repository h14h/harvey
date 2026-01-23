/**
 * Tests for the main entry point and StdinHandler component.
 *
 * These tests verify that:
 * - The main entry point can be imported without errors (catches module-level hook calls)
 * - The StdinHandler component is a valid React component
 */

import { expect, test } from "bun:test";
import { render } from "ink-testing-library";
import { StdinHandler } from "./ui/components/StdinHandler";

/**
 * Test that the main entry point can be imported without errors.
 *
 * This test would fail if hooks were called at module level (outside of components),
 * which was the bug in issue #37.
 */
test("main entry point can be imported without throwing invalid hook call error", async () => {
	// Dynamically import the main entry point to verify it doesn't throw errors
	// during module initialization
	await import("./index");
	// If we get here without throwing, the test passes
	expect(true).toBe(true);
});

/**
 * Test that StdinHandler renders without errors.
 *
 * Verifies that StdinHandler is a proper React component that can be rendered.
 */
test("StdinHandler renders as a renderless component", () => {
	const { lastFrame } = render(<StdinHandler />);

	// StdinHandler returns null (renderless component), so it should not output anything
	const frame = lastFrame() ?? "";
	expect(frame).toBe("");
});
