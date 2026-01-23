/**
 * ChatList - Sidebar displaying all chats.
 */

import { Box, Text } from "ink";
import { useChats, useSelectedChat, useFocus, useAppState } from "../store";

export interface ChatListProps {
  width?: number;
}

const CHAT_ITEM_HEIGHT = 1;

/**
 * Chat list sidebar component.
 */
export function ChatList({ width = 25 }: ChatListProps) {
  const chats = useChats();
  const selectedChat = useSelectedChat();
  const focus = useFocus();
  const { chatListOffset } = useAppState();

  const isFocused = focus === "chat-list";
  const borderColor = isFocused ? "green" : "gray";

  // Calculate visible range based on offset
  // Reserve 2 lines for header/border, 1 for each chat
  const maxVisibleChats = process.stdout.rows ? process.stdout.rows - 4 : 20;
  const visibleChats = chats.slice(chatListOffset, chatListOffset + maxVisibleChats);

  return (
    <Box
      width={width}
      flexDirection="column"
      borderStyle="round"
      borderColor={borderColor}
      paddingX={1}
    >
      <Box marginBottom={1}>
        <Text color="cyan" bold>
          Chats
        </Text>
        <Text color="gray"> ({chats.length})</Text>
      </Box>

      {chats.length === 0 ? (
        <Text color="gray" dimColor>
          No chats yet. Press {"'"}n{"'"} to create one.
        </Text>
      ) : (
        visibleChats.map((chat, index) => {
          const actualIndex = chatListOffset + index;
          const isSelected = selectedChat?.id === chat.id;
          const cursor = isSelected ? "> " : "  ";

          return (
            <Box key={chat.id}>
              <Text
                color={isSelected ? "green" : isFocused ? "white" : "gray"}
                bold={isSelected}
              >
                {cursor}
                {chat.title}
              </Text>
            </Box>
          );
        })
      )}

      {chats.length > maxVisibleChats && chatListOffset > 0 && (
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            ▲ More above
          </Text>
        </Box>
      )}

      {chats.length > maxVisibleChats &&
        chatListOffset + maxVisibleChats < chats.length && (
        <Box>
          <Text color="gray" dimColor>
            ▼ More below
          </Text>
        </Box>
      )}
    </Box>
  );
}
