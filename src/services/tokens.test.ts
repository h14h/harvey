/**
 * Tests for token counting utilities.
 */

import { describe, expect, it } from "bun:test";
import { countTokens, estimateTokens } from "./tokens";

describe("Token Counting", () => {
	describe("countTokens", () => {
		it("counts tokens for empty string", () => {
			expect(countTokens("")).toBe(0);
		});

		it("counts tokens for simple text", () => {
			// "Hello world" is approximately 2-3 tokens
			const count = countTokens("Hello world");
			expect(count).toBeGreaterThan(0);
			expect(count).toBeLessThan(10);
		});

		it("counts tokens for longer text", () => {
			const text = "This is a longer piece of text that should have more tokens.";
			const count = countTokens(text);
			expect(count).toBeGreaterThan(5);
		});

		it("counts tokens for code-like text", () => {
			const code = `function hello() {
        return "world";
      }`;
			const count = countTokens(code);
			expect(count).toBeGreaterThan(0);
		});
	});

	describe("estimateTokens", () => {
		it("estimates tokens for empty message array", () => {
			const count = estimateTokens([]);
			expect(count).toBe(0);
		});

		it("estimates tokens for single message", () => {
			const messages = [{ role: "user", content: "Hello" }];
			const count = estimateTokens(messages);
			// Should include message overhead (3 tokens) plus role and content
			expect(count).toBeGreaterThan(3);
		});

		it("estimates tokens for multiple messages", () => {
			const messages = [
				{ role: "system", content: "You are helpful." },
				{ role: "user", content: "Hello!" },
				{ role: "assistant", content: "Hi there!" },
			];
			const count1 = estimateTokens([{ role: "user", content: "Hello!" }]);
			const count2 = estimateTokens(messages);
			expect(count2).toBeGreaterThan(count1);
		});

		it("includes message overhead for each message", () => {
			const singleMessage = [{ role: "user", content: "test" }];
			const multipleMessages = [
				{ role: "user", content: "test" },
				{ role: "assistant", content: "response" },
			];

			const count1 = estimateTokens(singleMessage);
			const count2 = estimateTokens(multipleMessages);

			// Each message adds TOKENS_PER_MESSAGE (3) overhead
			expect(count2).toBeGreaterThan(count1);
		});

		it("handles messages with name field", () => {
			const messages = [{ role: "user", name: "Alice", content: "Hello" }];
			const count = estimateTokens(messages);

			const messagesWithout = [{ role: "user", content: "Hello" }];
			const countWithout = estimateTokens(messagesWithout);

			expect(count).toBeGreaterThan(countWithout);
		});

		it("handles empty content", () => {
			const messages = [{ role: "user", content: "" }];
			const count = estimateTokens(messages);
			// Should have at least the message overhead and role tokens
			expect(count).toBeGreaterThan(0);
		});
	});
});
