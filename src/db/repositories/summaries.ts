import type { Database } from "bun:sqlite";

import type { Summary } from "../../types";

export interface SummaryRepository {
  create(data: {
    chatId: number;
    type: "history";
    content: string;
    generatedAtTurn: number;
  }): Summary;
  getLatest(chatId: number, type: "history"): Summary | null;
  getAllForChat(chatId: number): Summary[];
}

type SummaryRow = {
  id: number;
  chat_id: number;
  type: "history";
  content: string;
  generated_at_turn: number;
  created_at: number;
};

function toSummary(row: SummaryRow): Summary {
  return {
    id: row.id,
    chatId: row.chat_id,
    type: row.type,
    content: row.content,
    generatedAtTurn: row.generated_at_turn,
    createdAt: row.created_at,
  };
}

export function createSummaryRepository(db: Database): SummaryRepository {
  const insertSummary = db.prepare(
    `INSERT INTO summaries (chat_id, type, content, generated_at_turn, created_at)
     VALUES (?, ?, ?, ?, ?)`
  );
  const getByIdQuery = db.prepare(
    `SELECT id, chat_id, type, content, generated_at_turn, created_at
     FROM summaries WHERE id = ?`
  );
  const getLatestQuery = db.prepare(
    `SELECT id, chat_id, type, content, generated_at_turn, created_at
     FROM summaries
     WHERE chat_id = ? AND type = ?
     ORDER BY generated_at_turn DESC, created_at DESC, id DESC
     LIMIT 1`
  );
  const getAllForChatQuery = db.prepare(
    `SELECT id, chat_id, type, content, generated_at_turn, created_at
     FROM summaries
     WHERE chat_id = ?
     ORDER BY generated_at_turn ASC, created_at ASC, id ASC`
  );

  return {
    create(data) {
      const now = Date.now();
      const result = insertSummary.run(
        data.chatId,
        data.type,
        data.content,
        data.generatedAtTurn,
        now
      );
      const id = Number(result.lastInsertRowid);
      const row = getByIdQuery.get(id) as SummaryRow | null;

      if (!row) {
        throw new Error("Summary creation failed");
      }

      return toSummary(row);
    },
    getLatest(chatId, type) {
      const row = getLatestQuery.get(chatId, type) as SummaryRow | null;
      return row ? toSummary(row) : null;
    },
    getAllForChat(chatId) {
      const rows = getAllForChatQuery.all(chatId) as SummaryRow[];
      return rows.map((row) => toSummary(row));
    },
  };
}
