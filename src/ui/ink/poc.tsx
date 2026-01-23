import React from "react";
import { Box, Text, render, useInput } from "ink";

type AppProps = {
  chatTitle?: string;
  chats?: string[];
  messages?: string[];
  status?: string;
};

export function App({
  chatTitle = "Moonshot",
  chats = ["Chat 1", "Chat 2", "Chat 3"],
  messages = ["User: Hello", "Assistant: Hi there!"],
  status = "[tokens]",
}: AppProps) {
  useInput((input, key) => {
    if (input === "q" || key.escape) {
      process.exit(0);
    }
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box justifyContent="space-between">
        <Text>Harvey - {chatTitle}</Text>
        <Text color="gray">{status}</Text>
      </Box>
      <Box marginTop={1}>
        <Box flexDirection="column" width={24} borderStyle="round" paddingX={1}>
          <Text color="cyan">Chat List</Text>
          {chats.map((chat, index) => (
            <Text key={chat} color={index === 0 ? "green" : undefined}>
              {index === 0 ? "> " : "  "}
              {chat}
            </Text>
          ))}
        </Box>
        <Box
          flexGrow={1}
          borderStyle="round"
          marginLeft={1}
          paddingX={1}
          flexDirection="column"
        >
          <Text color="cyan">Message View</Text>
          {messages.map((message) => (
            <Text key={message}>{message}</Text>
          ))}
        </Box>
      </Box>
      <Box marginTop={1} borderStyle="round" paddingX={1}>
        <Text color="yellow">&gt; Type a message...</Text>
      </Box>
      <Box marginTop={1}>
        <Text color="gray">Press q or Esc to exit</Text>
      </Box>
    </Box>
  );
}

export function renderPoc() {
  render(<App />);
}

if (import.meta.main) {
  renderPoc();
}
