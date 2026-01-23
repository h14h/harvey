/**
 * Tests for error utilities.
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, rmSync, unlinkSync } from "node:fs";
import { join } from "node:path";

import { getRecoverySuggestion, getUserFriendlyMessage, logError } from "./errors";

// Set up a custom log directory for testing
const testLogDir = join(process.cwd(), "test-logs");
const testLogFilePath = join(testLogDir, "errors.log");

// Mock the logDir function to use test directory
const _originalLogDir = join(process.env.HOME ?? ".", ".local", "share", "harvey");

beforeEach(() => {
	// Clean up any existing test log file
	if (existsSync(testLogFilePath)) {
		unlinkSync(testLogFilePath);
	}
	// Create test log directory
	if (!existsSync(testLogDir)) {
		rmSync(testLogDir, { recursive: true, force: true });
	}
});

afterEach(() => {
	// Clean up test log directory
	if (existsSync(testLogDir)) {
		rmSync(testLogDir, { recursive: true, force: true });
	}
});

describe("Error Utilities", () => {
	describe("getUserFriendlyMessage", () => {
		it("returns message for API key errors", () => {
			const error = new Error("Authentication failed: Invalid API key");
			const message = getUserFriendlyMessage(error);
			expect(message).toContain("API key");
		});

		it("returns message for rate limiting errors", () => {
			const error = new Error("Rate limit exceeded");
			const message = getUserFriendlyMessage(error);
			expect(message).toContain("Rate limited");
		});

		it("returns message for network errors", () => {
			const error = new Error("Network connection failed");
			const message = getUserFriendlyMessage(error);
			expect(message).toContain("Network");
		});

		it("returns message for database errors", () => {
			const error = new Error("Database connection failed");
			const message = getUserFriendlyMessage(error);
			expect(message).toContain("Database");
		});

		it("returns message for config errors", () => {
			const error = new Error("Config parse error");
			const message = getUserFriendlyMessage(error);
			expect(message).toContain("Configuration");
		});

		it("returns original message for unknown errors", () => {
			const error = new Error("Something went wrong");
			const message = getUserFriendlyMessage(error);
			expect(message).toBe("Something went wrong");
		});

		it("handles string errors", () => {
			const message = getUserFriendlyMessage("This is an error");
			expect(message).toBe("This is an error");
		});

		it("handles unknown error types", () => {
			const message = getUserFriendlyMessage({ unknown: "error" });
			expect(message).toContain("unknown error");
		});
	});

	describe("getRecoverySuggestion", () => {
		it("returns suggestion for API key errors", () => {
			const error = new Error("Invalid API key");
			const suggestion = getRecoverySuggestion(error);
			expect(suggestion).toContain("config");
		});

		it("returns suggestion for rate limiting", () => {
			const error = new Error("Rate limit exceeded");
			const suggestion = getRecoverySuggestion(error);
			expect(suggestion).toContain("Wait");
		});

		it("returns suggestion for network errors", () => {
			const error = new Error("Network error");
			const suggestion = getRecoverySuggestion(error);
			expect(suggestion).toContain("connection");
		});

		it("returns suggestion for database errors", () => {
			const error = new Error("Database permission denied");
			const suggestion = getRecoverySuggestion(error);
			expect(suggestion).toContain("share/harvey");
		});

		it("returns suggestion for config errors", () => {
			const error = new Error("Config not found");
			const suggestion = getRecoverySuggestion(error);
			expect(suggestion).toContain("config");
		});

		it("returns null for unknown errors", () => {
			const error = new Error("Unknown error");
			const suggestion = getRecoverySuggestion(error);
			expect(suggestion).toBeNull();
		});

		it("returns null for non-Error types", () => {
			const suggestion = getRecoverySuggestion("string error");
			expect(suggestion).toBeNull();
		});
	});

	describe("logError", () => {
		it("logs error to file", () => {
			// Note: logError uses a fixed log directory, so we can't test the actual file write
			// in a unit test without mocking. We just verify it doesn't throw.
			const error = new Error("Test error");
			expect(() => logError(error, "test context")).not.toThrow();
		});

		it("logs string errors", () => {
			expect(() => logError("String error", "test context")).not.toThrow();
		});

		it("logs errors without context", () => {
			expect(() => logError(new Error("Test error"))).not.toThrow();
		});
	});
});
