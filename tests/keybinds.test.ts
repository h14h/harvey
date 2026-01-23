import { beforeEach, describe, expect, test } from "bun:test";
import { DEFAULT_BINDINGS, type KeyAction, KeyHandler } from "../src/ui/keybinds/index.js";

describe("KeyHandler", () => {
	let dispatchedActions: KeyAction[];
	let handler: KeyHandler;

	beforeEach(() => {
		dispatchedActions = [];
		handler = new KeyHandler({
			bindings: DEFAULT_BINDINGS,
			onAction: (action) => dispatchedActions.push(action),
			sequenceTimeout: 100,
		});
	});

	// Simulate key press - uses the key name for special keys
	function press(
		key: string,
		modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}
	): void {
		handler.handleInput({
			input: key.length === 1 ? key : "",
			key: key,
			ctrl: modifiers.ctrl ?? false,
			shift: modifiers.shift ?? false,
			alt: modifiers.alt ?? false,
		});
	}

	describe("mode switching", () => {
		test("starts in normal mode", () => {
			expect(handler.state.mode).toBe("normal");
		});

		test('enters insert mode on "i" key', () => {
			press("i");
			expect(handler.state.mode).toBe("insert");
			expect(dispatchedActions).toContain("enterInsertMode");
		});

		test('enters insert mode on "a" key', () => {
			press("a");
			expect(handler.state.mode).toBe("insert");
			expect(dispatchedActions).toContain("enterInsertModeAppend");
		});

		test("returns to normal mode on Escape", () => {
			handler.setMode("insert");
			press("Escape");
			expect(handler.state.mode).toBe("normal");
			expect(dispatchedActions).toContain("enterNormalMode");
		});

		test("returns to normal mode on Ctrl+c", () => {
			handler.setMode("insert");
			press("c", { ctrl: true });
			expect(handler.state.mode).toBe("normal");
			expect(dispatchedActions).toContain("enterNormalMode");
		});
	});

	describe("normal mode navigation", () => {
		test('moves down with "j"', () => {
			press("j");
			expect(dispatchedActions).toContain("goDown");
		});

		test("moves down with arrow down", () => {
			press("ArrowDown");
			expect(dispatchedActions).toContain("goDown");
		});

		test('moves up with "k"', () => {
			press("k");
			expect(dispatchedActions).toContain("goUp");
		});

		test('goes to top with "gg"', () => {
			press("g");
			press("g");
			expect(dispatchedActions).toContain("goTop");
		});

		test('goes to bottom with "G"', () => {
			press("G");
			expect(dispatchedActions).toContain("goBottom");
		});

		test("scrolls down with Ctrl+d", () => {
			press("d", { ctrl: true });
			expect(dispatchedActions).toContain("scrollDown");
		});

		test("scrolls up with Ctrl+u", () => {
			press("u", { ctrl: true });
			expect(dispatchedActions).toContain("scrollUp");
		});
	});

	describe("chat management", () => {
		test('creates new chat with "n"', () => {
			press("n");
			expect(dispatchedActions).toContain("newChat");
		});

		test("selects chat with Enter", () => {
			press("Enter");
			expect(dispatchedActions).toContain("selectChat");
		});

		test('searches with "/"', () => {
			press("/");
			expect(dispatchedActions).toContain("searchChats");
		});

		test('deletes with "d" (after timeout or flush)', () => {
			press("d");
			// "d" is buffered to wait for potential "dd" sequence
			expect(handler.state.buffer).toEqual(["d"]);
			// No immediate action dispatched
			expect(dispatchedActions).not.toContain("deleteChat");
		});

		test('double "d" triggers delete immediately', () => {
			press("d");
			press("d");
			// "dd" matches immediately, not twice
			expect(dispatchedActions).toContain("deleteChat");
			const deleteActions = dispatchedActions.filter((a) => a === "deleteChat");
			expect(deleteActions.length).toBe(1);
		});
	});

	describe("insert mode input", () => {
		beforeEach(() => {
			handler.setMode("insert");
			dispatchedActions = [];
		});

		test("sends message with Enter", () => {
			press("Enter");
			expect(dispatchedActions).toContain("sendMessage");
		});

		test("inserts newline with Ctrl+Enter", () => {
			press("Enter", { ctrl: true });
			expect(dispatchedActions).toContain("newline");
		});

		test("deletes char with Backspace", () => {
			press("Backspace");
			expect(dispatchedActions).toContain("deleteChar");
		});

		test("deletes word with Ctrl+w", () => {
			press("w", { ctrl: true });
			expect(dispatchedActions).toContain("deleteWord");
		});

		test("clears line with Ctrl+u", () => {
			press("u", { ctrl: true });
			expect(dispatchedActions).toContain("clearLine");
		});
	});

	describe("application actions", () => {
		test('quits with "q"', () => {
			press("q");
			expect(dispatchedActions).toContain("quit");
		});

		test('shows help with "?"', () => {
			press("?");
			expect(dispatchedActions).toContain("showHelp");
		});

		test("redraws with Ctrl+l", () => {
			press("l", { ctrl: true });
			expect(dispatchedActions).toContain("redraw");
		});

		test('edits global tone with "t"', () => {
			press("t");
			expect(dispatchedActions).toContain("editGlobalTone");
		});
	});

	describe("focus management", () => {
		test('focuses left with "h"', () => {
			press("h");
			expect(dispatchedActions).toContain("focusLeft");
		});

		test('focuses right with "l"', () => {
			press("l");
			expect(dispatchedActions).toContain("focusRight");
		});

		test("cycles focus with Tab", () => {
			expect(handler.state.focus).toBe("chat-list");
			handler.setFocus("chat-list");
			press("Tab");
			expect(handler.state.focus).toBe("message-view");
		});

		test("cycles focus backward with Shift+Tab", () => {
			handler.setFocus("message-view");
			press("Tab", { shift: true });
			expect(handler.state.focus).toBe("chat-list");
		});

		test("setFocus updates focus area", () => {
			handler.setFocus("input");
			expect(handler.state.focus).toBe("input");
		});
	});

	describe("mode indicator", () => {
		test("returns [NORMAL] in normal mode", () => {
			handler.setMode("normal");
			expect(handler.getModeIndicator()).toBe("[NORMAL]");
		});

		test("returns [INSERT] in insert mode", () => {
			handler.setMode("insert");
			expect(handler.getModeIndicator()).toBe("[INSERT]");
		});
	});

	describe("reset", () => {
		test("resets to initial state", () => {
			handler.setMode("insert");
			handler.setFocus("input");
			handler.reset();
			expect(handler.state.mode).toBe("normal");
			expect(handler.state.focus).toBe("chat-list");
			expect(handler.state.buffer).toEqual([]);
		});
	});

	describe("sequence timeout", () => {
		test("buffers partial sequences", () => {
			press("g");
			expect(handler.state.buffer).toEqual(["g"]);
			expect(handler.state.inSequence).toBe(true);
		});

		test("clears buffer after timeout", async () => {
			press("g");
			expect(handler.state.buffer).toEqual(["g"]);
			// Wait for timeout
			await new Promise((resolve) => setTimeout(resolve, 150));
			expect(handler.state.buffer).toEqual([]);
		});

		test("completes sequence on second key", () => {
			press("g");
			press("g");
			expect(dispatchedActions).toContain("goTop");
			expect(handler.state.buffer).toEqual([]);
		});
	});

	describe("binding lookup", () => {
		test("only matches bindings for current mode", () => {
			// In normal mode, Enter should select chat
			handler.setMode("normal");
			press("Enter");
			expect(dispatchedActions).toContain("selectChat");

			// In insert mode, Enter should send message
			handler.setMode("insert");
			dispatchedActions = [];
			press("Enter");
			expect(dispatchedActions).toContain("sendMessage");
		});
	});
});

describe("DEFAULT_BINDINGS", () => {
	test("has bindings for all required normal mode actions", () => {
		const requiredActions: KeyAction[] = [
			"quit",
			"goUp",
			"goDown",
			"goTop",
			"goBottom",
			"newChat",
			"deleteChat",
			"searchChats",
			"selectChat",
			"enterInsertMode",
			"showHelp",
			"editGlobalTone",
			"redraw",
		];

		for (const action of requiredActions) {
			const hasBinding = DEFAULT_BINDINGS.some(
				(b) => b.action === action && b.modes.includes("normal")
			);
			expect(hasBinding).toBe(true);
		}
	});

	test("has multi-key sequences", () => {
		const sequences = DEFAULT_BINDINGS.map((b) => b.sequence);
		expect(sequences).toContain("gg");
		expect(sequences).toContain("dd");
	});
});
