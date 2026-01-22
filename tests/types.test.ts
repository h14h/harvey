import { expectTypeOf, test } from "bun:test";

import type {
  AppConfig,
  Chat,
  GlobalConfig,
  Message,
  Summary,
} from "../src/types";

test("Chat type matches schema shape", () => {
  expectTypeOf<Chat>().toEqualTypeOf<{
    id: number;
    title: string;
    anchorPrompt: string;
    anchorSummary: string | null;
    turnCount: number;
    createdAt: number;
    updatedAt: number;
  }>();
});

test("Message type matches schema shape", () => {
  expectTypeOf<Message>().toEqualTypeOf<{
    id: number;
    chatId: number;
    role: "user" | "assistant" | "system";
    content: string;
    turnNumber: number;
    createdAt: number;
  }>();
});

test("Summary type matches schema shape", () => {
  expectTypeOf<Summary>().toEqualTypeOf<{
    id: number;
    chatId: number;
    type: "history";
    content: string;
    generatedAtTurn: number;
    createdAt: number;
  }>();
});

test("GlobalConfig type matches schema shape", () => {
  expectTypeOf<GlobalConfig>().toEqualTypeOf<{
    id: 1;
    globalTone: string | null;
    globalToneSummary: string | null;
    updatedAt: number;
  }>();
});

test("AppConfig type matches config schema shape", () => {
  expectTypeOf<AppConfig>().toEqualTypeOf<{
    openai_api_key: string;
    turn_frequency: number;
  }>();
});
