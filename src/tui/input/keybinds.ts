import type { Action, Command, InputEvent, KeyInfo, Mode } from "../types.js";

export interface KeybindResult {
	actions: Action[];
	commands: Command[];
}

export interface KeyBinding {
	matches: (event: InputEvent, mode: Mode) => boolean;
	result: (event: InputEvent, mode: Mode) => KeybindResult;
}

const EMPTY_RESULT: KeybindResult = { actions: [], commands: [] };

function matchModifiers(
	key: KeyInfo,
	modifiers: Partial<Pick<KeyInfo, "ctrl" | "alt" | "shift">>
): boolean {
	if (modifiers.ctrl !== undefined && key.ctrl !== modifiers.ctrl) {
		return false;
	}
	if (modifiers.alt !== undefined && key.alt !== modifiers.alt) {
		return false;
	}
	if (modifiers.shift !== undefined && key.shift !== modifiers.shift) {
		return false;
	}
	return true;
}

function isChar(
	event: InputEvent,
	char: string,
	modifiers: Partial<Pick<KeyInfo, "ctrl" | "alt" | "shift">> = {}
): boolean {
	if (event.key.name !== "char") {
		return false;
	}
	if (event.key.char !== char) {
		return false;
	}
	return matchModifiers(event.key, modifiers);
}

function isKey(
	event: InputEvent,
	name: InputEvent["key"]["name"],
	modifiers: Partial<Pick<KeyInfo, "ctrl" | "alt" | "shift">> = {}
): boolean {
	if (event.key.name !== name) {
		return false;
	}
	return matchModifiers(event.key, modifiers);
}

function withMode(mode: Mode, predicate: (event: InputEvent) => boolean) {
	return (event: InputEvent, currentMode: Mode) => currentMode === mode && predicate(event);
}

function actionBinding(
	match: (event: InputEvent, mode: Mode) => boolean,
	actions: Action[]
): KeyBinding {
	return {
		matches: match,
		result: () => ({ actions, commands: [] }),
	};
}

function commandBinding(
	match: (event: InputEvent, mode: Mode) => boolean,
	commands: Command[]
): KeyBinding {
	return {
		matches: match,
		result: () => ({ actions: [], commands }),
	};
}

function printableInsert(event: InputEvent): boolean {
	return (
		event.key.name === "char" &&
		(event.key.char ?? "").length > 0 &&
		!event.key.ctrl &&
		!event.key.alt
	);
}

export function resolveKeybind(
	event: InputEvent,
	mode: Mode,
	bindings: KeyBinding[] = DEFAULT_BINDINGS
): KeybindResult {
	for (const binding of bindings) {
		if (binding.matches(event, mode)) {
			return binding.result(event, mode);
		}
	}
	return EMPTY_RESULT;
}

export const DEFAULT_BINDINGS: KeyBinding[] = [
	commandBinding(
		withMode("normal", (event) => isChar(event, "q")),
		[{ type: "QUIT" }]
	),
	commandBinding(
		withMode("normal", (event) => isChar(event, "c", { ctrl: true })),
		[{ type: "QUIT" }]
	),
	actionBinding(
		withMode("normal", (event) => isChar(event, "i")),
		[
			{ type: "SET_MODE", mode: "insert" },
			{ type: "SET_FOCUS", focus: "input" },
		]
	),
	actionBinding(
		withMode("normal", (event) => isChar(event, "a")),
		[
			{ type: "SET_MODE", mode: "insert" },
			{ type: "SET_FOCUS", focus: "input" },
		]
	),
	actionBinding(
		withMode("normal", (event) => isChar(event, "j") || isKey(event, "down")),
		[{ type: "MOVE_SELECTION", delta: 1 }]
	),
	actionBinding(
		withMode("normal", (event) => isChar(event, "k") || isKey(event, "up")),
		[{ type: "MOVE_SELECTION", delta: -1 }]
	),
	actionBinding(
		withMode("normal", (event) => isChar(event, "G")),
		[{ type: "SELECT_CHAT", index: -1 }]
	),
	actionBinding(
		withMode("normal", (event) => isKey(event, "tab", { shift: false })),
		[{ type: "FOCUS_NEXT" }]
	),
	actionBinding(
		withMode("normal", (event) => isKey(event, "tab", { shift: true })),
		[{ type: "FOCUS_PREV" }]
	),
	actionBinding(
		withMode("normal", (event) => isChar(event, "h")),
		[{ type: "SET_FOCUS", focus: "chat-list" }]
	),
	actionBinding(
		withMode("normal", (event) => isChar(event, "l")),
		[{ type: "SET_FOCUS", focus: "messages" }]
	),
	actionBinding(
		withMode("normal", (event) => isChar(event, "d", { ctrl: true })),
		[{ type: "SCROLL_MESSAGES", delta: 10 }]
	),
	actionBinding(
		withMode("normal", (event) => isChar(event, "u", { ctrl: true })),
		[{ type: "SCROLL_MESSAGES", delta: -10 }]
	),
	actionBinding(
		withMode("insert", (event) => isKey(event, "escape")),
		[{ type: "SET_MODE", mode: "normal" }]
	),
	commandBinding(
		withMode("insert", (event) => isKey(event, "enter", { ctrl: false })),
		[{ type: "SEND_MESSAGE" }]
	),
	actionBinding(
		withMode("insert", (event) => isKey(event, "enter", { ctrl: true })),
		[{ type: "INSERT_CHAR", char: "\n" }]
	),
	actionBinding(
		withMode("insert", (event) => isKey(event, "backspace")),
		[{ type: "DELETE_CHAR" }]
	),
	actionBinding(
		withMode("insert", (event) => isChar(event, "w", { ctrl: true })),
		[{ type: "DELETE_WORD" }]
	),
	actionBinding(
		withMode("insert", (event) => isChar(event, "u", { ctrl: true })),
		[{ type: "CLEAR_INPUT" }]
	),
	{
		matches: withMode("insert", printableInsert),
		result: (event) => ({
			actions: [
				{
					type: "INSERT_CHAR",
					char: event.key.name === "char" ? (event.key.char ?? "") : "",
				},
			],
			commands: [],
		}),
	},
];
