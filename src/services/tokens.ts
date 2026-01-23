import { encodingForModel, getEncoding, type Tiktoken } from "js-tiktoken";

import type { ChatMessage } from "./openai";

const MODEL_FOR_TOKEN_COUNT = "gpt-4";
const FALLBACK_ENCODING = "cl100k_base";

// ChatML overhead for gpt-4/gpt-3.5 style messages.
const TOKENS_PER_MESSAGE = 3;
const TOKENS_PER_NAME = 1;

let encoder: Tiktoken | null = null;

function getEncoder(): Tiktoken {
  if (encoder) {
    return encoder;
  }

  try {
    encoder = encodingForModel(MODEL_FOR_TOKEN_COUNT);
  } catch {
    encoder = getEncoding(FALLBACK_ENCODING);
  }

  return encoder;
}

function encodeLength(tokenizer: Tiktoken, text: string): number {
  if (!text) {
    return 0;
  }

  return tokenizer.encode(text).length;
}

function countContentTokens(
  tokenizer: Tiktoken,
  content: ChatMessage["content"]
): number {
  if (!content) {
    return 0;
  }

  if (typeof content === "string") {
    return encodeLength(tokenizer, content);
  }

  if (Array.isArray(content)) {
    let total = 0;
    for (const part of content) {
      if (typeof part === "string") {
        total += encodeLength(tokenizer, part);
      } else if (
        part &&
        typeof part === "object" &&
        "text" in part &&
        typeof part.text === "string"
      ) {
        total += encodeLength(tokenizer, part.text);
      }
    }
    return total;
  }

  return 0;
}

export function countTokens(text: string): number {
  const tokenizer = getEncoder();
  return encodeLength(tokenizer, text);
}

export function estimateTokens(messages: ChatMessage[]): number {
  const tokenizer = getEncoder();
  let total = 0;

  for (const message of messages) {
    total += TOKENS_PER_MESSAGE;
    total += encodeLength(tokenizer, message.role);
    total += countContentTokens(tokenizer, message.content);

    if ("name" in message && typeof message.name === "string") {
      total += TOKENS_PER_NAME;
      total += encodeLength(tokenizer, message.name);
    }
  }

  return total;
}
