import { test, expect } from "bun:test";

import { openDatabase } from "../src/db/connection";
import { createGlobalConfigRepository } from "../src/db/repositories/config";

function setup() {
  const db = openDatabase(":memory:");
  const repo = createGlobalConfigRepository(db);
  return { db, repo };
}

test("get initializes singleton row", () => {
  const { db, repo } = setup();

  const first = repo.get();
  expect(first.id).toBe(1);
  expect(first.globalTone).toBeNull();
  expect(first.globalToneSummary).toBeNull();

  const second = repo.get();
  expect(second.id).toBe(1);
  expect(second.updatedAt).toBe(first.updatedAt);

  const countRow = db
    .prepare("SELECT COUNT(*) as count FROM global_config")
    .get() as { count: number };
  expect(countRow.count).toBe(1);

  db.close();
});

test("updates tone, summary, and clear", async () => {
  const { db, repo } = setup();

  const initial = repo.get();

  await new Promise((resolve) => setTimeout(resolve, 2));
  repo.updateGlobalTone("Calm and direct");

  const toneUpdated = repo.get();
  expect(toneUpdated.globalTone).toBe("Calm and direct");
  expect(toneUpdated.updatedAt).toBeGreaterThan(initial.updatedAt);

  await new Promise((resolve) => setTimeout(resolve, 2));
  repo.updateGlobalToneSummary("Prefers concise responses");

  const summaryUpdated = repo.get();
  expect(summaryUpdated.globalToneSummary).toBe("Prefers concise responses");
  expect(summaryUpdated.updatedAt).toBeGreaterThan(toneUpdated.updatedAt);

  await new Promise((resolve) => setTimeout(resolve, 2));
  repo.clearGlobalTone();

  const cleared = repo.get();
  expect(cleared.globalTone).toBeNull();
  expect(cleared.globalToneSummary).toBeNull();
  expect(cleared.updatedAt).toBeGreaterThan(summaryUpdated.updatedAt);

  const countRow = db
    .prepare("SELECT COUNT(*) as count FROM global_config")
    .get() as { count: number };
  expect(countRow.count).toBe(1);

  db.close();
});
