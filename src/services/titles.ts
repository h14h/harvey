import type OpenAI from "openai";

import type { Message } from "../types";

import type { ChatMessage } from "./openai";
import { getChatCompletion } from "./openai";

const TITLE_TARGET_TOKENS = 24;

function normalizeTitle(title: string): string {
	const trimmed = title.trim();
	const firstLine = trimmed.split(/\r?\n/)[0] ?? "";
	if (
		(firstLine.startsWith('"') && firstLine.endsWith('"')) ||
		(firstLine.startsWith("'") && firstLine.endsWith("'"))
	) {
		return firstLine.slice(1, -1).trim();
	}
	return firstLine.trim();
}

function formatRecentMessages(messages: Message[]): string {
	const conversationMessages = messages.filter(
		(message) => message.role === "user" || message.role === "assistant"
	);

	if (conversationMessages.length === 0) {
		return "No recent messages.";
	}

	return conversationMessages
		.map((message) => {
			const label = message.role === "user" ? "User" : "Assistant";
			return `${label}: ${message.content}`;
		})
		.join("\n");
}

function buildTitlePrompt(content: string): ChatMessage[] {
	return [
		{
			role: "system",
			content:
				'Create a concise, descriptive title (3-6 words) for the chat. Avoid generic titles like "Chat" or "Conversation". Output only the title text.',
		},
		{
			role: "user",
			content,
		},
	];
}

export async function generateInitialTitle(client: OpenAI, anchorPrompt: string): Promise<string> {
	const prompt = buildTitlePrompt(`Anchor prompt:\n${anchorPrompt}`);
	const title = await getChatCompletion(client, prompt, TITLE_TARGET_TOKENS);
	return normalizeTitle(title);
}

export async function regenerateTitle(
	client: OpenAI,
	anchorPrompt: string,
	historySummary: string | null,
	recentMessages: Message[]
): Promise<string> {
	const historySection = historySummary ? `History summary:\n${historySummary}\n\n` : "";
	const recentSection = formatRecentMessages(recentMessages);
	const prompt = buildTitlePrompt(
		`Anchor prompt:\n${anchorPrompt}\n\n${historySection}Recent messages:\n${recentSection}`
	);
	const title = await getChatCompletion(client, prompt, TITLE_TARGET_TOKENS);
	return normalizeTitle(title);
}
