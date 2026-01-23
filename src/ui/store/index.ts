/**
 * Application state store using React hooks.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { AppState, AppAction, Mode, FocusArea } from "./types";
import type { Chat, Message } from "../../types";

interface StoreContextValue {
  state: AppState;
  dispatch: (action: AppAction) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const initialState: AppState = {
  mode: "normal",
  focus: "chat-list",
  chats: [],
  selectedChatId: null,
  messages: [],
  inputText: "",
  chatListOffset: 0,
  messageViewOffset: 0,
  tokenCount: 0,
  error: null,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "setMode":
      return { ...state, mode: action.mode };
    case "setFocus":
      return { ...state, focus: action.focus };
    case "setChats":
      return { ...state, chats: action.chats };
    case "selectChat":
      return {
        ...state,
        selectedChatId: action.chatId,
        messages: [],
        messageViewOffset: 0,
      };
    case "setMessages":
      return { ...state, messages: action.messages };
    case "setInputText":
      return { ...state, inputText: action.text };
    case "appendInput":
      return { ...state, inputText: state.inputText + action.text };
    case "deleteInputChar":
      return {
        ...state,
        inputText: state.inputText.slice(0, -1),
      };
    case "deleteInputWord":
      return {
        ...state,
        inputText: state.inputText.replace(/\S+\s*$/, "").trimEnd(),
      };
    case "clearInput":
      return { ...state, inputText: "" };
    case "scrollChatList":
      return {
        ...state,
        chatListOffset: Math.max(0, state.chatListOffset + action.offset),
      };
    case "scrollMessageView":
      return {
        ...state,
        messageViewOffset: Math.max(0, state.messageViewOffset + action.offset),
      };
    case "setTokenCount":
      return { ...state, tokenCount: action.count };
    case "setError":
      return { ...state, error: action.error };
    default:
      return state;
  }
}

export interface StoreProviderProps {
  children: ReactNode;
  initialState?: Partial<AppState>;
}

/**
 * Provider component that wraps the application with state management.
 */
export function StoreProvider({ children, initialState: initial = {} }: StoreProviderProps) {
  const [state, setState] = useState<AppState>({ ...initialState, ...initial });

  const dispatch = useCallback((action: AppAction) => {
    setState((prev) => reducer(prev, action));
  }, []);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

/**
 * Hook to access the application state.
 */
export function useAppState(): AppState {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useAppState must be used within StoreProvider");
  }
  return context.state;
}

/**
 * Hook to access the dispatch function.
 */
export function useAppDispatch(): (action: AppAction) => void {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useAppDispatch must be used within StoreProvider");
  }
  return context.dispatch;
}

/**
 * Hook to access both state and dispatch.
 */
export function useAppStore(): StoreContextValue {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useAppStore must be used within StoreProvider");
  }
  return context;
}

/**
 * Convenience hooks for specific state values.
 */
export function useMode(): Mode {
  return useAppState().mode;
}

export function useFocus(): FocusArea {
  return useAppState().focus;
}

export function useChats(): Chat[] {
  return useAppState().chats;
}

export function useSelectedChat(): Chat | null {
  const { chats, selectedChatId } = useAppState();
  return chats.find((c) => c.id === selectedChatId) ?? null;
}

export function useMessages(): Message[] {
  return useAppState().messages;
}

export function useInputText(): string {
  return useAppState().inputText;
}

export function useInputTextActions(): {
  setText: (text: string) => void;
  append: (text: string) => void;
  deleteChar: () => void;
  deleteWord: () => void;
  clear: () => void;
} {
  const dispatch = useAppDispatch();

  return {
    setText: (text: string) => dispatch({ type: "setInputText", text }),
    append: (text: string) => dispatch({ type: "appendInput", text }),
    deleteChar: () => dispatch({ type: "deleteInputChar" }),
    deleteWord: () => dispatch({ type: "deleteInputWord" }),
    clear: () => dispatch({ type: "clearInput" }),
  };
}
