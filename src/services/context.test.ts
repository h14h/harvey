/**
 * Tests for context assembly utilities.
 */

import { describe, expect, it } from "bun:test";
import type { Message } from "../../types";
import { assembleContext, type ContextInput } from "./context";

describe("Context Assembly", () => {
	const createMessage = (role: "user" | "assistant", content: string): Message => ({
		id: Math.random(),
		chatId: 1,
		role,
		content,
		turnNumber: 1,
		createdAt: Date.now(),
	});

	describe("assembleContext", () => {
		it("returns empty context for empty input", () => {
			const input: ContextInput = {
				globalToneSummary: null,
				anchorSummary: null,
				historySummary: null,
				recentMessages: [],
				currentMessage: "Hello",
			};

			const context = assembleContext(input);

			expect(context).toHaveLength(1);
			expect(context[0]).toEqual({ role: "user", content: "Hello" });
		});

		it("includes global tone summary when present", () => {
			const input: ContextInput = {
				globalToneSummary: "You are helpful.",
				anchorSummary: null,
				historySummary: null,
				recentMessages: [],
				currentMessage: "Hello",
			};

			const context = assembleContext(input);

			expect(context).toHaveLength(2);
			expect(context[0]).toEqual({ role: "system", content: "You are helpful." });
			expect(context[1]).toEqual({ role: "user", content: "Hello" });
		});

		it("includes anchor summary when present", () => {
			const input: ContextInput = {
				globalToneSummary: null,
				anchorSummary: "You are a Python expert.",
				historySummary: null,
				recentMessages: [],
				currentMessage: "Help with Python",
			};

			const context = assembleContext(input);

			expect(context).toHaveLength(2);
			expect(context[0]).toEqual({ role: "system", content: "You are a Python expert." });
			expect(context[1]).toEqual({ role: "user", content: "Help with Python" });
		});

		it("includes history summary when present", () => {
			const input: ContextInput = {
				globalToneSummary: null,
				anchorSummary: null,
				historySummary: "Previous discussion covered basics.",
				recentMessages: [],
				currentMessage: "Continue",
			};

			const context = assembleContext(input);

			expect(context).toHaveLength(2);
			expect(context[0]).toEqual({
				role: "system",
				content: "Previous discussion covered basics.",
			});
			expect(context[1]).toEqual({ role: "user", content: "Continue" });
		});

		it("includes all summaries when present", () => {
			const input: ContextInput = {
				globalToneSummary: "Be helpful.",
				anchorSummary: "You are a coding assistant.",
				historySummary: "We discussed variables.",
				recentMessages: [],
				currentMessage: "What about functions?",
			};

			const context = assembleContext(input);

			expect(context).toHaveLength(4);
			expect(context[0]).toEqual({ role: "system", content: "Be helpful." });
			expect(context[1]).toEqual({ role: "system", content: "You are a coding assistant." });
			expect(context[2]).toEqual({ role: "system", content: "We discussed variables." });
			expect(context[3]).toEqual({ role: "user", content: "What about functions?" });
		});

		it("includes recent messages", () => {
			const messages = [
				createMessage("user", "Hello"),
				createMessage("assistant", "Hi there!"),
				createMessage("user", "How are you?"),
			];

			const input: ContextInput = {
				globalToneSummary: null,
				anchorSummary: null,
				historySummary: null,
				recentMessages: messages,
				currentMessage: "Goodbye",
			};

			const context = assembleContext(input);

			// Should have recent messages + current message
			expect(context).toHaveLength(4);
			expect(context[0]).toEqual({ role: "user", content: "Hello" });
			expect(context[1]).toEqual({ role: "assistant", content: "Hi there!" });
			expect(context[2]).toEqual({ role: "user", content: "How are you?" });
			expect(context[3]).toEqual({ role: "user", content: "Goodbye" });
		});

		it("filters non-conversation messages", () => {
			const messages = [
				createMessage("user", "User message"),
				{
					id: 1,
					chatId: 1,
					role: "system",
					content: "System instruction",
					turnNumber: 0,
					createdAt: 0,
				},
				createMessage("assistant", "Assistant response"),
			];

			const input: ContextInput = {
				globalToneSummary: null,
				anchorSummary: null,
				historySummary: null,
				recentMessages: messages,
				currentMessage: "Next",
			};

			const context = assembleContext(input);

			// Should filter out system message, only include user/assistant
			expect(context).toHaveLength(3);
			expect(context[0]).toEqual({ role: "user", content: "User message" });
			expect(context[1]).toEqual({ role: "assistant", content: "Assistant response" });
			expect(context[2]).toEqual({ role: "user", content: "Next" });
		});

		it("combines summaries and messages correctly", () => {
			const messages = [
				createMessage("user", "First message"),
				createMessage("assistant", "First response"),
			];

			const input: ContextInput = {
				globalToneSummary: "Be helpful.",
				anchorSummary: "You are a Python expert.",
				historySummary: "We covered basics.",
				recentMessages: messages,
				currentMessage: "Continue",
			};

			const context = assembleContext(input);

			// 3 summaries + 2 messages + current message
			expect(context).toHaveLength(6);
			expect(context[0]).toEqual({ role: "system", content: "Be helpful." });
			expect(context[1]).toEqual({ role: "system", content: "You are a Python expert." });
			expect(context[2]).toEqual({ role: "system", content: "We covered basics." });
			expect(context[3]).toEqual({ role: "user", content: "First message" });
			expect(context[4]).toEqual({ role: "assistant", content: "First response" });
			expect(context[5]).toEqual({ role: "user", content: "Continue" });
		});
	});
});
