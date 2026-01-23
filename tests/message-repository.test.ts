import { test, expect } from "bun:test";

import { openDatabase } from "../src/db/connection";
import { createChatRepository } from "../src/db/repositories/chats";
import { createMessageRepository } from "../src/db/repositories/messages";

function setup() {
  const db = openDatabase(":memory:");
  const chatRepo = createChatRepository(db);
  const messageRepo = createMessageRepository(db);
  return { db, chatRepo, messageRepo };
}

function seedTurns(
  messageRepo: ReturnType<typeof createMessageRepository>,
  chatId: number,
  turns: number
) {
  for (let turn = 1; turn <= turns; turn += 1) {
    messageRepo.create({
      chatId,
      role: "user",
      content: `User ${turn}`,
      turnNumber: turn,
    });
    messageRepo.create({
      chatId,
      role: "assistant",
      content: `Assistant ${turn}`,
      turnNumber: turn,
    });
  }
}

test("create and fetch messages", () => {
  const { db, chatRepo, messageRepo } = setup();
  const chat = chatRepo.create({
    title: "Messages",
    anchorPrompt: "Anchor",
  });

  const created = messageRepo.create({
    chatId: chat.id,
    role: "user",
    content: "Hello",
    turnNumber: 1,
  });

  expect(created.id).toBeGreaterThan(0);
  expect(created.chatId).toBe(chat.id);
  expect(created.role).toBe("user");
  expect(created.content).toBe("Hello");
  expect(created.turnNumber).toBe(1);
  expect(created.createdAt).toBeGreaterThan(0);

  const messages = messageRepo.getAllForChat(chat.id);
  expect(messages).toHaveLength(1);
  expect(messages[0]).toEqual(created);

  db.close();
});

test("getLastNTurns returns the most recent turns", () => {
  const { db, chatRepo, messageRepo } = setup();
  const chat = chatRepo.create({
    title: "Turns",
    anchorPrompt: "Anchor",
  });

  seedTurns(messageRepo, chat.id, 3);

  const recent = messageRepo.getLastNTurns(chat.id, 2);
  expect(recent).toHaveLength(4);
  expect(recent[0]?.turnNumber).toBe(2);
  expect(recent[0]?.role).toBe("user");
  expect(recent[0]?.content).toBe("User 2");
  expect(recent[3]?.turnNumber).toBe(3);
  expect(recent[3]?.role).toBe("assistant");

  db.close();
});

test("getMessagesSinceTurn and getCurrentTurn", () => {
  const { db, chatRepo, messageRepo } = setup();
  const chat = chatRepo.create({
    title: "Current turn",
    anchorPrompt: "Anchor",
  });

  expect(messageRepo.getCurrentTurn(chat.id)).toBe(0);

  seedTurns(messageRepo, chat.id, 2);

  expect(messageRepo.getCurrentTurn(chat.id)).toBe(2);

  const since = messageRepo.getMessagesSinceTurn(chat.id, 1);
  expect(since).toHaveLength(2);
  expect(since[0]?.turnNumber).toBe(2);
  expect(since[0]?.role).toBe("user");
  expect(since[1]?.role).toBe("assistant");

  db.close();
});
