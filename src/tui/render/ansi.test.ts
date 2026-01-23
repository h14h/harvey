import { describe, expect, test } from "bun:test";
import { bg, clear, cursor, drawBox, fg, pad, screen, style, styled, truncate } from "./ansi.js";

const ESC = "\u001b[";

describe("ansi utilities", () => {
	test("cursor and screen escape codes", () => {
		expect(cursor.hide).toBe(`${ESC}?25l`);
		expect(cursor.show).toBe(`${ESC}?25h`);
		expect(cursor.home).toBe(`${ESC}H`);
		expect(cursor.moveTo(2, 3)).toBe(`${ESC}2;3H`);
		expect(cursor.up()).toBe(`${ESC}1A`);
		expect(cursor.down(4)).toBe(`${ESC}4B`);
		expect(cursor.left(2)).toBe(`${ESC}2D`);
		expect(cursor.right(3)).toBe(`${ESC}3C`);
		expect(clear.screen).toBe(`${ESC}2J`);
		expect(clear.line).toBe(`${ESC}2K`);
		expect(screen.alt).toBe(`${ESC}?1049h`);
		expect(screen.main).toBe(`${ESC}?1049l`);
	});

	test("color and style escape codes", () => {
		expect(fg.red).toBe(`${ESC}31m`);
		expect(bg.blue).toBe(`${ESC}44m`);
		expect(style.bold).toBe(`${ESC}1m`);
		expect(style.reset).toBe(`${ESC}0m`);
	});

	test("styled wraps text in reset", () => {
		expect(styled("hello", fg.green, style.bold)).toBe(
			`${fg.green}${style.bold}hello${style.reset}`
		);
		expect(styled("plain")).toBe("plain");
	});

	test("drawBox outputs bordered lines", () => {
		const box = drawBox(1, 1, 4, 3);
		const expected = [`${ESC}1;1H+--+`, `${ESC}2;1H|  |`, `${ESC}3;1H+--+`].join("");
		expect(box).toBe(expected);
	});

	test("truncate handles edge cases", () => {
		expect(truncate("hello", 10)).toBe("hello");
		expect(truncate("hello", 4)).toBe("h...");
		expect(truncate("hello", 2)).toBe("..");
		expect(truncate("hello", 0)).toBe("");
	});

	test("pad aligns text", () => {
		expect(pad("hi", 4, "left")).toBe("hi  ");
		expect(pad("hi", 4, "right")).toBe("  hi");
		expect(pad("hi", 4, "center")).toBe(" hi ");
		expect(pad("hello", 3, "left")).toBe("hel");
	});
});
