import type { Database } from "bun:sqlite";

import type { Chat } from "../../types";

export interface ChatRepository {
	create(data: { title: string; anchorPrompt: string }): Chat;
	getById(id: number): Chat | null;
	getAll(): Chat[];
	updateTitle(id: number, title: string): void;
	updateAnchorSummary(id: number, summary: string): void;
	incrementTurnCount(id: number): void;
	delete(id: number): void;
}

type ChatRow = {
	id: number;
	title: string;
	anchor_prompt: string;
	anchor_summary: string | null;
	turn_count: number;
	created_at: number;
	updated_at: number;
};

function toChat(row: ChatRow): Chat {
	return {
		id: row.id,
		title: row.title,
		anchorPrompt: row.anchor_prompt,
		anchorSummary: row.anchor_summary,
		turnCount: row.turn_count,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

function assertChanges(changes: number, id: number): void {
	if (changes === 0) {
		throw new Error(`Chat not found: ${id}`);
	}
}

export function createChatRepository(db: Database): ChatRepository {
	const insertChat = db.prepare(
		`INSERT INTO chats (title, anchor_prompt, created_at, updated_at)
     VALUES (?, ?, ?, ?)`
	);
	const getByIdQuery = db.prepare(
		`SELECT id, title, anchor_prompt, anchor_summary, turn_count, created_at, updated_at
     FROM chats WHERE id = ?`
	);
	const getAllQuery = db.prepare(
		`SELECT id, title, anchor_prompt, anchor_summary, turn_count, created_at, updated_at
     FROM chats ORDER BY updated_at DESC, id DESC`
	);
	const updateTitleQuery = db.prepare(`UPDATE chats SET title = ?, updated_at = ? WHERE id = ?`);
	const updateAnchorSummaryQuery = db.prepare(
		`UPDATE chats SET anchor_summary = ?, updated_at = ? WHERE id = ?`
	);
	const incrementTurnCountQuery = db.prepare(
		`UPDATE chats SET turn_count = turn_count + 1, updated_at = ? WHERE id = ?`
	);
	const deleteQuery = db.prepare(`DELETE FROM chats WHERE id = ?`);

	return {
		create(data) {
			const now = Date.now();
			const result = insertChat.run(data.title, data.anchorPrompt, now, now);
			const id = Number(result.lastInsertRowid);
			const row = getByIdQuery.get(id) as ChatRow | null;

			if (!row) {
				throw new Error("Chat creation failed");
			}

			return toChat(row);
		},
		getById(id) {
			const row = getByIdQuery.get(id) as ChatRow | null;
			return row ? toChat(row) : null;
		},
		getAll() {
			const rows = getAllQuery.all() as ChatRow[];
			return rows.map((row) => toChat(row));
		},
		updateTitle(id, title) {
			const now = Date.now();
			const result = updateTitleQuery.run(title, now, id);
			assertChanges(result.changes, id);
		},
		updateAnchorSummary(id, summary) {
			const now = Date.now();
			const result = updateAnchorSummaryQuery.run(summary, now, id);
			assertChanges(result.changes, id);
		},
		incrementTurnCount(id) {
			const now = Date.now();
			const result = incrementTurnCountQuery.run(now, id);
			assertChanges(result.changes, id);
		},
		delete(id) {
			const result = deleteQuery.run(id);
			assertChanges(result.changes, id);
		},
	};
}
