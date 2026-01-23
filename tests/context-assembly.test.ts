import { expect, test } from "bun:test";

import { assembleContext } from "../src/services/context";
import type { Message } from "../src/types";

function createMessage(
  id: number,
  role: Message["role"],
  content: string,
  turnNumber: number
): Message {
  return {
    id,
    chatId: 1,
    role,
    content,
    turnNumber,
    createdAt: 0,
  };
}

test("assembleContext orders summaries, recent messages, and current message", () => {
  const recentMessages: Message[] = [
    createMessage(1, "user", "u1", 1),
    createMessage(2, "assistant", "a1", 1),
    createMessage(3, "user", "u2", 2),
    createMessage(4, "assistant", "a2", 2),
    createMessage(5, "user", "u3", 3),
    createMessage(6, "assistant", "a3", 3),
    createMessage(7, "user", "u4", 4),
    createMessage(8, "assistant", "a4", 4),
    createMessage(9, "user", "u5", 5),
    createMessage(10, "assistant", "a5", 5),
  ];

  const result = assembleContext({
    globalToneSummary: "global",
    anchorSummary: "anchor",
    historySummary: "history",
    recentMessages,
    currentMessage: "current",
  });

  expect(result).toEqual([
    { role: "system", content: "global" },
    { role: "system", content: "anchor" },
    { role: "system", content: "history" },
    { role: "user", content: "u2" },
    { role: "assistant", content: "a2" },
    { role: "user", content: "u3" },
    { role: "assistant", content: "a3" },
    { role: "user", content: "u4" },
    { role: "assistant", content: "a4" },
    { role: "user", content: "u5" },
    { role: "assistant", content: "a5" },
    { role: "user", content: "current" },
  ]);
});

test("assembleContext skips null summaries and ignores system messages", () => {
  const recentMessages: Message[] = [
    createMessage(1, "system", "system", 1),
    createMessage(2, "user", "u1", 1),
    createMessage(3, "assistant", "a1", 1),
  ];

  const result = assembleContext({
    globalToneSummary: null,
    anchorSummary: null,
    historySummary: "history",
    recentMessages,
    currentMessage: "current",
  });

  expect(result).toEqual([
    { role: "system", content: "history" },
    { role: "user", content: "u1" },
    { role: "assistant", content: "a1" },
    { role: "user", content: "current" },
  ]);
});
