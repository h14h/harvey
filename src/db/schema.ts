import type { Database } from "bun:sqlite";

const schemaSql = `
CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    anchor_prompt TEXT NOT NULL,
    anchor_summary TEXT,
    turn_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    turn_number INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('history')),
    content TEXT NOT NULL,
    generated_at_turn INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS global_config (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    global_tone TEXT,
    global_tone_summary TEXT,
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_turn_number ON messages(chat_id, turn_number);
CREATE INDEX IF NOT EXISTS idx_summaries_chat_id ON summaries(chat_id);
CREATE INDEX IF NOT EXISTS idx_summaries_chat_type_turn
    ON summaries(chat_id, type, generated_at_turn);
`;

export function applySchema(db: Database): void {
  db.exec(schemaSql);
}

export { schemaSql };
