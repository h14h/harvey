import { describe, expect, test } from "bun:test";
import type { InputEvent } from "../types.js";
import { parseInput } from "./parser.js";

function expectKey(
	event: ReturnType<typeof parseInput>,
	key: {
		name: InputEvent["key"]["name"];
		char?: string;
		ctrl?: boolean;
		alt?: boolean;
		shift?: boolean;
	}
) {
	expect(event.key.name).toBe(key.name);
	if (key.char !== undefined) {
		expect(event.key.char).toBe(key.char);
	}
	expect(event.key.ctrl).toBe(key.ctrl ?? false);
	expect(event.key.alt).toBe(key.alt ?? false);
	expect(event.key.shift).toBe(key.shift ?? false);
}

describe("parseInput", () => {
	test("parses printable characters", () => {
		expectKey(parseInput(Buffer.from("a")), { name: "char", char: "a" });
		expectKey(parseInput(Buffer.from("Z")), { name: "char", char: "Z" });
		expectKey(parseInput(Buffer.from("1")), { name: "char", char: "1" });
		expectKey(parseInput(Buffer.from("?")), { name: "char", char: "?" });
	});

	test("parses multi-byte UTF-8 characters", () => {
		const buffer = Buffer.from("\u00e9", "utf8");
		expectKey(parseInput(buffer), { name: "char", char: "\u00e9" });
	});

	test("parses control characters", () => {
		expectKey(parseInput(Buffer.from([0x03])), { name: "char", char: "c", ctrl: true });
		expectKey(parseInput(Buffer.from([0x17])), { name: "char", char: "w", ctrl: true });
		expectKey(parseInput(Buffer.from([0x15])), { name: "char", char: "u", ctrl: true });
	});

	test("parses named keys", () => {
		expectKey(parseInput(Buffer.from([0x1b])), { name: "escape" });
		expectKey(parseInput(Buffer.from([0x0d])), { name: "enter" });
		expectKey(parseInput(Buffer.from([0x0a])), { name: "enter" });
		expectKey(parseInput(Buffer.from([0x09])), { name: "tab" });
		expectKey(parseInput(Buffer.from([0x7f])), { name: "backspace" });
		expectKey(parseInput(Buffer.from([0x08])), { name: "backspace" });
	});

	test("parses arrow keys", () => {
		expectKey(parseInput(Buffer.from([0x1b, 0x5b, 0x41])), { name: "up" });
		expectKey(parseInput(Buffer.from([0x1b, 0x5b, 0x42])), { name: "down" });
		expectKey(parseInput(Buffer.from([0x1b, 0x5b, 0x43])), { name: "right" });
		expectKey(parseInput(Buffer.from([0x1b, 0x5b, 0x44])), { name: "left" });
	});

	test("parses ctrl+enter sequences", () => {
		expectKey(parseInput(Buffer.from([0x1b, 0x5b, 0x31, 0x33, 0x3b, 0x35, 0x75])), {
			name: "enter",
			ctrl: true,
		});
		expectKey(
			parseInput(Buffer.from([0x1b, 0x5b, 0x32, 0x37, 0x3b, 0x35, 0x3b, 0x31, 0x33, 0x7e])),
			{ name: "enter", ctrl: true }
		);
	});

	test("parses alt+key combinations", () => {
		expectKey(parseInput(Buffer.from([0x1b, 0x61])), { name: "char", char: "a", alt: true });
	});

	test("parses shift+arrow combinations", () => {
		expectKey(parseInput(Buffer.from([0x1b, 0x5b, 0x31, 0x3b, 0x32, 0x41])), {
			name: "up",
			shift: true,
		});
	});
});
