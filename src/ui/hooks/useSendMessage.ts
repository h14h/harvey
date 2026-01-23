/**
 * useSendMessage - Hook for sending messages and streaming responses.
 */

import { useCallback, useRef } from "react";
import { useAppStore, useInputTextActions, useStreaming } from "../store";
import { streamChatCompletion, createOpenAIClientFromConfig } from "../../services/openai";
import { assembleContext, type ContextInput } from "../../services/context";
import type { Message } from "../../types";

interface SendMessageOptions {
  /** The user message to send */
  content: string;
  /** The current chat ID */
  chatId: number | null;
  /** Context for the OpenAI request */
  contextInput: ContextInput;
}

interface UseSendMessageReturn {
  /** Send a message and stream the response */
  sendMessage: (options: SendMessageOptions) => Promise<void>;
  /** Whether currently sending/streaming */
  isSending: boolean;
}

/**
 * Hook for sending messages with streaming responses from OpenAI.
 *
 * This handles the full flow:
 * 1. Add user message to the display
 * 2. Stream assistant response
 * 3. Update display with chunks
 * 4. Save completed messages to database (TODO)
 */
export function useSendMessage(): UseSendMessageReturn {
  const { state, dispatch } = useAppStore();
  const { clear } = useInputTextActions();
  const { startStreaming, appendStreaming, completeStreaming, cancelStreaming } = useStreaming();
  const isSendingRef = useRef(false);

  const sendMessage = useCallback(async (options: SendMessageOptions) => {
    const { content, chatId, contextInput } = options;

    if (!content.trim() || isSendingRef.current) {
      return;
    }

    // Check if we have a chat selected
    if (!chatId) {
      dispatch({ type: "setError", error: "No chat selected" });
      return;
    }

    isSendingRef.current = true;

    try {
      // Create user message
      const userMessage: Message = {
        id: Date.now(),
        chatId,
        role: "user",
        content: content.trim(),
        turnNumber: state.messages.length + 1,
        createdAt: Date.now(),
      };

      // Add user message to the display
      dispatch({ type: "setMessages", messages: [...state.messages, userMessage] });

      // Clear input
      clear();

      // Start streaming
      startStreaming();

      // Get OpenAI client and assemble context
      const client = await createOpenAIClientFromConfig();
      const messages = assembleContext(contextInput);

      // Stream the response
      let streamedContent = "";
      for await (const chunk of streamChatCompletion(client, messages)) {
        streamedContent += chunk;
        appendStreaming(chunk);
      }

      // Create assistant message
      const assistantMessage: Message = {
        id: Date.now() + 1,
        chatId,
        role: "assistant",
        content: streamedContent,
        turnNumber: userMessage.turnNumber,
        createdAt: Date.now(),
      };

      // Complete streaming - adds message to the list
      completeStreaming(assistantMessage);

      // TODO: Save messages to database
      // TODO: Increment turn count
      // TODO: Check if summarization is needed

    } catch (error) {
      cancelStreaming();
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      dispatch({ type: "setError", error: errorMessage });
    } finally {
      isSendingRef.current = false;
    }
  }, [state.messages, dispatch, clear, startStreaming, appendStreaming, completeStreaming, cancelStreaming]);

  return {
    sendMessage,
    isSending: isSendingRef.current || state.streaming.isStreaming,
  };
}
