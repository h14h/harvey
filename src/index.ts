/**
 * Harvey - CLI application for long-running AI conversations.
 */

import { openDatabase } from "./db/connection.js";
import { createChatRepository } from "./db/repositories/chats.js";
import { createGlobalConfigRepository } from "./db/repositories/config.js";
import { createMessageRepository } from "./db/repositories/messages.js";
import { createSummaryRepository } from "./db/repositories/summaries.js";
import { startTui } from "./tui/index.js";
import { getUserFriendlyMessage, logError } from "./utils/errors.js";

export async function main(): Promise<void> {
	const db = openDatabase();
	const chatRepo = createChatRepository(db);
	const messageRepo = createMessageRepository(db);
	const summaryRepo = createSummaryRepository(db);
	const globalConfigRepo = createGlobalConfigRepository(db);

	await startTui({
		chatRepo,
		messageRepo,
		summaryRepo,
		globalConfigRepo,
	});
}

if (import.meta.main) {
	main().catch((error) => {
		logError(error, "tui.main");
		console.error(getUserFriendlyMessage(error));
		process.exitCode = 1;
	});
}
