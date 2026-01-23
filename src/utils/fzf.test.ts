/**
 * Tests for fzf integration utilities.
 */

import { describe, test, expect, mock, beforeEach } from "bun:test";
import { searchChatsWithFzf, isFzfAvailable } from "./fzf";
import type { Chat } from "../types";

// Mock chats for testing
const mockChats: Chat[] = [
  {
    id: 1,
    title: "Discussion about TypeScript",
    anchorPrompt: "You are a TypeScript expert",
    anchorSummary: null,
    turnCount: 5,
    createdAt: 1000,
    updatedAt: 2000,
  },
  {
    id: 2,
    title: "Rust programming help",
    anchorPrompt: "You are a Rust expert",
    anchorSummary: null,
    turnCount: 3,
    createdAt: 3000,
    updatedAt: 4000,
  },
  {
    id: 42,
    title: "React component design",
    anchorPrompt: "You are a React expert",
    anchorSummary: null,
    turnCount: 10,
    createdAt: 5000,
    updatedAt: 6000,
  },
];

// Store original Bun.spawn and Response
let originalSpawn: typeof Bun.spawn;
let originalResponse: typeof Response;

beforeEach(() => {
  // Restore original functions before each test
  originalSpawn = Bun.spawn;
  originalResponse = globalThis.Response;
});

describe("searchChatsWithFzf", () => {
  test("returns null chat when chats array is empty", async () => {
    const result = await searchChatsWithFzf([]);

    expect(result.chat).toBeNull();
    expect(result.error).toBeFalse();
  });

  test("handles fzf not installed gracefully (ENOENT)", async () => {
    // Mock Bun.spawn to simulate fzf not found
    Bun.spawn = mock(() => {
      throw new Error("spawn fzf ENOENT");
    });

    const result = await searchChatsWithFzf(mockChats);

    expect(result.chat).toBeNull();
    expect(result.error).toBeTrue();
    expect(result.errorMessage).toContain("fzf not found");

    // Restore original spawn
    Bun.spawn = originalSpawn;
  });

  test("handles fzf not found with generic error message", async () => {
    Bun.spawn = mock(() => {
      throw new Error("fzf: not found");
    });

    const result = await searchChatsWithFzf(mockChats);

    expect(result.chat).toBeNull();
    expect(result.error).toBeTrue();
    expect(result.errorMessage).toContain("fzf not found");

    Bun.spawn = originalSpawn;
  });

  test("returns null chat when user cancels (exit code non-zero)", async () => {
    // Create a mock process that exits with code 1 (cancelled)
    const mockStdout = new ReadableStream({
      start(controller) {
        controller.close();
      },
    });

    const mockProc = {
      stdin: {
        getWriter: () => ({
          write: async () => {},
          close: async () => {},
        }),
      },
      stdout: mockStdout,
      exited: Promise.resolve(1), // Non-zero exit = cancelled
    };

    Bun.spawn = mock(() => mockProc);

    const result = await searchChatsWithFzf(mockChats);

    expect(result.chat).toBeNull();
    expect(result.error).toBeFalse();

    Bun.spawn = originalSpawn;
  });

  test("parses fzf output correctly and returns selected chat", async () => {
    // Create a mock stdout stream with the selected line
    const mockStdout = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("2:Rust programming help"));
        controller.close();
      },
    });

    const mockProc = {
      stdin: {
        getWriter: () => ({
          write: async () => {},
          close: async () => {},
        }),
      },
      stdout: mockStdout,
      exited: Promise.resolve(0), // Exit code 0 = success
    };

    Bun.spawn = mock(() => mockProc);

    const result = await searchChatsWithFzf(mockChats);

    expect(result.error).toBeFalse();
    expect(result.chat).not.toBeNull();
    expect(result.chat?.id).toBe(2);
    expect(result.chat?.title).toBe("Rust programming help");

    Bun.spawn = originalSpawn;
  });

  test("handles malformed fzf output (no colon)", async () => {
    const mockStdout = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("invalid-format-no-colon"));
        controller.close();
      },
    });

    const mockProc = {
      stdin: {
        getWriter: () => ({
          write: async () => {},
          close: async () => {},
        }),
      },
      stdout: mockStdout,
      exited: Promise.resolve(0),
    };

    Bun.spawn = mock(() => mockProc);

    const result = await searchChatsWithFzf(mockChats);

    expect(result.chat).toBeNull();
    expect(result.error).toBeTrue();
    expect(result.errorMessage).toBe("Invalid fzf output format");

    Bun.spawn = originalSpawn;
  });

  test("handles empty fzf output", async () => {
    const mockStdout = new ReadableStream({
      start(controller) {
        controller.close();
      },
    });

    const mockProc = {
      stdin: {
        getWriter: () => ({
          write: async () => {},
          close: async () => {},
        }),
      },
      stdout: mockStdout,
      exited: Promise.resolve(0),
    };

    Bun.spawn = mock(() => mockProc);

    const result = await searchChatsWithFzf(mockChats);

    expect(result.chat).toBeNull();
    expect(result.error).toBeFalse();

    Bun.spawn = originalSpawn;
  });

  test("handles whitespace-only fzf output", async () => {
    const mockStdout = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("   \n  "));
        controller.close();
      },
    });

    const mockProc = {
      stdin: {
        getWriter: () => ({
          write: async () => {},
          close: async () => {},
        }),
      },
      stdout: mockStdout,
      exited: Promise.resolve(0),
    };

    Bun.spawn = mock(() => mockProc);

    const result = await searchChatsWithFzf(mockChats);

    expect(result.chat).toBeNull();
    expect(result.error).toBeFalse();

    Bun.spawn = originalSpawn;
  });

  test("handles non-existent chat ID from fzf", async () => {
    const mockStdout = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("999:Nonexistent chat"));
        controller.close();
      },
    });

    const mockProc = {
      stdin: {
        getWriter: () => ({
          write: async () => {},
          close: async () => {},
        }),
      },
      stdout: mockStdout,
      exited: Promise.resolve(0),
    };

    Bun.spawn = mock(() => mockProc);

    const result = await searchChatsWithFzf(mockChats);

    expect(result.chat).toBeNull();
    expect(result.error).toBeFalse();

    Bun.spawn = originalSpawn;
  });

  test("handles invalid chat ID (not a number)", async () => {
    const mockStdout = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("abc:Some title"));
        controller.close();
      },
    });

    const mockProc = {
      stdin: {
        getWriter: () => ({
          write: async () => {},
          close: async () => {},
        }),
      },
      stdout: mockStdout,
      exited: Promise.resolve(0),
    };

    Bun.spawn = mock(() => mockProc);

    const result = await searchChatsWithFzf(mockChats);

    expect(result.chat).toBeNull();
    expect(result.error).toBeTrue();
    expect(result.errorMessage).toBe("Invalid chat ID from fzf");

    Bun.spawn = originalSpawn;
  });

  test("formats chat list correctly for fzf input", async () => {
    let capturedInput = "";

    const mockStdout = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("1:Discussion about TypeScript"));
        controller.close();
      },
    });

    const mockProc = {
      stdin: {
        getWriter: () => ({
          write: mock(async (data: Uint8Array) => {
            capturedInput = new TextDecoder().decode(data);
          }),
          close: async () => {},
        }),
      },
      stdout: mockStdout,
      exited: Promise.resolve(0),
    };

    Bun.spawn = mock(() => mockProc);

    await searchChatsWithFzf(mockChats);

    // Verify format: "id:title" per line
    const lines = capturedInput.split("\n").filter((l) => l.length > 0);
    expect(lines).toEqual([
      "1:Discussion about TypeScript",
      "2:Rust programming help",
      "42:React component design",
    ]);

    Bun.spawn = originalSpawn;
  });

  test("handles chat with colon in title", async () => {
    // A chat with a colon in the title should still work since we
    // only split on the first colon
    const chatsWithColon: Chat[] = [
      {
        id: 1,
        title: "Discussion: TypeScript vs Rust",
        anchorPrompt: "You are an expert",
        anchorSummary: null,
        turnCount: 5,
        createdAt: 1000,
        updatedAt: 2000,
      },
    ];

    const mockStdout = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("1:Discussion: TypeScript vs Rust"));
        controller.close();
      },
    });

    const mockProc = {
      stdin: {
        getWriter: () => ({
          write: async () => {},
          close: async () => {},
        }),
      },
      stdout: mockStdout,
      exited: Promise.resolve(0),
    };

    Bun.spawn = mock(() => mockProc);

    const result = await searchChatsWithFzf(chatsWithColon);

    expect(result.error).toBeFalse();
    expect(result.chat).not.toBeNull();
    expect(result.chat?.id).toBe(1);
    expect(result.chat?.title).toBe("Discussion: TypeScript vs Rust");

    Bun.spawn = originalSpawn;
  });
});

