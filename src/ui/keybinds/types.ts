/**
 * Vim-style keybinding types and interfaces for Harvey TUI.
 */

export type Mode = "normal" | "insert";

export type FocusArea = "chat-list" | "message-view" | "input";

export type KeyAction =
	| "quit"
	| "goUp"
	| "goDown"
	| "goTop"
	| "goBottom"
	| "scrollDown"
	| "scrollUp"
	| "newChat"
	| "deleteChat"
	| "searchChats"
	| "selectChat"
	| "enterInsertMode"
	| "enterInsertModeAppend"
	| "enterNormalMode"
	| "cancel"
	| "sendMessage"
	| "newline"
	| "deleteChar"
	| "deleteWord"
	| "clearLine"
	| "copyMessage"
	| "showHelp"
	| "redraw"
	| "editGlobalTone"
	| "editChatAnchor"
	| "focusLeft"
	| "focusRight"
	| "focusNext"
	| "focusPrev";

export interface KeyBinding {
	/** The key sequence (e.g., "j", "gg", "dd") */
	sequence: string;
	/** The action to trigger */
	action: KeyAction;
	/** Modes where this binding is active */
	modes: Mode[];
}

export interface KeyHandlerConfig {
	/** All key bindings */
	bindings: KeyBinding[];
	/** Handler for when an action is triggered */
	onAction: (action: KeyAction) => void;
	/** Timeout for multi-key sequences in ms */
	sequenceTimeout?: number;
}

export interface KeyHandlerState {
	/** Current mode */
	mode: Mode;
	/** Current focus area */
	focus: FocusArea;
	/** Current key sequence buffer */
	buffer: string[];
	/** Whether we're in a potential multi-key sequence */
	inSequence: boolean;
}

export interface InputEvent {
	/** The raw character input */
	input: string;
	/** The key name (e.g., "escape", "enter", "ctrl+c") */
	key: string;
	/** Whether ctrl was held */
	ctrl: boolean;
	/** Whether shift was held */
	shift: boolean;
	/** Whether alt was held */
	alt: boolean;
}

/**
 * Default key bindings for Harvey TUI.
 */
export const DEFAULT_BINDINGS: KeyBinding[] = [
	// Normal mode bindings
	{ sequence: "q", action: "quit", modes: ["normal"] },
	{ sequence: "?", action: "showHelp", modes: ["normal"] },
	{ sequence: "Ctrl+l", action: "redraw", modes: ["normal"] },
	{ sequence: "j", action: "goDown", modes: ["normal"] },
	{ sequence: "ArrowDown", action: "goDown", modes: ["normal"] },
	{ sequence: "k", action: "goUp", modes: ["normal"] },
	{ sequence: "ArrowUp", action: "goUp", modes: ["normal"] },
	{ sequence: "gg", action: "goTop", modes: ["normal"] },
	{ sequence: "G", action: "goBottom", modes: ["normal"] },
	{ sequence: "Ctrl+d", action: "scrollDown", modes: ["normal"] },
	{ sequence: "Ctrl+u", action: "scrollUp", modes: ["normal"] },
	{ sequence: "Enter", action: "selectChat", modes: ["normal"] },
	{ sequence: "n", action: "newChat", modes: ["normal"] },
	{ sequence: "d", action: "deleteChat", modes: ["normal"] },
	{ sequence: "/", action: "searchChats", modes: ["normal"] },
	{ sequence: "i", action: "enterInsertMode", modes: ["normal"] },
	{ sequence: "a", action: "enterInsertModeAppend", modes: ["normal"] },
	{ sequence: ":", action: "enterInsertMode", modes: ["normal"] }, // TODO: command mode
	{ sequence: "t", action: "editGlobalTone", modes: ["normal"] },
	{ sequence: "h", action: "focusLeft", modes: ["normal"] },
	{ sequence: "l", action: "focusRight", modes: ["normal"] },
	{ sequence: "Tab", action: "focusNext", modes: ["normal"] },
	{ sequence: "Shift+Tab", action: "focusPrev", modes: ["normal"] },
	// Multi-key sequences in normal mode
	{ sequence: "dd", action: "deleteChat", modes: ["normal"] },

	// Insert mode bindings
	{ sequence: "Escape", action: "enterNormalMode", modes: ["insert"] },
	{ sequence: "Ctrl+c", action: "enterNormalMode", modes: ["insert"] },
	{ sequence: "Enter", action: "sendMessage", modes: ["insert"] },
	{ sequence: "Ctrl+Enter", action: "newline", modes: ["insert"] },
	{ sequence: "Backspace", action: "deleteChar", modes: ["insert"] },
	{ sequence: "Ctrl+w", action: "deleteWord", modes: ["insert"] },
	{ sequence: "Ctrl+u", action: "clearLine", modes: ["insert"] },
];
