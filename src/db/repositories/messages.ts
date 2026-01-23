import type { Database } from "bun:sqlite";

import type { Message } from "../../types";

export interface MessageRepository {
  create(data: {
    chatId: number;
    role: "user" | "assistant" | "system";
    content: string;
    turnNumber: number;
  }): Message;
  getLastNTurns(chatId: number, n: number): Message[];
  getAllForChat(chatId: number): Message[];
  getMessagesSinceTurn(chatId: number, turn: number): Message[];
  getCurrentTurn(chatId: number): number;
}

type MessageRow = {
  id: number;
  chat_id: number;
  role: "user" | "assistant" | "system";
  content: string;
  turn_number: number;
  created_at: number;
};

type MaxTurnRow = {
  max_turn: number;
};

function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    chatId: row.chat_id,
    role: row.role,
    content: row.content,
    turnNumber: row.turn_number,
    createdAt: row.created_at,
  };
}

export function createMessageRepository(db: Database): MessageRepository {
  const insertMessage = db.prepare(
    `INSERT INTO messages (chat_id, role, content, turn_number, created_at)
     VALUES (?, ?, ?, ?, ?)`
  );
  const getByIdQuery = db.prepare(
    `SELECT id, chat_id, role, content, turn_number, created_at
     FROM messages WHERE id = ?`
  );
  const getAllForChatQuery = db.prepare(
    `SELECT id, chat_id, role, content, turn_number, created_at
     FROM messages WHERE chat_id = ?
     ORDER BY turn_number ASC, created_at ASC, id ASC`
  );
  const getMessagesSinceTurnQuery = db.prepare(
    `SELECT id, chat_id, role, content, turn_number, created_at
     FROM messages WHERE chat_id = ? AND turn_number > ?
     ORDER BY turn_number ASC, created_at ASC, id ASC`
  );
  const getCurrentTurnQuery = db.prepare(
    `SELECT COALESCE(MAX(turn_number), 0) as max_turn
     FROM messages WHERE chat_id = ?`
  );
  const getMessagesFromTurnQuery = db.prepare(
    `SELECT id, chat_id, role, content, turn_number, created_at
     FROM messages WHERE chat_id = ? AND turn_number >= ?
     ORDER BY turn_number ASC, created_at ASC, id ASC`
  );

  return {
    create(data) {
      const now = Date.now();
      const result = insertMessage.run(
        data.chatId,
        data.role,
        data.content,
        data.turnNumber,
        now
      );
      const id = Number(result.lastInsertRowid);
      const row = getByIdQuery.get(id) as MessageRow | null;

      if (!row) {
        throw new Error("Message creation failed");
      }

      return toMessage(row);
    },
    getLastNTurns(chatId, n) {
      if (n <= 0) {
        return [];
      }

      const row = getCurrentTurnQuery.get(chatId) as MaxTurnRow | null;
      const currentTurn = Number(row?.max_turn ?? 0);

      if (currentTurn === 0) {
        return [];
      }

      const startTurn = Math.max(1, currentTurn - n + 1);
      const rows = getMessagesFromTurnQuery.all(
        chatId,
        startTurn
      ) as MessageRow[];

      return rows.map((message) => toMessage(message));
    },
    getAllForChat(chatId) {
      const rows = getAllForChatQuery.all(chatId) as MessageRow[];
      return rows.map((message) => toMessage(message));
    },
    getMessagesSinceTurn(chatId, turn) {
      const rows = getMessagesSinceTurnQuery.all(
        chatId,
        turn
      ) as MessageRow[];
      return rows.map((message) => toMessage(message));
    },
    getCurrentTurn(chatId) {
      const row = getCurrentTurnQuery.get(chatId) as MaxTurnRow | null;
      return Number(row?.max_turn ?? 0);
    },
  };
}
