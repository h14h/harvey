import { test, expect } from "bun:test";
import { Database } from "bun:sqlite";

import { applySchema } from "../src/db/schema";
import { openDatabase } from "../src/db/connection";

test("applySchema creates required tables and indexes", () => {
  const db = new Database(":memory:");
  applySchema(db);

  const tables = db
    .query("SELECT name FROM sqlite_master WHERE type = 'table'")
    .all()
    .map((row) => row.name as string);

  expect(tables).toEqual(
    expect.arrayContaining([
      "chats",
      "messages",
      "summaries",
      "global_config",
    ])
  );

  const indexes = db
    .query(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%'"
    )
    .all()
    .map((row) => row.name as string);

  expect(indexes).toEqual(
    expect.arrayContaining([
      "idx_messages_chat_id",
      "idx_messages_turn_number",
      "idx_summaries_chat_id",
    ])
  );

  db.close();
});

test("openDatabase applies schema to new connection", () => {
  const db = openDatabase(":memory:");
  const tables = db
    .query("SELECT name FROM sqlite_master WHERE type = 'table'")
    .all()
    .map((row) => row.name as string);

  expect(tables).toEqual(
    expect.arrayContaining([
      "chats",
      "messages",
      "summaries",
      "global_config",
    ])
  );

  db.close();
});
