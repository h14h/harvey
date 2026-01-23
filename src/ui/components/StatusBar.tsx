/**
 * StatusBar - Top status bar showing chat title, mode, and token info.
 */

import { Box, Text } from "ink";
import { useMode, useSelectedChat, useAppState } from "../store";

export interface ContextUsage {
  toneTokens: number;
  toneLimit: number;
  anchorTokens: number;
  anchorLimit: number;
  historyTokens: number;
  historyLimit: number;
}

export interface StatusBarProps {
  tokenCount?: number;
  contextUsage?: ContextUsage;
}

/**
 * Get a color based on token usage percentage.
 */
function getUsageColor(current: number, limit: number): string {
  if (limit === 0) return "gray";
  const ratio = current / limit;
  if (ratio >= 1) return "red";
  if (ratio >= 0.8) return "yellow";
  return "green";
}

/**
 * Format a token usage display.
 */
function formatTokenUsage(current: number, limit: number, label: string): string {
  if (limit === 0) return `${label}:N/A`;
  return `${label}:${current}/${limit}`;
}

/**
 * Status bar component displaying the current state at the top of the app.
 */
export function StatusBar({ tokenCount = 0, contextUsage }: StatusBarProps) {
  const mode = useMode();
  const selectedChat = useSelectedChat();
  const { streaming } = useAppState();

  const modeIndicator = mode === "normal" ? "[NORMAL]" : "[INSERT]";
  const chatTitle = selectedChat?.title ?? "Harvey";

  // Turn counter
  const currentTurn = selectedChat?.turnCount ?? 0;
  const turnThreshold = 6; // TODO: Make configurable
  const turnDisplay = `Turn ${currentTurn}/${turnThreshold}`;
  const turnColor = currentTurn >= turnThreshold ? "yellow" : "gray";

  return (
    <Box justifyContent="space-between" width="100%">
      <Box gap={2}>
        <Box>
          <Text bold color="cyan">
            Harvey
          </Text>
          <Text> - </Text>
          <Text bold>{chatTitle}</Text>
        </Box>

        {/* Streaming indicator */}
        {streaming.isStreaming && (
          <Text color="yellow" bold>
            (Streaming...)
          </Text>
        )}
      </Box>

      <Box gap={2}>
        <Text color={mode === "normal" ? "green" : "yellow"} bold>
          {modeIndicator}
        </Text>

        {/* Context usage indicators */}
        {contextUsage && (
          <>
            <Text color={getUsageColor(contextUsage.toneTokens, contextUsage.toneLimit)}>
              T:{contextUsage.toneTokens}/{contextUsage.toneLimit}
            </Text>
            <Text color={getUsageColor(contextUsage.anchorTokens, contextUsage.anchorLimit)}>
              A:{contextUsage.anchorTokens}/{contextUsage.anchorLimit}
            </Text>
            <Text color={getUsageColor(contextUsage.historyTokens, contextUsage.historyLimit)}>
              H:{contextUsage.historyTokens}/{contextUsage.historyLimit}
            </Text>
          </>
        )}

        {/* Turn counter */}
        <Text color={turnColor}>
          {turnDisplay}
        </Text>

        {/* Total token count */}
        <Text color="gray">[{tokenCount} tokens]</Text>
      </Box>
    </Box>
  );
}