describe("isFzfAvailable", () => {
  test("returns true when fzf is available (exit code 0)", async () => {
    const mockStdout = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("0.53.0"));
        controller.close();
      },
    });

    const mockProc = {
      stdout: mockStdout,
      stderr: new ReadableStream({
        start(controller) {
          controller.close();
        },
      }),
      exited: Promise.resolve(0), // Exit code 0 = available
    };

    Bun.spawn = mock(() => mockProc);

    const result = await isFzfAvailable();

    expect(result).toBeTrue();

    Bun.spawn = originalSpawn;
  });

  test("returns false when fzf returns non-zero exit", async () => {
    const mockProc = {
      stdout: new ReadableStream({
        start(controller) {
          controller.close();
        },
      }),
      stderr: new ReadableStream({
        start(controller) {
          controller.close();
        },
      }),
      exited: Promise.resolve(1), // Non-zero exit = not available
    };

    Bun.spawn = mock(() => mockProc);

    const result = await isFzfAvailable();

    expect(result).toBeFalse();

    Bun.spawn = originalSpawn;
  });

  test("returns false when fzf command throws", async () => {
    Bun.spawn = mock(() => {
      throw new Error("Command not found");
    });

    const result = await isFzfAvailable();

    expect(result).toBeFalse();

    Bun.spawn = originalSpawn;
  });
});
