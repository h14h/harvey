import { expect, test } from "bun:test";

import { openDatabase } from "../src/db/connection";
import { createChatRepository } from "../src/db/repositories/chats";
import { createSummaryRepository } from "../src/db/repositories/summaries";

function setup() {
	const db = openDatabase(":memory:");
	const chatRepo = createChatRepository(db);
	const summaryRepo = createSummaryRepository(db);
	return { db, chatRepo, summaryRepo };
}

test("create and fetch summaries", () => {
	const { db, chatRepo, summaryRepo } = setup();
	const chat = chatRepo.create({
		title: "Summary chat",
		anchorPrompt: "Anchor",
	});

	const created = summaryRepo.create({
		chatId: chat.id,
		type: "history",
		content: "Summary one",
		generatedAtTurn: 2,
	});

	expect(created.id).toBeGreaterThan(0);
	expect(created.chatId).toBe(chat.id);
	expect(created.type).toBe("history");
	expect(created.content).toBe("Summary one");
	expect(created.generatedAtTurn).toBe(2);
	expect(created.createdAt).toBeGreaterThan(0);

	const latest = summaryRepo.getLatest(chat.id, "history");
	expect(latest).toEqual(created);

	const all = summaryRepo.getAllForChat(chat.id);
	expect(all).toHaveLength(1);
	expect(all[0]).toEqual(created);

	db.close();
});

test("getLatest returns the newest summary by turn", () => {
	const { db, chatRepo, summaryRepo } = setup();
	const chat = chatRepo.create({
		title: "Summary history",
		anchorPrompt: "Anchor",
	});

	summaryRepo.create({
		chatId: chat.id,
		type: "history",
		content: "Turn 1",
		generatedAtTurn: 1,
	});
	summaryRepo.create({
		chatId: chat.id,
		type: "history",
		content: "Turn 3",
		generatedAtTurn: 3,
	});
	summaryRepo.create({
		chatId: chat.id,
		type: "history",
		content: "Turn 2",
		generatedAtTurn: 2,
	});

	const latest = summaryRepo.getLatest(chat.id, "history");
	expect(latest?.generatedAtTurn).toBe(3);
	expect(latest?.content).toBe("Turn 3");

	const all = summaryRepo.getAllForChat(chat.id);
	expect(all.map((summary) => summary.generatedAtTurn)).toEqual([1, 2, 3]);

	db.close();
});
