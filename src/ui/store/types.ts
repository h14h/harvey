/**
 * Application state management types for Harvey TUI.
 */

import type { Chat, Message } from "../../types";

export type Mode = "normal" | "insert";

export type FocusArea = "chat-list" | "message-view" | "input";

/**
 * Application state shared across all components.
 */
export interface AppState {
  /** Current vim mode */
  mode: Mode;
  /** Currently focused area */
  focus: FocusArea;
  /** List of all chats */
  chats: Chat[];
  /** Currently selected chat ID */
  selectedChatId: number | null;
  /** Messages for the current chat */
  messages: Message[];
  /** Current input text */
  inputText: string;
  /** Chat list scroll offset */
  chatListOffset: number;
  /** Message view scroll offset */
  messageViewOffset: number;
  /** Token count for current context */
  tokenCount: number;
  /** Error message to display */
  error: string | null;
}

/**
 * Actions that can modify the application state.
 */
export type AppAction =
  | { type: "setMode"; mode: Mode }
  | { type: "setFocus"; focus: FocusArea }
  | { type: "setChats"; chats: Chat[] }
  | { type: "selectChat"; chatId: number | null }
  | { type: "setMessages"; messages: Message[] }
  | { type: "setInputText"; text: string }
  | { type: "appendInput"; text: string }
  | { type: "deleteInputChar" }
  | { type: "deleteInputWord" }
  | { type: "clearInput" }
  | { type: "scrollChatList"; offset: number }
  | { type: "scrollMessageView"; offset: number }
  | { type: "setTokenCount"; count: number }
  | { type: "setError"; error: string | null };
