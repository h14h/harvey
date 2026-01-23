import { expect, test } from "bun:test";
import { encodingForModel } from "js-tiktoken";
import type { ChatMessage } from "../src/services/openai";
import { countTokens, estimateTokens } from "../src/services/tokens";

test("countTokens matches tiktoken for the default model", () => {
	const encoder = encodingForModel("gpt-4");
	const text = "Hello world";

	expect(countTokens(text)).toBe(encoder.encode(text).length);
});

test("estimateTokens adds chat overhead and content tokens", () => {
	const encoder = encodingForModel("gpt-4");
	const messages: ChatMessage[] = [
		{ role: "system", content: "System prompt" },
		{ role: "user", content: "Hello", name: "tester" },
	];

	const expected =
		2 * 3 +
		encoder.encode("system").length +
		encoder.encode("System prompt").length +
		encoder.encode("user").length +
		encoder.encode("Hello").length +
		1 +
		encoder.encode("tester").length;

	expect(estimateTokens(messages)).toBe(expected);
});
