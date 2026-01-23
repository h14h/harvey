/**
 * Tests for input handling utilities.
 *
 * These tests ensure proper detection of backspace and control characters
 * across different input sources (Ink's useInput vs raw stdin).
 *
 * Bug #40: Backspace wasn't working in modals because raw stdin mode
 * bypasses Ink's key detection, sending DEL character (0x7f) as input
 * instead of setting key.backspace = true.
 */

import { describe, expect, test } from "bun:test";
import { BS_CHAR, DEL_CHAR, isBackspace, isEscapeSequenceFragment, isPrintableChar } from "./input";

describe("isBackspace", () => {
	test("detects Ink's key.backspace flag", () => {
		expect(isBackspace("", { backspace: true })).toBe(true);
		expect(isBackspace("abc", { backspace: true })).toBe(true);
	});

	test("detects raw DEL character (0x7f) from terminal", () => {
		expect(isBackspace(DEL_CHAR, {})).toBe(true);
		expect(isBackspace("\x7f", {})).toBe(true);
	});

	test("detects raw BS character (0x08) from terminal", () => {
		expect(isBackspace(BS_CHAR, {})).toBe(true);
		expect(isBackspace("\x08", {})).toBe(true);
	});

	test("detects Ctrl+H as backspace", () => {
		expect(isBackspace("h", { ctrl: true })).toBe(true);
	});

	test("returns false for regular characters", () => {
		expect(isBackspace("a", {})).toBe(false);
		expect(isBackspace("z", {})).toBe(false);
		expect(isBackspace("1", {})).toBe(false);
		expect(isBackspace(" ", {})).toBe(false);
	});

	test("returns false for other control key combinations", () => {
		expect(isBackspace("c", { ctrl: true })).toBe(false);
		expect(isBackspace("a", { ctrl: true })).toBe(false);
	});

	test("returns false for empty input without flags", () => {
		expect(isBackspace("", {})).toBe(false);
	});

	test("handles combination of flags - key.backspace takes precedence", () => {
		// Even with ctrl pressed, backspace flag should be detected
		expect(isBackspace("h", { backspace: true, ctrl: true })).toBe(true);
	});
});

describe("isPrintableChar", () => {
	test("returns true for printable ASCII characters", () => {
		expect(isPrintableChar("a")).toBe(true);
		expect(isPrintableChar("Z")).toBe(true);
		expect(isPrintableChar("0")).toBe(true);
		expect(isPrintableChar(" ")).toBe(true);
		expect(isPrintableChar("!")).toBe(true);
		expect(isPrintableChar("~")).toBe(true);
	});

	test("returns false for control characters (0-31)", () => {
		// Test various control characters
		expect(isPrintableChar("\x00")).toBe(false); // NUL
		expect(isPrintableChar("\x01")).toBe(false); // SOH
		expect(isPrintableChar("\x08")).toBe(false); // BS
		expect(isPrintableChar("\x09")).toBe(false); // TAB
		expect(isPrintableChar("\x0a")).toBe(false); // LF
		expect(isPrintableChar("\x0d")).toBe(false); // CR
		expect(isPrintableChar("\x1b")).toBe(false); // ESC
		expect(isPrintableChar("\x1f")).toBe(false); // US
	});

	test("returns false for DEL character (127)", () => {
		expect(isPrintableChar("\x7f")).toBe(false);
		expect(isPrintableChar(DEL_CHAR)).toBe(false);
	});

	test("returns false for empty string", () => {
		expect(isPrintableChar("")).toBe(false);
	});

	test("handles multi-character strings by checking first character", () => {
		// isPrintableChar checks first character only
		expect(isPrintableChar("abc")).toBe(true);
		expect(isPrintableChar("\x00abc")).toBe(false);
	});

	test("returns true for extended ASCII and unicode", () => {
		expect(isPrintableChar("\x80")).toBe(true); // Extended ASCII
		expect(isPrintableChar("\xc0")).toBe(true); // Extended ASCII
		expect(isPrintableChar("\xff")).toBe(true); // Extended ASCII
	});
});

