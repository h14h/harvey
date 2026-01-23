/**
 * Harvey TUI - Main application component.
 */

import React, { useEffect, useCallback, useState, useRef } from "react";
import { Box, Text, useApp, render } from "ink";
import { KeyHandler } from "../keybinds/handler";
import { DEFAULT_BINDINGS } from "../keybinds/types";
import { StoreProvider, useAppStore, useInputTextActions } from "./store";
import { StatusBar } from "./components/StatusBar";
import { ChatList } from "./components/ChatList";
import { MessageView } from "./components/MessageView";
import { InputArea } from "./components/InputArea";
import { NewChatModal } from "./components/NewChatModal";
import { ToneModal } from "./components/ToneModal";
import { AnchorModal } from "./components/AnchorModal";
import { Toast } from "./components/Toast";
import { useSendMessage, useContextUsage, useToasts } from "./hooks";
import { logError, getUserFriendlyMessage, getRecoverySuggestion } from "../utils/errors";
import { searchChatsWithFzf } from "../utils/fzf";
import type { Chat } from "../types";

/**
 * Inner app component that uses the store.
 */
function AppInner() {
  const { state, dispatch } = useAppStore();
  const { exit } = useApp();
  const inputActions = useInputTextActions();
  const { sendMessage, isSending } = useSendMessage();
  const contextUsage = useContextUsage();
  const { toasts, dismiss } = useToasts();
  const [isLoading, setIsLoading] = useState(false);
  const [globalTone, setGlobalTone] = useState<string | null>(null);
  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  /**
   * Handle key actions dispatched by the KeyHandler.
   */
  const handleAction = useCallback((action: string) => {
    // Don't handle actions when modal is open (modal handles its own input)
    if (state.activeModal) {
      return;
    }

    // Don't allow sending while already streaming
    if (state.streaming.isStreaming && (action === "sendMessage" || action === "enterInsertMode")) {
      return;
    }

    switch (action) {
      case "quit":
        exit();
        break;
      case "newChat":
        dispatch({ type: "openModal", modal: "new-chat" });
        break;
      case "searchChats":
        handleSearchChats();
        break;
      case "editGlobalTone":
        dispatch({ type: "openModal", modal: "edit-tone" });
        break;
      case "editChatAnchor":
        // Only allow if a chat is selected
        if (state.selectedChatId) {
          dispatch({ type: "openModal", modal: "edit-anchor" });
        }
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
        // Send the message when user presses Enter in insert mode
        if (state.inputText.trim() && state.selectedChatId) {
          const selectedChat = state.chats.find((c) => c.id === state.selectedChatId);
          sendMessageRef.current({
            content: state.inputText.trim(),
            chatId: state.selectedChatId,
            contextInput: {
              globalToneSummary: null, // TODO: Get from config
              anchorSummary: selectedChat?.anchorSummary ?? null,
              historySummary: null, // TODO: Get from summaries
              recentMessages: state.messages,
              currentMessage: state.inputText.trim(),
            },
          });
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
  }, [state.focus, state.inputText, state.activeModal, state.streaming.isStreaming, state.selectedChatId, state.chats, state.messages, dispatch, exit, inputActions, handleSearchChats]);

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

  /**
   * Handle creating a new chat.
   * For now, creates a chat with a placeholder title.
   * TODO: Integrate with OpenAI for title generation and summarization.
   */
  const handleCreateChat = useCallback(async (anchorPrompt: string) => {
    setIsLoading(true);
    try {
      // Create a simple chat with the anchor prompt
      // TODO: Call OpenAI to generate title and summary
      const newChat: Chat = {
        id: Date.now(), // Temporary ID
        title: anchorPrompt.slice(0, 30) + (anchorPrompt.length > 30 ? "..." : ""),
        anchorPrompt,
        anchorSummary: null,
        turnCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Add the new chat to the list
      const updatedChats = [...state.chats, newChat];
      dispatch({ type: "setChats", chats: updatedChats });

      // Select the new chat
      dispatch({ type: "selectChat", chatId: newChat.id });
    } catch (error) {
      logError(error, "handleCreateChat");
      const userMessage = getUserFriendlyMessage(error);
      dispatch({ type: "setError", error: userMessage });
    } finally {
      setIsLoading(false);
    }
  }, [state.chats, dispatch]);

  /**
   * Handle saving the global tone.
   * For now, just stores the tone in memory.
   * TODO: Persist to database and generate summary.
   */
  const handleSaveGlobalTone = useCallback(async (tone: string) => {
    setIsLoading(true);
    try {
      // Store the global tone in memory
      setGlobalTone(tone);

      // TODO: Save to database
      // TODO: Generate global_tone_summary using OpenAI

      // Show confirmation - clear errors
      dispatch({ type: "setError", error: null });
    } catch (error) {
      logError(error, "handleSaveGlobalTone");
      const userMessage = getUserFriendlyMessage(error);
      dispatch({ type: "setError", error: userMessage });
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  /**
   * Handle searching chats using fzf.
   * Spawns fzf with the chat list and navigates to selected chat.
   */
  const handleSearchChats = useCallback(async () => {
    if (state.chats.length === 0) {
      dispatch({
        type: "setError",
        error: "No chats to search. Create a chat first with 'n'.",
      });
      return;
    }

    try {
      const result = await searchChatsWithFzf(state.chats);

      if (result.error) {
        dispatch({ type: "setError", error: result.errorMessage ?? "Search failed" });
        return;
      }

      if (result.chat) {
        dispatch({ type: "selectChat", chatId: result.chat.id });
      }
    } catch (error) {
      logError(error, "handleSearchChats");
      const userMessage = getUserFriendlyMessage(error);
      dispatch({ type: "setError", error: userMessage });
    }
  }, [state.chats, dispatch]);

  /**
   * Handle saving a chat's anchor prompt.
   * For now, updates the chat in memory.
   * TODO: Persist to database and regenerate summary.
   */
  const handleSaveChatAnchor = useCallback(async (anchorPrompt: string) => {
    setIsLoading(true);
    try {
      // Update the chat in the list
      const updatedChats = state.chats.map((chat) =>
        chat.id === state.selectedChatId
          ? { ...chat, anchorPrompt, updatedAt: Date.now() }
          : chat
      );
      dispatch({ type: "setChats", chats: updatedChats });

      // TODO: Save to database
      // TODO: Regenerate anchor_summary using OpenAI
      // TODO: Optionally regenerate title

      // Show confirmation - clear errors
      dispatch({ type: "setError", error: null });
    } catch (error) {
      logError(error, "handleSaveChatAnchor");
      const userMessage = getUserFriendlyMessage(error);
      dispatch({ type: "setError", error: userMessage });
    } finally {
      setIsLoading(false);
    }
  }, [state.chats, state.selectedChatId, dispatch]);

  return (
    <Box flexDirection="column" paddingX={1}>
      <StatusBar tokenCount={state.tokenCount} contextUsage={contextUsage ?? undefined} />

      <Box marginTop={1}>
        <ChatList />
        <MessageView />
      </Box>

      <InputArea />

      {/* Enhanced error display with recovery suggestions */}
      {state.error && (
        <Box marginTop={1} borderStyle="single" borderColor="red" paddingX={1}>
          <Box flexDirection="column">
            <Text color="red" bold>
              Error: {state.error}
            </Text>
            {(() => {
              const recovery = getRecoverySuggestion(new Error(state.error));
              return recovery && (
                <Text color="gray" dimColor>
                  Hint: {recovery}
                </Text>
              );
            })()}
          </Box>
        </Box>
      )}

      {/* Toast notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onDismiss={() => dismiss(toast.id)}
        />
      ))}

      <NewChatModal onSubmit={handleCreateChat} />
      <ToneModal currentTone={globalTone} onSave={handleSaveGlobalTone} />
      <AnchorModal onSave={handleSaveChatAnchor} />
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
