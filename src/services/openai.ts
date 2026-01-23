import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import { loadConfig } from "../config/manager";

export type ChatMessage = ChatCompletionMessageParam;

export class OpenAIServiceError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number, cause?: unknown) {
    super(message);
    this.name = "OpenAIServiceError";
    this.statusCode = statusCode;
    if (cause) {
      this.cause = cause;
    }
  }
}

const DEFAULT_MODEL = "gpt-4";
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(error: unknown): boolean {
  if (error instanceof OpenAI.RateLimitError) {
    return true;
  }

  if (error instanceof OpenAI.APIConnectionError) {
    return true;
  }

  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return true;
  }

  if (error instanceof OpenAI.InternalServerError) {
    return true;
  }

  if (error instanceof OpenAI.APIError) {
    const status = error.status ?? 0;
    return status >= 500 || status === 429;
  }

  return false;
}

async function withRetry<T>(
  action: () => Promise<T>,
  context: string,
  maxRetries = MAX_RETRIES
): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= maxRetries) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === maxRetries) {
        throw toServiceError(error, context);
      }
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
      await sleep(delay);
      attempt += 1;
    }
  }

  throw toServiceError(lastError, context);
}

function toServiceError(error: unknown, context: string): OpenAIServiceError {
  if (error instanceof OpenAIServiceError) {
    return error;
  }

  if (error instanceof OpenAI.APIError) {
    return new OpenAIServiceError(
      `${context}: ${error.message}`,
      error.status ?? undefined,
      error
    );
  }

  if (error instanceof Error) {
    return new OpenAIServiceError(`${context}: ${error.message}`, undefined, error);
  }

  return new OpenAIServiceError(`${context}: Unknown error`);
}

export async function createOpenAIClientFromConfig(): Promise<OpenAI> {
  const config = await loadConfig();
  return createOpenAIClient(config.openai_api_key);
}

export function createOpenAIClient(apiKey: string): OpenAI {
  if (!apiKey) {
    throw new OpenAIServiceError("OpenAI API key is missing");
  }

  return new OpenAI({ apiKey });
}

export async function* streamChatCompletion(
  client: OpenAI,
  messages: ChatMessage[]
): AsyncGenerator<string> {
  const stream = await withRetry(
    () =>
      client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages,
        stream: true,
      }),
    "OpenAI streaming request failed"
  );

  try {
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    throw toServiceError(error, "OpenAI streaming response failed");
  }
}

export async function getChatCompletion(
  client: OpenAI,
  messages: ChatMessage[],
  maxTokens?: number
): Promise<string> {
  const completion = await withRetry(
    () =>
      client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages,
        max_tokens: maxTokens,
      }),
    "OpenAI request failed"
  );

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new OpenAIServiceError("OpenAI returned empty response");
  }

  return content;
}