describe("character constants", () => {
	test("DEL_CHAR is correct", () => {
		expect(DEL_CHAR).toBe("\x7f");
		expect(DEL_CHAR.charCodeAt(0)).toBe(127);
	});

	test("BS_CHAR is correct", () => {
		expect(BS_CHAR).toBe("\x08");
		expect(BS_CHAR.charCodeAt(0)).toBe(8);
	});
});

/**
 * Tests for escape sequence fragment detection.
 *
 * Bug #41: Ctrl+Enter was inserting garbage characters like '[27;5;13~'
 * because terminal escape sequences were split across buffer reads.
 * The escape character (\x1b) comes in one read, and the rest of the
 * sequence ('[27;5;13~') comes in the next, bypassing escape handling.
 */
describe("isEscapeSequenceFragment", () => {
	test("detects Ctrl+Enter escape sequence fragments (bug #41)", () => {
		// These are the fragments that remain after \x1b is consumed
		expect(isEscapeSequenceFragment("[27;5;13~")).toBe(true);
		expect(isEscapeSequenceFragment("[13;5u")).toBe(true);
		expect(isEscapeSequenceFragment("[13;5~")).toBe(true);
	});

	test("detects arrow key escape sequence fragments", () => {
		expect(isEscapeSequenceFragment("[A")).toBe(true);
		expect(isEscapeSequenceFragment("[B")).toBe(true);
		expect(isEscapeSequenceFragment("[C")).toBe(true);
		expect(isEscapeSequenceFragment("[D")).toBe(true);
	});

	test("detects other CSI escape sequence fragments", () => {
		// F1-F4 keys
		expect(isEscapeSequenceFragment("[11~")).toBe(true);
		expect(isEscapeSequenceFragment("[12~")).toBe(true);
		// Page Up/Down
		expect(isEscapeSequenceFragment("[5~")).toBe(true);
		expect(isEscapeSequenceFragment("[6~")).toBe(true);
		// Home/End
		expect(isEscapeSequenceFragment("[H")).toBe(true);
		expect(isEscapeSequenceFragment("[F")).toBe(true);
		// Shift+Arrow
		expect(isEscapeSequenceFragment("[1;2A")).toBe(true);
		expect(isEscapeSequenceFragment("[1;2B")).toBe(true);
	});

	test("returns false for normal printable characters", () => {
		expect(isEscapeSequenceFragment("a")).toBe(false);
		expect(isEscapeSequenceFragment("abc")).toBe(false);
		expect(isEscapeSequenceFragment("[")).toBe(false);
		expect(isEscapeSequenceFragment("123")).toBe(false);
	});

	test("returns false for empty or short strings", () => {
		expect(isEscapeSequenceFragment("")).toBe(false);
		expect(isEscapeSequenceFragment("a")).toBe(false);
	});

	test("returns false for strings that don't match CSI pattern", () => {
		// Missing terminator
		expect(isEscapeSequenceFragment("[27;5;13")).toBe(false);
		// Doesn't start with [
		expect(isEscapeSequenceFragment("27;5;13~")).toBe(false);
		// Invalid characters in parameters
		expect(isEscapeSequenceFragment("[a;b;c~")).toBe(false);
	});
});

describe("isPrintableChar - escape sequence filtering (bug #41)", () => {
	test("filters out Ctrl+Enter garbage characters", () => {
		// The exact garbage reported in bug #41
		expect(isPrintableChar("[27;5;13~")).toBe(false);
	});

	test("filters out other escape sequence fragments", () => {
		expect(isPrintableChar("[13;5u")).toBe(false);
		expect(isPrintableChar("[A")).toBe(false);
		expect(isPrintableChar("[1;2A")).toBe(false);
	});

	test("still allows normal text starting with [", () => {
		// Single bracket is fine (not a valid CSI pattern)
		expect(isPrintableChar("[")).toBe(true);
		// Text with brackets
		expect(isPrintableChar("a")).toBe(true);
	});
});
