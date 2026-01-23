import { expect, test } from "bun:test";
import OpenAI from "openai";

test("openai client initializes", () => {
	// Note: dangerouslyAllowBrowser is needed because tests run with a DOM environment
	expect(() => new OpenAI({ apiKey: "test-key", dangerouslyAllowBrowser: true })).not.toThrow();
});
