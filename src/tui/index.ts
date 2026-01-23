import type { ChatRepository } from "../db/repositories/chats.js";
import type { GlobalConfigRepository } from "../db/repositories/config.js";
import type { MessageRepository } from "../db/repositories/messages.js";
import type { SummaryRepository } from "../db/repositories/summaries.js";
import { assembleContext } from "../services/context.js";
import { createOpenAIClientFromConfig, streamChatCompletion } from "../services/openai.js";
import type { Message } from "../types";
import { getUserFriendlyMessage, logError } from "../utils/errors.js";
import { type CommandHandlerResult, runTui } from "./loop.js";
import type { Action, Command, MessageSummary, TuiState } from "./types.js";

const DEFAULT_CHAT_TITLE = "New Chat";
const DEFAULT_ANCHOR_PROMPT = "You are a helpful assistant.";

export interface TuiConfig {
	chatRepo: ChatRepository;
	messageRepo: MessageRepository;
	summaryRepo?: SummaryRepository;
	globalConfigRepo?: GlobalConfigRepository;
}

function isConversationMessage(
	message: Message
): message is Message & { role: "user" | "assistant" } {
	return message.role === "user" || message.role === "assistant";
}

function toMessageSummary(message: Message & { role: "user" | "assistant" }): MessageSummary {
	return {
		id: message.id,
		role: message.role,
		content: message.content,
	};
}

function resolveSelectedChatId(state: TuiState): number | null {
	const chat = state.chats[state.selectedChatIndex];
	return chat ? chat.id : null;
}

async function* handleSendMessage(config: TuiConfig, state: TuiState): AsyncIterable<Action> {
	const trimmed = state.inputBuffer.trim();
	if (!trimmed) {
		return;
	}

	const chatId = resolveSelectedChatId(state);
	if (chatId === null) {
		yield { type: "SET_ERROR", error: "No chat selected" };
		return;
	}

	const chat = config.chatRepo.getById(chatId);
	if (!chat) {
		yield { type: "SET_ERROR", error: "Chat not found" };
		return;
	}

	const recentMessages = config.messageRepo.getLastNTurns(chatId, 4);
	const turnNumber = config.messageRepo.getCurrentTurn(chatId) + 1;

	const userMessage = config.messageRepo.create({
		chatId,
		role: "user",
		content: trimmed,
		turnNumber,
	});

	yield { type: "SET_ERROR", error: null };
	yield { type: "ADD_MESSAGE", message: { id: userMessage.id, role: "user", content: trimmed } };
	yield { type: "CLEAR_INPUT" };
	yield { type: "START_STREAMING", chatId };

	try {
		const globalToneSummary = config.globalConfigRepo?.get().globalToneSummary ?? null;
		const historySummary = config.summaryRepo?.getLatest(chatId, "history")?.content ?? null;
		const context = assembleContext({
			globalToneSummary,
			anchorSummary: chat.anchorSummary,
			historySummary,
			recentMessages,
			currentMessage: trimmed,
		});

		const client = await createOpenAIClientFromConfig();
		let assistantContent = "";

		for await (const chunk of streamChatCompletion(client, context)) {
			assistantContent += chunk;
			yield { type: "APPEND_STREAM", content: chunk };
		}

		const assistantMessage = config.messageRepo.create({
			chatId,
			role: "assistant",
			content: assistantContent,
			turnNumber,
		});

		yield {
			type: "COMPLETE_STREAM",
			message: { id: assistantMessage.id, role: "assistant", content: assistantContent },
		};
		config.chatRepo.incrementTurnCount(chatId);
	} catch (error) {
		logError(error, "tui.sendMessage");
		yield { type: "CANCEL_STREAM" };
		yield { type: "SET_ERROR", error: getUserFriendlyMessage(error) };
	}
}

async function handleLoadChat(config: TuiConfig, chatId: number): Promise<Action[]> {
	const messages = config.messageRepo.getAllForChat(chatId);
	const summaries = messages.filter(isConversationMessage).map(toMessageSummary);

	return [
		{ type: "CANCEL_STREAM" },
		{ type: "SET_MESSAGES", messages: summaries },
		{ type: "SET_ERROR", error: null },
	];
}

async function handleCreateChat(config: TuiConfig): Promise<Action[]> {
	const chat = config.chatRepo.create({
		title: DEFAULT_CHAT_TITLE,
		anchorPrompt: DEFAULT_ANCHOR_PROMPT,
	});
	const chats = config.chatRepo.getAll().map((item) => ({ id: item.id, title: item.title }));
	const newIndex = Math.max(
		0,
		chats.findIndex((item) => item.id === chat.id)
	);

	return [
		{ type: "SET_CHATS", chats },
		{ type: "SELECT_CHAT", index: newIndex },
		{ type: "SET_MESSAGES", messages: [] },
		{ type: "SET_ERROR", error: null },
	];
}

async function handleCommand(config: TuiConfig, command: Command, state: TuiState) {
	switch (command.type) {
		case "SEND_MESSAGE":
			return handleSendMessage(config, state);
		case "CREATE_CHAT":
			return handleCreateChat(config);
		case "LOAD_CHAT":
			return handleLoadChat(config, command.chatId);
		default:
			return [];
	}
}

export async function startTui(config: TuiConfig): Promise<void> {
	const chats = config.chatRepo.getAll().map((chat) => ({ id: chat.id, title: chat.title }));
	const selectedChatId = chats[0]?.id ?? null;
	const initialMessages =
		selectedChatId === null ? [] : config.messageRepo.getAllForChat(selectedChatId);

	const initialState: Partial<TuiState> = {
		chats,
		selectedChatIndex: 0,
		messages: initialMessages.filter(isConversationMessage).map(toMessageSummary),
	};

	await runTui({
		stdin: process.stdin,
		stdout: process.stdout,
		initialState,
		onCommand: async (command, state) =>
			handleCommand(config, command, state) as unknown as CommandHandlerResult,
	});
}
