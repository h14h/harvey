/**
 * MessageView - Main area displaying chat messages.
 */

import { Box, Text } from "ink";
import { useMessages, useFocus, useAppState } from "../store";

export interface MessageViewProps {
  flex?: boolean;
}

/**
 * Message display area component.
 */
export function MessageView({ flex = true }: MessageViewProps) {
  const messages = useMessages();
  const focus = useFocus();
  const { messageViewOffset } = useAppState();

  const isFocused = focus === "message-view";
  const borderColor = isFocused ? "green" : "gray";

  return (
    <Box
      flexGrow={flex ? 1 : undefined}
      flexDirection="column"
      borderStyle="round"
      borderColor={borderColor}
      paddingX={1}
      marginLeft={1}
    >
      <Box marginBottom={1}>
        <Text color="cyan" bold>
          Messages
        </Text>
        <Text color="gray"> ({messages.length})</Text>
      </Box>

      {messages.length === 0 ? (
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          <Text color="gray" dimColor>
            No messages yet. Press {"'"}i{"'"} to start typing.
          </Text>
        </Box>
      ) : (
        <Box flexDirection="column" flexGrow={1}>
          {messages.map((message) => {
            const isUser = message.role === "user";
            const roleLabel = isUser ? "User" : "Assistant";
            const roleColor = isUser ? "blue" : "green";

            return (
              <Box key={message.id} flexDirection="column" marginBottom={1}>
                <Text color={roleColor} bold>
                  {roleLabel}:
                </Text>
                <Text>{message.content}</Text>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
