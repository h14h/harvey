import { describe, expect, test } from "bun:test";
import type { InputEvent, KeyInfo } from "../types.js";
import { DEFAULT_BINDINGS, resolveKeybind } from "./keybinds.js";

type KeyOverrides = Partial<KeyInfo> & Pick<KeyInfo, "name">;

function buildEvent(overrides: KeyOverrides): InputEvent {
	const key: KeyInfo = {
		name: overrides.name,
		char: overrides.name === "char" ? (overrides.char ?? "") : undefined,
		ctrl: overrides.ctrl ?? false,
		alt: overrides.alt ?? false,
		shift: overrides.shift ?? false,
	};

	return {
		key,
		raw: "",
	};
}

describe("resolveKeybind", () => {
	test("handles normal mode command bindings", () => {
		expect(
			resolveKeybind(buildEvent({ name: "char", char: "q" }), "normal", DEFAULT_BINDINGS)
		).toEqual({
			actions: [],
			commands: [{ type: "QUIT" }],
		});
		expect(
			resolveKeybind(
				buildEvent({ name: "char", char: "c", ctrl: true }),
				"normal",
				DEFAULT_BINDINGS
			)
		).toEqual({
			actions: [],
			commands: [{ type: "QUIT" }],
		});
	});

	test("handles normal mode navigation and focus", () => {
		expect(
			resolveKeybind(buildEvent({ name: "char", char: "i" }), "normal", DEFAULT_BINDINGS)
		).toEqual({
			actions: [
				{ type: "SET_MODE", mode: "insert" },
				{ type: "SET_FOCUS", focus: "input" },
			],
			commands: [],
		});
		expect(
			resolveKeybind(buildEvent({ name: "char", char: "a" }), "normal", DEFAULT_BINDINGS)
		).toEqual({
			actions: [
				{ type: "SET_MODE", mode: "insert" },
				{ type: "SET_FOCUS", focus: "input" },
			],
			commands: [],
		});
		expect(
			resolveKeybind(buildEvent({ name: "char", char: "j" }), "normal", DEFAULT_BINDINGS)
		).toEqual({
			actions: [{ type: "MOVE_SELECTION", delta: 1 }],
			commands: [],
		});
		expect(resolveKeybind(buildEvent({ name: "down" }), "normal", DEFAULT_BINDINGS)).toEqual({
			actions: [{ type: "MOVE_SELECTION", delta: 1 }],
			commands: [],
		});
		expect(
			resolveKeybind(buildEvent({ name: "char", char: "k" }), "normal", DEFAULT_BINDINGS)
		).toEqual({
			actions: [{ type: "MOVE_SELECTION", delta: -1 }],
			commands: [],
		});
		expect(resolveKeybind(buildEvent({ name: "up" }), "normal", DEFAULT_BINDINGS)).toEqual({
			actions: [{ type: "MOVE_SELECTION", delta: -1 }],
			commands: [],
		});
		expect(
			resolveKeybind(buildEvent({ name: "char", char: "G" }), "normal", DEFAULT_BINDINGS)
		).toEqual({
			actions: [{ type: "SELECT_CHAT", index: -1 }],
			commands: [],
		});
		expect(resolveKeybind(buildEvent({ name: "tab" }), "normal", DEFAULT_BINDINGS)).toEqual({
			actions: [{ type: "FOCUS_NEXT" }],
			commands: [],
		});
		expect(
			resolveKeybind(buildEvent({ name: "tab", shift: true }), "normal", DEFAULT_BINDINGS)
		).toEqual({
			actions: [{ type: "FOCUS_PREV" }],
			commands: [],
		});
		expect(
			resolveKeybind(buildEvent({ name: "char", char: "h" }), "normal", DEFAULT_BINDINGS)
		).toEqual({
			actions: [{ type: "SET_FOCUS", focus: "chat-list" }],
			commands: [],
		});
		expect(
			resolveKeybind(buildEvent({ name: "char", char: "l" }), "normal", DEFAULT_BINDINGS)
		).toEqual({
			actions: [{ type: "SET_FOCUS", focus: "messages" }],
			commands: [],
		});
		expect(
			resolveKeybind(
				buildEvent({ name: "char", char: "d", ctrl: true }),
				"normal",
				DEFAULT_BINDINGS
			)
		).toEqual({
			actions: [{ type: "SCROLL_MESSAGES", delta: 10 }],
			commands: [],
		});
		expect(
			resolveKeybind(
				buildEvent({ name: "char", char: "u", ctrl: true }),
				"normal",
				DEFAULT_BINDINGS
			)
		).toEqual({
			actions: [{ type: "SCROLL_MESSAGES", delta: -10 }],
			commands: [],
		});
	});

	test("handles insert mode bindings", () => {
		expect(resolveKeybind(buildEvent({ name: "escape" }), "insert", DEFAULT_BINDINGS)).toEqual({
			actions: [{ type: "SET_MODE", mode: "normal" }],
			commands: [],
		});
		expect(resolveKeybind(buildEvent({ name: "enter" }), "insert", DEFAULT_BINDINGS)).toEqual({
			actions: [],
			commands: [{ type: "SEND_MESSAGE" }],
		});
		expect(
			resolveKeybind(buildEvent({ name: "enter", ctrl: true }), "insert", DEFAULT_BINDINGS)
		).toEqual({
			actions: [{ type: "INSERT_CHAR", char: "\n" }],
			commands: [],
		});
		expect(resolveKeybind(buildEvent({ name: "backspace" }), "insert", DEFAULT_BINDINGS)).toEqual({
			actions: [{ type: "DELETE_CHAR" }],
			commands: [],
		});
		expect(
			resolveKeybind(
				buildEvent({ name: "char", char: "w", ctrl: true }),
				"insert",
				DEFAULT_BINDINGS
			)
		).toEqual({
			actions: [{ type: "DELETE_WORD" }],
			commands: [],
		});
		expect(
			resolveKeybind(
				buildEvent({ name: "char", char: "u", ctrl: true }),
				"insert",
				DEFAULT_BINDINGS
			)
		).toEqual({
			actions: [{ type: "CLEAR_INPUT" }],
			commands: [],
		});
		expect(
			resolveKeybind(buildEvent({ name: "char", char: "A" }), "insert", DEFAULT_BINDINGS)
		).toEqual({
			actions: [{ type: "INSERT_CHAR", char: "A" }],
			commands: [],
		});
	});

	test("resolves mode-specific behavior", () => {
		expect(
			resolveKeybind(buildEvent({ name: "char", char: "i" }), "insert", DEFAULT_BINDINGS)
		).toEqual({
			actions: [{ type: "INSERT_CHAR", char: "i" }],
			commands: [],
		});
		expect(resolveKeybind(buildEvent({ name: "char", char: "u", ctrl: true }), "normal")).toEqual({
			actions: [{ type: "SCROLL_MESSAGES", delta: -10 }],
			commands: [],
		});
		expect(resolveKeybind(buildEvent({ name: "char", char: "u", ctrl: true }), "insert")).toEqual({
			actions: [{ type: "CLEAR_INPUT" }],
			commands: [],
		});
	});

	test("returns empty results for unbound keys", () => {
		expect(
			resolveKeybind(buildEvent({ name: "char", char: "x" }), "normal", DEFAULT_BINDINGS)
		).toEqual({
			actions: [],
			commands: [],
		});
	});
});
