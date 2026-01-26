import type { Action, FocusArea, TuiState } from "../types.js";

const FOCUS_ORDER: FocusArea[] = ["chat-list", "messages", "input"];

export const INITIAL_STATE: TuiState = {
	mode: "normal",
	focus: "chat-list",
	showHelp: false,
	chats: [],
	selectedChatIndex: 0,
	messages: [],
	messageScrollOffset: 0,
	inputBuffer: "",
	cursorPosition: 0,
	streaming: {
		active: false,
		content: "",
		chatId: null,
	},
	error: null,
	screenSize: {
		rows: 24,
		cols: 80,
	},
};

function clampIndex(index: number, length: number): number {
	if (length <= 0) {
		return 0;
	}

	return Math.max(0, Math.min(index, length - 1));
}

function resolveFocusIndex(focus: FocusArea): number {
	const index = FOCUS_ORDER.indexOf(focus);
	return index === -1 ? 0 : index;
}

export function reducer(state: TuiState, action: Action): TuiState {
	switch (action.type) {
		case "SET_MODE":
			return { ...state, mode: action.mode };
		case "SET_FOCUS":
			return { ...state, focus: action.focus };
		case "FOCUS_NEXT": {
			const index = resolveFocusIndex(state.focus);
			const nextFocus = FOCUS_ORDER[(index + 1) % FOCUS_ORDER.length] ?? state.focus;
			return { ...state, focus: nextFocus };
		}
		case "FOCUS_PREV": {
			const index = resolveFocusIndex(state.focus);
			const prevIndex = (index - 1 + FOCUS_ORDER.length) % FOCUS_ORDER.length;
			const prevFocus = FOCUS_ORDER[prevIndex] ?? state.focus;
			return { ...state, focus: prevFocus };
		}
		case "TOGGLE_HELP":
			return { ...state, showHelp: !state.showHelp };
		case "SET_CHATS": {
			const nextIndex = clampIndex(state.selectedChatIndex, action.chats.length);
			return { ...state, chats: action.chats, selectedChatIndex: nextIndex };
		}
		case "SELECT_CHAT": {
			const desiredIndex = action.index === -1 ? state.chats.length - 1 : action.index;
			return {
				...state,
				selectedChatIndex: clampIndex(desiredIndex, state.chats.length),
			};
		}
		case "MOVE_SELECTION": {
			const nextIndex = clampIndex(state.selectedChatIndex + action.delta, state.chats.length);
			return { ...state, selectedChatIndex: nextIndex };
		}
		case "SET_MESSAGES":
			return { ...state, messages: action.messages, messageScrollOffset: 0 };
		case "ADD_MESSAGE":
			return { ...state, messages: [...state.messages, action.message] };
		case "SCROLL_MESSAGES":
			return {
				...state,
				messageScrollOffset: Math.max(0, state.messageScrollOffset + action.delta),
			};
		case "INSERT_CHAR": {
			const before = state.inputBuffer.slice(0, state.cursorPosition);
			const after = state.inputBuffer.slice(state.cursorPosition);
			const nextBuffer = `${before}${action.char}${after}`;
			return {
				...state,
				inputBuffer: nextBuffer,
				cursorPosition: state.cursorPosition + action.char.length,
			};
		}
		case "DELETE_CHAR": {
			if (state.cursorPosition === 0) {
				return state;
			}
			const before = state.inputBuffer.slice(0, state.cursorPosition - 1);
			const after = state.inputBuffer.slice(state.cursorPosition);
			return {
				...state,
				inputBuffer: `${before}${after}`,
				cursorPosition: state.cursorPosition - 1,
			};
		}
		case "DELETE_WORD": {
			const before = state.inputBuffer.slice(0, state.cursorPosition);
			const after = state.inputBuffer.slice(state.cursorPosition);
			const trimmedBefore = before.replace(/\S+\s*$/, "");
			const nextBefore = trimmedBefore.trimEnd();
			const needsSpace =
				nextBefore.length > 0 && after.length > 0 && /\s$/.test(before) && !/^\s/.test(after);
			const spacer = needsSpace ? " " : "";
			return {
				...state,
				inputBuffer: `${nextBefore}${spacer}${after}`,
				cursorPosition: nextBefore.length + spacer.length,
			};
		}
		case "CLEAR_INPUT":
			return { ...state, inputBuffer: "", cursorPosition: 0 };
		case "SET_INPUT": {
			const maxCursor = action.input.length;
			const desiredCursor = action.cursor ?? maxCursor;
			const nextCursor = Math.max(0, Math.min(desiredCursor, maxCursor));
			return { ...state, inputBuffer: action.input, cursorPosition: nextCursor };
		}
		case "START_STREAMING":
			return {
				...state,
				streaming: { active: true, content: "", chatId: action.chatId },
			};
		case "APPEND_STREAM":
			return {
				...state,
				streaming: {
					active: true,
					content: `${state.streaming.content}${action.content}`,
					chatId: state.streaming.chatId,
				},
			};
		case "COMPLETE_STREAM":
			return {
				...state,
				messages: [...state.messages, action.message],
				streaming: { active: false, content: "", chatId: null },
			};
		case "CANCEL_STREAM":
			return { ...state, streaming: { active: false, content: "", chatId: null } };
		case "SET_ERROR":
			return { ...state, error: action.error };
		case "RESIZE":
			return { ...state, screenSize: { rows: action.rows, cols: action.cols } };
		default:
			return state;
	}
}
