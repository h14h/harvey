import type { Message } from "../types";

import type { ChatMessage } from "./openai";

export interface ContextInput {
	globalToneSummary: string | null;
	anchorSummary: string | null;
	historySummary: string | null;
	recentMessages: Message[];
	currentMessage: string;
}

const MAX_RECENT_TURNS = 4;
const RECENT_MESSAGES_LIMIT = MAX_RECENT_TURNS * 2;

function toChatMessage(message: Message): ChatMessage {
	return {
		role: message.role,
		content: message.content,
	};
}

function selectRecentMessages(recentMessages: Message[]): Message[] {
	const conversationMessages = recentMessages.filter(
		(message) => message.role === "user" || message.role === "assistant"
	);

	if (conversationMessages.length <= RECENT_MESSAGES_LIMIT) {
		return conversationMessages;
	}

	return conversationMessages.slice(-RECENT_MESSAGES_LIMIT);
}

export function assembleContext(input: ContextInput): ChatMessage[] {
	const messages: ChatMessage[] = [];

	if (input.globalToneSummary !== null) {
		messages.push({ role: "system", content: input.globalToneSummary });
	}

	if (input.anchorSummary !== null) {
		messages.push({ role: "system", content: input.anchorSummary });
	}

	if (input.historySummary !== null) {
		messages.push({ role: "system", content: input.historySummary });
	}

	const recentMessages = selectRecentMessages(input.recentMessages);
	for (const message of recentMessages) {
		messages.push(toChatMessage(message));
	}

	messages.push({ role: "user", content: input.currentMessage });

	return messages;
}
