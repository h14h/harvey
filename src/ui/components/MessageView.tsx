/**
 * MessageView - Main area displaying chat messages.
 */

import React from "react";
import { Box, Text } from "ink";
import { useMessages, useFocus, useAppState, useStreaming } from "../store";

export interface MessageViewProps {
  flex?: boolean;
}

/**
 * Message display area component.
 */
export function MessageView({ flex = true }: MessageViewProps) {
  const messages = useMessages();
  const streaming = useAppState().streaming;
  const { streaming: streamingActions } = useStreaming();
  const focus = useFocus();
  const { messageViewOffset } = useAppState();

  const isFocused = focus === "message-view";
  const borderColor = isFocused ? "green" : "gray";

  // Render a single message
  const renderMessage = (message: { id: number; role: string; content: string }) => {
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
  };

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
        {streaming.isStreaming && (
          <Text color="yellow"> (Streaming...)</Text>
        )}
      </Box>

      {messages.length === 0 && !streaming.isStreaming ? (
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          <Text color="gray" dimColor>
            No messages yet. Press {"'"}i{"'"} to start typing.
          </Text>
        </Box>
      ) : (
        <Box flexDirection="column" flexGrow={1}>
          {messages.map((message) => renderMessage(message))}

          {/* Display streaming assistant response */}
          {streaming.isStreaming && streaming.content && (
            <Box flexDirection="column" marginBottom={1}>
              <Text color="green" bold>
                Assistant:
              </Text>
              <Text>{streaming.content}</Text>
              <Text color="yellow" dimColor>
                █
              </Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
