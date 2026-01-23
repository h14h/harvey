/**
 * Harvey TUI - Main application component.
 */

import React, { useEffect, useCallback } from "react";
import { Box, Text, useApp, render } from "ink";
import { KeyHandler } from "../keybinds/handler";
import { DEFAULT_BINDINGS } from "../keybinds/types";
import { StoreProvider, useAppStore, useInputTextActions } from "./store";
import { StatusBar } from "./components/StatusBar";
import { ChatList } from "./components/ChatList";
import { MessageView } from "./components/MessageView";
import { InputArea } from "./components/InputArea";

/**
 * Inner app component that uses the store.
 */
function AppInner() {
  const { state, dispatch } = useAppStore();
  const { exit } = useApp();
  const inputActions = useInputTextActions();

  /**
   * Handle key actions dispatched by the KeyHandler.
   */
  const handleAction = useCallback((action: string) => {
    switch (action) {
      case "quit":
        exit();
        break;
      case "enterInsertMode":
      case "enterInsertModeAppend":
        dispatch({ type: "setMode", mode: "insert" });
        dispatch({ type: "setFocus", focus: "input" });
        break;
      case "enterNormalMode":
        dispatch({ type: "setMode", mode: "normal" });
        break;
      case "focusLeft":
        if (state.focus === "message-view" || state.focus === "input") {
          dispatch({ type: "setFocus", focus: "chat-list" });
        }
        break;
      case "focusRight":
        if (state.focus === "chat-list") {
          dispatch({ type: "setFocus", focus: "message-view" });
        }
        break;
      case "focusNext":
        const focusAreas: Array<"chat-list" | "message-view" | "input"> = [
          "chat-list",
          "message-view",
          "input",
        ];
        const currentIndex = focusAreas.indexOf(state.focus);
        const nextIndex = (currentIndex + 1) % focusAreas.length;
        dispatch({ type: "setFocus", focus: focusAreas[nextIndex] });
        break;
      case "focusPrev":
        const focusAreasPrev: Array<"chat-list" | "message-view" | "input"> =
          [
            "chat-list",
            "message-view",
            "input",
          ];
        const currentIdx = focusAreasPrev.indexOf(state.focus);
        const prevIdx =
          (currentIdx - 1 + focusAreasPrev.length) % focusAreasPrev.length;
        dispatch({ type: "setFocus", focus: focusAreasPrev[prevIdx] });
        break;
      case "sendMessage":
        // For now just clear input - actual sending will be implemented later
        if (state.inputText.trim()) {
          inputActions.clear();
        }
        break;
      case "newline":
        inputActions.append("\n");
        break;
      case "deleteChar":
        inputActions.deleteChar();
        break;
      case "deleteWord":
        inputActions.deleteWord();
        break;
      case "clearLine":
        inputActions.clear();
        break;
    }
  }, [state.focus, state.inputText, dispatch, exit, inputActions]);

  /**
   * Set up the KeyHandler with our bindings.
   */
  useEffect(() => {
    const handler = new KeyHandler({
      bindings: DEFAULT_BINDINGS,
      onAction: handleAction,
      sequenceTimeout: 500,
    });

    // Store handler on window for stdin hook
    (globalThis as unknown as Record<string, unknown>).harveyKeyHandler =
      handler;

    return () => {
      delete (globalThis as unknown as Record<string, unknown>).harveyKeyHandler;
    };
  }, [handleAction]);

  return (
    <Box flexDirection="column" paddingX={1}>
      <StatusBar tokenCount={state.tokenCount} />

      <Box marginTop={1}>
        <ChatList />
        <MessageView />
      </Box>

      <InputArea />

      {state.error && (
        <Box marginTop={1}>
          <Text color="red">Error: {state.error}</Text>
        </Box>
      )}
    </Box>
  );
}

/**
 * Props for the main Harvey app.
 */
export interface HarveyAppProps {
  /** Initial chats to display */
  initialChats?: unknown[];
  /** Initial messages for the selected chat */
  initialMessages?: unknown[];
  /** Initial token count */
  initialTokenCount?: number;
}

/**
 * Main Harvey TUI application component.
 *
 * Wraps the app with state management and renders the UI.
 */
export function HarveyApp({
  initialChats = [],
  initialMessages = [],
  initialTokenCount = 0,
}: HarveyAppProps) {
  return (
    <StoreProvider
      initialState={{
        chats: initialChats as unknown[],
        messages: initialMessages as unknown[],
        tokenCount: initialTokenCount,
      }}
    >
      <AppInner />
    </StoreProvider>
  );
}

/**
 * Render the Harvey app to stdout.
 */
export function renderHarvey(props?: HarveyAppProps): void {
  render(<HarveyApp {...props} />);
}

/**
 * Hook for stdin to process keypresses through the KeyHandler.
 * This should be called from a stdin listener.
 */
export function handleStdinKey(input: string, key: Record<string, unknown>): void {
  const handler = (globalThis as unknown as Record<string, unknown>)
    .harveyKeyHandler as KeyHandler | undefined;

  if (handler) {
    handler.handleInput({
      input,
      key: (key.escape ? "escape" : input || "") as string,
      ctrl: Boolean(key.ctrl),
      shift: Boolean(key.shift),
      alt: Boolean(key.alt),
    });
  }
}
