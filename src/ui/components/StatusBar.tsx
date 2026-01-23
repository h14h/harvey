/**
 * StatusBar - Top status bar showing chat title, mode, and token info.
 */

import { Box, Text } from "ink";
import { useMode, useSelectedChat } from "../store";

export interface StatusBarProps {
  tokenCount?: number;
}

/**
 * Status bar component displaying the current state at the top of the app.
 */
export function StatusBar({ tokenCount = 0 }: StatusBarProps) {
  const mode = useMode();
  const selectedChat = useSelectedChat();
  const modeIndicator = mode === "normal" ? "[NORMAL]" : "[INSERT]";
  const chatTitle = selectedChat?.title ?? "Harvey";

  return (
    <Box justifyContent="space-between" width="100%">
      <Box>
        <Text bold color="cyan">
          Harvey
        </Text>
        <Text> - </Text>
        <Text bold>{chatTitle}</Text>
      </Box>
      <Box gap={2}>
        <Text color={mode === "normal" ? "green" : "yellow"} bold>
          {modeIndicator}
        </Text>
        <Text color="gray">[{tokenCount} tokens]</Text>
      </Box>
    </Box>
  );
}
