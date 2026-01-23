import { describe, it, expect } from "bun:test";

describe("Store Types", () => {
  it("should have correct Mode type", () => {
    const normal: "normal" | "insert" = "normal";
    const insert: "normal" | "insert" = "insert";
    expect(normal).toBe("normal");
    expect(insert).toBe("insert");
  });

  it("should have correct FocusArea type", () => {
    const areas: Array<"chat-list" | "message-view" | "input"> = [
      "chat-list",
      "message-view",
      "input",
    ];
    expect(areas).toHaveLength(3);
    expect(areas).toContain("chat-list");
    expect(areas).toContain("message-view");
    expect(areas).toContain("input");
  });
});
