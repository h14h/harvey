/**
 * Input handling utilities for the Harvey TUI.
 *
 * These utilities help normalize input handling across different input sources
 * (Ink's useInput vs raw stdin) where key detection may behave differently.
 */

/**
 * DEL character (ASCII 127) - commonly used for backspace in Unix terminals.
 */
export const DEL_CHAR = "\x7f";

/**
 * BS character (ASCII 8) - traditional backspace control character.
 */
export const BS_CHAR = "\x08";

/**
 * Check if an input event represents a backspace action.
 *
 * This handles multiple sources of backspace input:
 * 1. Ink's key.backspace flag
 * 2. Raw DEL character (0x7f) from terminal
 * 3. Raw BS character (0x08) from terminal
 * 4. Ctrl+H (traditional terminal backspace)
 *
 * @param input - The character input
 * @param key - The key metadata from Ink
 * @returns true if this is a backspace action
 */
export function isBackspace(input: string, key: { backspace?: boolean; ctrl?: boolean }): boolean {
	// Ink detected backspace
	if (key.backspace) {
		return true;
	}

	// Raw terminal backspace characters
	if (input === DEL_CHAR || input === BS_CHAR) {
		return true;
	}

	// Ctrl+H (traditional terminal backspace)
	if (key.ctrl && input === "h") {
		return true;
	}

	return false;
}

/**
 * Check if an input character is printable and should be appended to text.
 *
 * Filters out:
 * - Control characters (ASCII 0-31)
 * - DEL character (ASCII 127)
 * - Empty strings
 *
 * @param input - The character input
 * @returns true if this is a printable character
 */
export function isPrintableChar(input: string): boolean {
	if (!input || input.length === 0) {
		return false;
	}

	const code = input.charCodeAt(0);

	// Filter control characters (0-31) and DEL (127)
	if (code < 32 || code === 127) {
		return false;
	}

	return true;
}
