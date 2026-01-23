export type Mode = "normal" | "insert";

export type FocusArea = "chat-list" | "messages" | "input";

export type KeyName =
	| "escape"
	| "enter"
	| "backspace"
	| "tab"
	| "up"
	| "down"
	| "left"
	| "right"
	| "home"
	| "end"
	| "pageup"
	| "pagedown"
	| "delete";

export interface KeyInfo {
	name: KeyName | "char";
	char?: string;
	ctrl: boolean;
	alt: boolean;
	shift: boolean;
}

export interface InputEvent {
	key: KeyInfo;
	raw: string;
}

export interface ChatSummary {
	id: number;
	title: string;
}

export interface MessageSummary {
	id: number;
	role: "user" | "assistant";
	content: string;
}

export interface TuiState {
	mode: Mode;
	focus: FocusArea;
	chats: ChatSummary[];
	selectedChatIndex: number;
	messages: MessageSummary[];
	messageScrollOffset: number;
	inputBuffer: string;
	cursorPosition: number;
	streaming: {
		active: boolean;
		content: string;
		chatId: number | null;
	};
	error: string | null;
	screenSize: {
		rows: number;
		cols: number;
	};
}

export type Action =
	| { type: "SET_MODE"; mode: Mode }
	| { type: "SET_FOCUS"; focus: FocusArea }
	| { type: "FOCUS_NEXT" }
	| { type: "FOCUS_PREV" }
	| { type: "SET_CHATS"; chats: ChatSummary[] }
	| { type: "SELECT_CHAT"; index: number }
	| { type: "MOVE_SELECTION"; delta: number }
	| { type: "SET_MESSAGES"; messages: MessageSummary[] }
	| { type: "ADD_MESSAGE"; message: MessageSummary }
	| { type: "SCROLL_MESSAGES"; delta: number }
	| { type: "INSERT_CHAR"; char: string }
	| { type: "DELETE_CHAR" }
	| { type: "DELETE_WORD" }
	| { type: "CLEAR_INPUT" }
	| { type: "SET_INPUT"; input: string; cursor?: number }
	| { type: "START_STREAMING"; chatId: number | null }
	| { type: "APPEND_STREAM"; content: string }
	| { type: "COMPLETE_STREAM"; message: MessageSummary }
	| { type: "CANCEL_STREAM" }
	| { type: "SET_ERROR"; error: string | null }
	| { type: "RESIZE"; rows: number; cols: number };

export type Command =
	| { type: "QUIT" }
	| { type: "SEND_MESSAGE" }
	| { type: "CREATE_CHAT" }
	| { type: "LOAD_CHAT"; chatId: number };
