import type OpenAI from "openai";

import type { Message } from "../types";

import type { ChatMessage } from "./openai";
import { getChatCompletion } from "./openai";

const GLOBAL_TONE_TARGET_TOKENS = 100;
const ANCHOR_TARGET_TOKENS = 200;
const HISTORY_TARGET_TOKENS = 400;

function buildSummaryPrompt(
  description: string,
  targetTokens: number,
  content: string
): ChatMessage[] {
  return [
    {
      role: "system",
      content: `Summarize the ${description} in roughly ${targetTokens} tokens. Preserve key facts, preferences, and constraints. Output only the summary text.`,
    },
    {
      role: "user",
      content,
    },
  ];
}

function formatHistoryMessages(messages: Message[]): string {
  const conversationMessages = messages.filter(
    (message) => message.role === "user" || message.role === "assistant"
  );

  if (conversationMessages.length === 0) {
    return "No new messages.";
  }

  return conversationMessages
    .map((message) => {
      const label = message.role === "user" ? "User" : "Assistant";
      return `${label}: ${message.content}`;
    })
    .join("\n");
}

export async function summarizeGlobalTone(
  client: OpenAI,
  globalTone: string
): Promise<string> {
  const messages = buildSummaryPrompt(
    "global tone instructions",
    GLOBAL_TONE_TARGET_TOKENS,
    globalTone
  );

  return getChatCompletion(client, messages, GLOBAL_TONE_TARGET_TOKENS);
}

export async function summarizeAnchor(
  client: OpenAI,
  anchorPrompt: string
): Promise<string> {
  const messages = buildSummaryPrompt(
    "chat anchor prompt",
    ANCHOR_TARGET_TOKENS,
    anchorPrompt
  );

  return getChatCompletion(client, messages, ANCHOR_TARGET_TOKENS);
}

export async function summarizeHistory(
  client: OpenAI,
  messages: Message[],
  existingSummary: string | null
): Promise<string> {
  if (messages.length === 0 && existingSummary) {
    return existingSummary;
  }

  const historyContent = existingSummary
    ? `Previous summary:\n${existingSummary}\n\nNew messages:\n${formatHistoryMessages(messages)}`
    : `Messages:\n${formatHistoryMessages(messages)}`;

  const prompt = buildSummaryPrompt(
    "conversation history",
    HISTORY_TARGET_TOKENS,
    historyContent
  );

  return getChatCompletion(client, prompt, HISTORY_TARGET_TOKENS);
}

export function shouldRegenerate(turnCount: number, frequency: number): boolean {
  if (!Number.isInteger(turnCount) || !Number.isInteger(frequency)) {
    return false;
  }

  if (frequency <= 0 || turnCount <= 0) {
    return false;
  }

  return turnCount % frequency === 0;
}
