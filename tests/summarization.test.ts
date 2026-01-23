import { expect, test } from "bun:test";
import type OpenAI from "openai";
import type { ChatMessage } from "../src/services/openai";
import {
	shouldRegenerate,
	summarizeAnchor,
	summarizeGlobalTone,
	summarizeHistory,
} from "../src/services/summarization";
import type { Message } from "../src/types";

function createFakeClient(createCalls: Array<unknown>, response = "summary") {
	return {
		chat: {
			completions: {
				create: async (args: unknown) => {
					createCalls.push(args);
					return {
						choices: [{ message: { content: response } }],
					} as OpenAI.ChatCompletion;
				},
			},
		},
	} as OpenAI;
}

function createMessage(id: number, role: Message["role"], content: string): Message {
	return {
		id,
		chatId: 1,
		role,
		content,
		turnNumber: 1,
		createdAt: 0,
	};
}

test("summarizeGlobalTone requests a concise summary", async () => {
	const createCalls: Array<unknown> = [];
	const client = createFakeClient(createCalls, "tone summary");

	const result = await summarizeGlobalTone(client, "Be concise and helpful.");

	expect(result).toBe("tone summary");
	const call = createCalls[0] as { messages: ChatMessage[]; max_tokens?: number };
	expect(call.max_tokens).toBe(100);
	expect(call.messages[0]?.content).toContain("global tone");
	expect(call.messages[1]?.content).toContain("Be concise and helpful.");
});

test("summarizeAnchor requests a concise anchor summary", async () => {
	const createCalls: Array<unknown> = [];
	const client = createFakeClient(createCalls, "anchor summary");

	const result = await summarizeAnchor(client, "You are a travel planner.");

	expect(result).toBe("anchor summary");
	const call = createCalls[0] as { messages: ChatMessage[]; max_tokens?: number };
	expect(call.max_tokens).toBe(200);
	expect(call.messages[0]?.content).toContain("anchor");
	expect(call.messages[1]?.content).toContain("travel planner");
});

test("summarizeHistory includes prior summary and omits system messages", async () => {
	const createCalls: Array<unknown> = [];
	const client = createFakeClient(createCalls, "history summary");

	const messages = [
		createMessage(1, "system", "ignore this"),
		createMessage(2, "user", "Hello there"),
		createMessage(3, "assistant", "Hi!"),
	];

	const result = await summarizeHistory(client, messages, "Earlier summary");

	expect(result).toBe("history summary");
	const call = createCalls[0] as { messages: ChatMessage[]; max_tokens?: number };
	expect(call.max_tokens).toBe(400);
	const content = call.messages[1]?.content ?? "";
	expect(content).toContain("Previous summary:");
	expect(content).toContain("Earlier summary");
	expect(content).toContain("User: Hello there");
	expect(content).toContain("Assistant: Hi!");
	expect(content).not.toContain("ignore this");
});

test("shouldRegenerate checks turn frequency boundaries", () => {
	expect(shouldRegenerate(0, 6)).toBe(false);
	expect(shouldRegenerate(5, 6)).toBe(false);
	expect(shouldRegenerate(6, 6)).toBe(true);
	expect(shouldRegenerate(12, 6)).toBe(true);
	expect(shouldRegenerate(6, 0)).toBe(false);
});
