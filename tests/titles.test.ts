import { expect, test } from "bun:test";
import type OpenAI from "openai";
import type { ChatMessage } from "../src/services/openai";
import { generateInitialTitle, regenerateTitle } from "../src/services/titles";
import type { Message } from "../src/types";

function createFakeClient(createCalls: Array<unknown>, response: string) {
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

test("generateInitialTitle requests a concise title and trims quotes", async () => {
	const createCalls: Array<unknown> = [];
	const client = createFakeClient(createCalls, '"Travel planning" ');

	const result = await generateInitialTitle(client, "Plan a week in Japan.");

	expect(result).toBe("Travel planning");
	const call = createCalls[0] as { messages: ChatMessage[]; max_tokens?: number };
	expect(call.max_tokens).toBe(24);
	expect(call.messages[0]?.content).toContain("3-6 words");
	expect(call.messages[1]?.content).toContain("Anchor prompt:");
	expect(call.messages[1]?.content).toContain("Plan a week in Japan.");
});

test("regenerateTitle includes anchor, history summary, and recent messages", async () => {
	const createCalls: Array<unknown> = [];
	const client = createFakeClient(createCalls, "Japan itinerary tweaks");

	const messages = [
		createMessage(1, "system", "ignore this"),
		createMessage(2, "user", "We should add Kyoto."),
		createMessage(3, "assistant", "Noted."),
	];

	const result = await regenerateTitle(
		client,
		"Plan a week in Japan.",
		"Planning food and temples.",
		messages
	);

	expect(result).toBe("Japan itinerary tweaks");
	const call = createCalls[0] as { messages: ChatMessage[]; max_tokens?: number };
	expect(call.max_tokens).toBe(24);
	const content = call.messages[1]?.content ?? "";
	expect(content).toContain("Anchor prompt:");
	expect(content).toContain("Plan a week in Japan.");
	expect(content).toContain("History summary:");
	expect(content).toContain("Planning food and temples.");
	expect(content).toContain("User: We should add Kyoto.");
	expect(content).toContain("Assistant: Noted.");
	expect(content).not.toContain("ignore this");
});
