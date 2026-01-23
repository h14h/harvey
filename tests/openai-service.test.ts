import { expect, test } from "bun:test";
import OpenAI from "openai";

import {
	createOpenAIClient,
	getChatCompletion,
	OpenAIServiceError,
	streamChatCompletion,
} from "../src/services/openai";

function createFakeStream(chunks: Array<Partial<OpenAI.ChatCompletionChunk>>) {
	return {
		async *[Symbol.asyncIterator]() {
			for (const chunk of chunks) {
				yield chunk as OpenAI.ChatCompletionChunk;
			}
		},
	} as unknown as AsyncIterable<OpenAI.ChatCompletionChunk>;
}

test("createOpenAIClient requires an API key", () => {
	expect(() => createOpenAIClient("")).toThrow(OpenAIServiceError);
});

test("streamChatCompletion yields content chunks", async () => {
	const createCalls: Array<unknown> = [];
	const fakeClient = {
		chat: {
			completions: {
				create: async (args: unknown) => {
					createCalls.push(args);
					return createFakeStream([
						{ choices: [{ index: 0, delta: { content: "Hello" }, finish_reason: null }] },
						{ choices: [{ index: 0, delta: { content: " world" }, finish_reason: "stop" }] },
					]);
				},
			},
		},
	} as unknown as OpenAI;

	const chunks: string[] = [];
	for await (const chunk of streamChatCompletion(fakeClient, [{ role: "user", content: "Hi" }])) {
		chunks.push(chunk);
	}

	expect(chunks.join("")).toBe("Hello world");
	expect(createCalls[0]).toEqual(expect.objectContaining({ stream: true }));
});

test("getChatCompletion returns content and forwards max tokens", async () => {
	const createCalls: Array<unknown> = [];
	const fakeClient = {
		chat: {
			completions: {
				create: async (args: unknown) => {
					createCalls.push(args);
					return {
						choices: [{ message: { content: "summary" } }],
					} as OpenAI.ChatCompletion;
				},
			},
		},
	} as unknown as OpenAI;

	const result = await getChatCompletion(fakeClient, [{ role: "user", content: "Summarize" }], 120);

	expect(result).toBe("summary");
	expect(createCalls[0]).toEqual(expect.objectContaining({ max_tokens: 120 }));
});

test("getChatCompletion retries on rate limit", async () => {
	let attempts = 0;
	const fakeClient = {
		chat: {
			completions: {
				create: async () => {
					attempts += 1;
					if (attempts < 3) {
						throw new OpenAI.RateLimitError(
							429,
							{ error: { message: "rate limit" } } as unknown as Record<string, unknown>,
							"rate limit",
							new Headers()
						);
					}
					return {
						choices: [{ message: { content: "ok" } }],
					} as OpenAI.ChatCompletion;
				},
			},
		},
	} as unknown as OpenAI;

	const result = await getChatCompletion(fakeClient, [{ role: "user", content: "retry please" }]);

	expect(result).toBe("ok");
	expect(attempts).toBe(3);
});
