import React from "react";
import { test, expect } from "bun:test";
import { render } from "ink-testing-library";
import { App } from "../src/ui/ink/poc";

test("ink proof-of-concept renders the main regions", () => {
  const { lastFrame } = render(
    <App
      chatTitle="Launch"
      chats={["Launch Chat", "Notes"]}
      messages={["User: Ready?", "Assistant: Ready."]}
      status="[42 tokens]"
    />
  );

  const frame = lastFrame() ?? "";
  expect(frame).toContain("Harvey - Launch");
  expect(frame).toContain("Chat List");
  expect(frame).toContain("Message View");
  expect(frame).toContain("> Type a message...");
});
