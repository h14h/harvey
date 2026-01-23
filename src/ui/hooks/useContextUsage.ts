/**
 * useContextUsage - Hook for calculating context token usage.
 */

import { useMemo } from "react";
import { useAppStore } from "../store";
import { countTokens } from "../../services/tokens";
import type { ContextUsage } from "../components/StatusBar";

const SUMMARY_TARGET_TOKENS = {
  globalTone: 100,
  anchor: 200,
  history: 400,
};

/**
 * Hook to calculate and return context token usage.
 *
 * Returns token counts for each summary type along with their limits,
 * allowing the StatusBar to display context usage indicators.
 */
export function useContextUsage(): ContextUsage | null {
  const { state } = useAppStore();

  return useMemo(() => {
    const selectedChat = state.chats.find((c) => c.id === state.selectedChatId);

    if (!selectedChat) {
      return {
        toneTokens: 0,
        toneLimit: SUMMARY_TARGET_TOKENS.globalTone,
        anchorTokens: 0,
        anchorLimit: SUMMARY_TARGET_TOKENS.anchor,
        historyTokens: 0,
        historyLimit: SUMMARY_TARGET_TOKENS.history,
      };
    }

    // Count tokens for anchor summary (or estimate from anchor prompt)
    const anchorText = selectedChat.anchorSummary ?? selectedChat.anchorPrompt ?? "";
    const anchorTokens = countTokens(anchorText);

    // History tokens - for now just estimate from messages
    // TODO: Use actual history summary when implemented
    const historyText = state.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");
    const historyTokens = countTokens(historyText);

    // Global tone tokens - for now use placeholder
    // TODO: Get from config when global tone is implemented
    const toneTokens = 0;

    return {
      toneTokens,
      toneLimit: SUMMARY_TARGET_TOKENS.globalTone,
      anchorTokens,
      anchorLimit: SUMMARY_TARGET_TOKENS.anchor,
      historyTokens,
      historyLimit: SUMMARY_TARGET_TOKENS.history,
    };
  }, [state.chats, state.selectedChatId, state.messages]);
}
