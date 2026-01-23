import { test, expect } from "bun:test";

import { openDatabase } from "../src/db/connection";
import { createChatRepository } from "../src/db/repositories/chats";

function setup() {
  const db = openDatabase(":memory:");
  const repo = createChatRepository(db);
  return { db, repo };
}

test("create and fetch chats", () => {
  const { db, repo } = setup();

  const created = repo.create({
    title: "First chat",
    anchorPrompt: "Remember the goal",
  });

  expect(created.id).toBeGreaterThan(0);
  expect(created.title).toBe("First chat");
  expect(created.anchorPrompt).toBe("Remember the goal");
  expect(created.anchorSummary).toBeNull();
  expect(created.turnCount).toBe(0);
  expect(created.createdAt).toBe(created.updatedAt);

  const fetched = repo.getById(created.id);
  expect(fetched).toEqual(created);

  const all = repo.getAll();
  expect(all).toHaveLength(1);
  expect(all[0]?.id).toBe(created.id);

  db.close();
});

test("update title and anchor summary", async () => {
  const { db, repo } = setup();
  const created = repo.create({
    title: "Draft",
    anchorPrompt: "Anchor",
  });

  await new Promise((resolve) => setTimeout(resolve, 2));
  repo.updateTitle(created.id, "Renamed");

  const updated = repo.getById(created.id);
  expect(updated?.title).toBe("Renamed");
  expect(updated?.updatedAt).toBeGreaterThan(created.updatedAt);

  await new Promise((resolve) => setTimeout(resolve, 2));
  repo.updateAnchorSummary(created.id, "Anchor summary");

  const summaryUpdated = repo.getById(created.id);
  expect(summaryUpdated?.anchorSummary).toBe("Anchor summary");
  expect(summaryUpdated?.updatedAt).toBeGreaterThan(updated?.updatedAt ?? 0);

  db.close();
});

test("increment turn count", () => {
  const { db, repo } = setup();
  const created = repo.create({
    title: "Turns",
    anchorPrompt: "Anchor",
  });

  repo.incrementTurnCount(created.id);
  repo.incrementTurnCount(created.id);

  const updated = repo.getById(created.id);
  expect(updated?.turnCount).toBe(2);

  db.close();
});

test("delete removes chat", () => {
  const { db, repo } = setup();
  const created = repo.create({
    title: "To delete",
    anchorPrompt: "Anchor",
  });

  repo.delete(created.id);

  expect(repo.getById(created.id)).toBeNull();
  expect(repo.getAll()).toHaveLength(0);

  db.close();
});

test("updates error on missing chat", () => {
  const { db, repo } = setup();

  expect(() => repo.updateTitle(999, "Missing")).toThrow("Chat not found");
  expect(() => repo.updateAnchorSummary(999, "Missing")).toThrow(
    "Chat not found"
  );
  expect(() => repo.incrementTurnCount(999)).toThrow("Chat not found");
  expect(() => repo.delete(999)).toThrow("Chat not found");

  db.close();
});
