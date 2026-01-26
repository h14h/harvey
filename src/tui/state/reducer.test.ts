import { describe, expect, test } from "bun:test";
import type { Action, ChatSummary, MessageSummary, TuiState } from "../types.js";
import { INITIAL_STATE, reducer } from "./reducer.js";

function makeState(overrides: Partial<TuiState> = {}): TuiState {
	return { ...INITIAL_STATE, ...overrides };
}

function applyAction(state: TuiState, action: Action): TuiState {
	return reducer(state, action);
}

const sampleChats: ChatSummary[] = [
	{ id: 1, title: "First" },
	{ id: 2, title: "Second" },
	{ id: 3, title: "Third" },
];

const sampleMessages: MessageSummary[] = [
	{ id: 10, role: "user", content: "Hello" },
	{ id: 11, role: "assistant", content: "Hi" },
];

describe("reducer", () => {
	test("sets mode and focus", () => {
		const state = applyAction(INITIAL_STATE, { type: "SET_MODE", mode: "insert" });
		expect(state.mode).toBe("insert");

		const focused = applyAction(state, { type: "SET_FOCUS", focus: "messages" });
		expect(focused.focus).toBe("messages");
	});

	test("cycles focus forward and backward with wrap", () => {
		const nextFromInput = applyAction(makeState({ focus: "input" }), { type: "FOCUS_NEXT" });
		expect(nextFromInput.focus).toBe("chat-list");

		const prevFromChat = applyAction(makeState({ focus: "chat-list" }), { type: "FOCUS_PREV" });
		expect(prevFromChat.focus).toBe("input");
	});

	test("toggles help overlay state", () => {
		const shown = applyAction(makeState({ showHelp: false }), { type: "TOGGLE_HELP" });
		expect(shown.showHelp).toBe(true);

		const hidden = applyAction(shown, { type: "TOGGLE_HELP" });
		expect(hidden.showHelp).toBe(false);
	});

	test("sets chats and clamps selection", () => {
		const state = makeState({ selectedChatIndex: 5 });
		const next = applyAction(state, { type: "SET_CHATS", chats: sampleChats });
		expect(next.selectedChatIndex).toBe(2);
	});

	test("selects chat with clamp and supports -1 for last", () => {
		const state = makeState({ chats: sampleChats, selectedChatIndex: 0 });
		const last = applyAction(state, { type: "SELECT_CHAT", index: -1 });
		expect(last.selectedChatIndex).toBe(2);

		const clamped = applyAction(state, { type: "SELECT_CHAT", index: 10 });
		expect(clamped.selectedChatIndex).toBe(2);
	});

	test("moves selection with bounds checks", () => {
		const base = makeState({ chats: sampleChats, selectedChatIndex: 0 });
		const down = applyAction(base, { type: "MOVE_SELECTION", delta: 1 });
		expect(down.selectedChatIndex).toBe(1);

		const up = applyAction(base, { type: "MOVE_SELECTION", delta: -1 });
		expect(up.selectedChatIndex).toBe(0);

		const end = makeState({ chats: sampleChats, selectedChatIndex: 2 });
		const pastEnd = applyAction(end, { type: "MOVE_SELECTION", delta: 2 });
		expect(pastEnd.selectedChatIndex).toBe(2);
	});

	test("sets messages and appends messages", () => {
		const withMessages = applyAction(makeState({ messageScrollOffset: 2 }), {
			type: "SET_MESSAGES",
			messages: sampleMessages,
		});
		expect(withMessages.messages).toEqual(sampleMessages);
		expect(withMessages.messageScrollOffset).toBe(0);

		const appended = applyAction(withMessages, {
			type: "ADD_MESSAGE",
			message: { id: 12, role: "assistant", content: "More" },
		});
		expect(appended.messages).toHaveLength(3);
	});

	test("scrolls messages with floor at zero", () => {
		const state = makeState({ messageScrollOffset: 3 });
		const down = applyAction(state, { type: "SCROLL_MESSAGES", delta: 5 });
		expect(down.messageScrollOffset).toBe(8);

		const up = applyAction(state, { type: "SCROLL_MESSAGES", delta: -10 });
		expect(up.messageScrollOffset).toBe(0);
	});

	test("handles input insertion and deletion with cursor updates", () => {
		const state = makeState({ inputBuffer: "hi", cursorPosition: 1 });
		const inserted = applyAction(state, { type: "INSERT_CHAR", char: "X" });
		expect(inserted.inputBuffer).toBe("hXi");
		expect(inserted.cursorPosition).toBe(2);

		const deleted = applyAction(inserted, { type: "DELETE_CHAR" });
		expect(deleted.inputBuffer).toBe("hi");
		expect(deleted.cursorPosition).toBe(1);
	});

	test("deletes word before cursor and preserves suffix", () => {
		const state = makeState({
			inputBuffer: "hello   world there",
			cursorPosition: 14,
		});
		const deleted = applyAction(state, { type: "DELETE_WORD" });
		expect(deleted.inputBuffer).toBe("hello there");
		expect(deleted.cursorPosition).toBe(6);
	});

	test("clears input and sets explicit input with cursor clamp", () => {
		const state = makeState({ inputBuffer: "text", cursorPosition: 4 });
		const cleared = applyAction(state, { type: "CLEAR_INPUT" });
		expect(cleared.inputBuffer).toBe("");
		expect(cleared.cursorPosition).toBe(0);

		const setInput = applyAction(state, { type: "SET_INPUT", input: "abc" });
		expect(setInput.cursorPosition).toBe(3);

		const setCursor = applyAction(state, { type: "SET_INPUT", input: "abc", cursor: 10 });
		expect(setCursor.cursorPosition).toBe(3);
	});

	test("starts, appends, completes, and cancels streaming", () => {
		const state = applyAction(INITIAL_STATE, { type: "START_STREAMING", chatId: 2 });
		expect(state.streaming.active).toBe(true);
		expect(state.streaming.chatId).toBe(2);

		const appended = applyAction(state, { type: "APPEND_STREAM", content: "Hi" });
		expect(appended.streaming.content).toBe("Hi");

		const completed = applyAction(appended, {
			type: "COMPLETE_STREAM",
			message: { id: 20, role: "assistant", content: "Done" },
		});
		expect(completed.streaming.active).toBe(false);
		expect(completed.messages).toHaveLength(1);

		const canceled = applyAction(state, { type: "CANCEL_STREAM" });
		expect(canceled.streaming.active).toBe(false);
	});

	test("sets errors and resizes screen", () => {
		const withError = applyAction(INITIAL_STATE, { type: "SET_ERROR", error: "oops" });
		expect(withError.error).toBe("oops");

		const resized = applyAction(INITIAL_STATE, { type: "RESIZE", rows: 40, cols: 120 });
		expect(resized.screenSize).toEqual({ rows: 40, cols: 120 });
	});
});
