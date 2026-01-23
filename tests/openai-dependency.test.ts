import { expect, test } from "bun:test";
import OpenAI from "openai";

test("openai client initializes", () => {
	expect(() => new OpenAI({ apiKey: "test-key" })).not.toThrow();
});
