/**
 * Tests for the KeyHandler class.
 */

import { beforeEach, describe, expect, it } from "bun:test";
import { KeyHandler } from "./handler";
import type { KeyAction } from "./types";
import { DEFAULT_BINDINGS } from "./types";

describe("KeyHandler", () => {
	let actions: KeyAction[] = [];
	let handler: KeyHandler;

	beforeEach(() => {
		actions = [];
		handler = new KeyHandler({
			bindings: DEFAULT_BINDINGS,
			onAction: (action) => actions.push(action),
			sequenceTimeout: 100,
		});
	});

	describe("Single key bindings", () => {
		it("should handle 'q' for quit", () => {
			handler.handleInput({ input: "q", key: "q", ctrl: false, shift: false, alt: false });
			expect(actions).toEqual(["quit"]);
		});

		it("should handle 'j' for goDown in normal mode", () => {
			handler.handleInput({ input: "j", key: "j", ctrl: false, shift: false, alt: false });
			expect(actions).toEqual(["goDown"]);
		});

		it("should handle 'k' for goUp in normal mode", () => {
			handler.handleInput({ input: "k", key: "k", ctrl: false, shift: false, alt: false });
			expect(actions).toEqual(["goUp"]);
		});

		it("should handle 'n' for newChat in normal mode", () => {
			handler.handleInput({ input: "n", key: "n", ctrl: false, shift: false, alt: false });
			expect(actions).toEqual(["newChat"]);
		});

		it("should handle '?' for showHelp", () => {
			handler.handleInput({ input: "?", key: "?", ctrl: false, shift: false, alt: false });
			expect(actions).toEqual(["showHelp"]);
		});
	});

	describe("Multi-key sequences", () => {
		it("should handle 'gg' for goTop", () => {
			handler.handleInput({ input: "g", key: "g", ctrl: false, shift: false, alt: false });
			expect(actions).toHaveLength(0); // Waiting for second 'g'

			handler.handleInput({ input: "g", key: "g", ctrl: false, shift: false, alt: false });
			expect(actions).toEqual(["goTop"]);
		});

		it("should handle 'dd' for deleteChat", () => {
			handler.handleInput({ input: "d", key: "d", ctrl: false, shift: false, alt: false });
			// First "d" is buffered to wait for potential "dd"
			expect(actions).toHaveLength(0);

			handler.handleInput({ input: "d", key: "d", ctrl: false, shift: false, alt: false });
			// Second "d" completes "dd" sequence and triggers deleteChat
			expect(actions).toEqual(["deleteChat"]);
		});

		it("should timeout incomplete sequences", async () => {
			handler.handleInput({ input: "g", key: "g", ctrl: false, shift: false, alt: false });
			expect(actions).toHaveLength(0);

			// Wait for timeout (100ms + buffer)
			await new Promise((resolve) => setTimeout(resolve, 150));
			expect(actions).toHaveLength(0); // No action executed for incomplete sequence
		});
	});

	describe("Mode switching", () => {
		it("should switch to insert mode with 'i'", () => {
			expect(handler.state.mode).toBe("normal");
			handler.handleInput({ input: "i", key: "i", ctrl: false, shift: false, alt: false });
			expect(handler.state.mode).toBe("insert");
		});

		it("should switch to insert mode with 'a'", () => {
			expect(handler.state.mode).toBe("normal");
			handler.handleInput({ input: "a", key: "a", ctrl: false, shift: false, alt: false });
			expect(handler.state.mode).toBe("insert");
		});

		it("should switch to normal mode with Escape", () => {
			handler.state.mode = "insert";
			handler.handleInput({ input: "", key: "escape", ctrl: false, shift: false, alt: false });
			expect(handler.state.mode).toBe("normal");
		});

		it("should switch to normal mode with Ctrl+c in insert mode", () => {
			handler.state.mode = "insert";
			handler.handleInput({ input: "c", key: "", ctrl: true, shift: false, alt: false });
			expect(handler.state.mode).toBe("normal");
		});
	});

	describe("Focus handling", () => {
		it("should cycle focus forward with Tab", () => {
			handler.handleInput({ input: "", key: "Tab", ctrl: false, shift: false, alt: false });
			expect(handler.state.focus).toBe("message-view");

			handler.handleInput({ input: "", key: "Tab", ctrl: false, shift: false, alt: false });
			expect(handler.state.focus).toBe("input");

			handler.handleInput({ input: "", key: "Tab", ctrl: false, shift: false, alt: false });
			expect(handler.state.focus).toBe("chat-list"); // Wrapped around
		});

		it("should cycle focus backward with Shift+Tab", () => {
			handler.handleInput({ input: "", key: "Tab", ctrl: false, shift: true, alt: false });
			expect(handler.state.focus).toBe("input"); // Wrapped backward
		});

		it("should move focus left with 'h'", () => {
			handler.state.focus = "message-view";
			handler.handleInput({ input: "h", key: "h", ctrl: false, shift: false, alt: false });
			expect(handler.state.focus).toBe("chat-list");
		});

		it("should move focus right with 'l'", () => {
			handler.handleInput({ input: "l", key: "l", ctrl: false, shift: false, alt: false });
			expect(handler.state.focus).toBe("message-view");
		});
	});

	describe("Mode indicator", () => {
		it("should show NORMAL indicator", () => {
			expect(handler.getModeIndicator()).toBe("[NORMAL]");
		});

		it("should show INSERT indicator", () => {
			handler.state.mode = "insert";
			expect(handler.getModeIndicator()).toBe("[INSERT]");
		});
	});

	describe("Arrow keys", () => {
		it("should handle ArrowDown for goDown", () => {
			handler.handleInput({ input: "", key: "ArrowDown", ctrl: false, shift: false, alt: false });
			expect(actions).toEqual(["goDown"]);
		});

		it("should handle ArrowUp for goUp", () => {
			handler.handleInput({ input: "", key: "ArrowUp", ctrl: false, shift: false, alt: false });
			expect(actions).toEqual(["goUp"]);
		});
	});

	describe("Insert mode bindings", () => {
		it("should handle Enter for sendMessage in insert mode", () => {
			handler.state.mode = "insert";
			handler.handleInput({ input: "", key: "Enter", ctrl: false, shift: false, alt: false });
			expect(actions).toEqual(["sendMessage"]);
		});

		it("should handle Ctrl+Enter for newline in insert mode", () => {
			handler.state.mode = "insert";
			handler.handleInput({ input: "", key: "Enter", ctrl: true, shift: false, alt: false });
			expect(actions).toEqual(["newline"]);
		});

		it("should handle Backspace for deleteChar in insert mode", () => {
			handler.state.mode = "insert";
			handler.handleInput({ input: "", key: "Backspace", ctrl: false, shift: false, alt: false });
			expect(actions).toEqual(["deleteChar"]);
		});

		it("should handle Ctrl+w for deleteWord in insert mode", () => {
			handler.state.mode = "insert";
			handler.handleInput({ input: "", key: "w", ctrl: true, shift: false, alt: false });
			expect(actions).toEqual(["deleteWord"]);
		});

		it("should handle Ctrl+u for clearLine in insert mode", () => {
			handler.state.mode = "insert";
			handler.handleInput({ input: "", key: "u", ctrl: true, shift: false, alt: false });
			expect(actions).toEqual(["clearLine"]);
		});
	});

	describe("Reset", () => {
		it("should reset to initial state", () => {
			handler.state.mode = "insert";
			handler.state.focus = "input";
			handler.state.buffer = ["g", "g"];
			handler.state.inSequence = true;

			handler.reset();

			expect(handler.state.mode).toBe("normal");
			expect(handler.state.focus).toBe("chat-list");
			expect(handler.state.buffer).toEqual([]);
			expect(handler.state.inSequence).toBe(false);
		});
	});
});
