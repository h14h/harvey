import { describe, expect, test } from "bun:test";
import { calculateLayout } from "./layout.js";

describe("calculateLayout", () => {
	test("calculates layout for standard screens", () => {
		const layout = calculateLayout(24, 80);

		expect(layout.statusBar).toEqual({ row: 1, col: 1, width: 80, height: 1 });
		expect(layout.input).toEqual({ row: 22, col: 1, width: 80, height: 3 });
		expect(layout.chatList).toEqual({ row: 2, col: 1, width: 24, height: 20 });
		expect(layout.messages).toEqual({ row: 2, col: 25, width: 56, height: 20 });
	});

	test("caps chat list width at 30 columns", () => {
		const layout = calculateLayout(40, 120);

		expect(layout.chatList.width).toBe(30);
		expect(layout.messages.width).toBe(90);
		expect(layout.input).toEqual({ row: 38, col: 1, width: 120, height: 3 });
	});

	test("handles small screens without overlap", () => {
		const layout = calculateLayout(4, 20);

		expect(layout.statusBar).toEqual({ row: 1, col: 1, width: 20, height: 1 });
		expect(layout.chatList.row).toBe(2);
		expect(layout.chatList.height).toBe(1);
		expect(layout.input.row).toBe(3);
		expect(layout.input.height).toBe(2);
		const chatEnd = layout.chatList.col + layout.chatList.width - 1;
		const messageStart = layout.messages.col;
		expect(chatEnd + 1).toBe(messageStart);
		expect(layout.chatList.width + layout.messages.width).toBe(20);
	});
});
