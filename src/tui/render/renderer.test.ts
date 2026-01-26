import { describe, expect, test } from "bun:test";
import { INITIAL_STATE } from "../state/reducer.js";
import type { TuiState } from "../types.js";
import { cursor, fg } from "./ansi.js";
import { render } from "./renderer.js";

function buildState(overrides: Partial<TuiState>): TuiState {
	return {
		...INITIAL_STATE,
		screenSize: { rows: 12, cols: 60 },
		...overrides,
	};
}

function stripAnsi(text: string): string {
	// biome-ignore lint/complexity/useRegexLiterals: avoid control characters in regex literals.
	const ansiPattern = new RegExp("\\u001b\\[[0-9;?]*[ -/]*[@-~]", "g");
	return text.replace(ansiPattern, "");
}

describe("render", () => {
	test("shows the correct mode indicator", () => {
		const normal = render(buildState({ mode: "normal" }));
		const insert = render(buildState({ mode: "insert" }));

		expect(normal).toContain("[NORMAL]");
		expect(insert).toContain("[INSERT]");
	});

	test("shows the focus area", () => {
		const output = render(buildState({ focus: "messages" }));

		expect(output).toContain("Focus: messages");
	});

	test("renders chat list selection", () => {
		const output = render(
			buildState({
				chats: [
					{ id: 1, title: "Chat Alpha" },
					{ id: 2, title: "Chat Beta" },
				],
				selectedChatIndex: 1,
			})
		);

		expect(output).toContain("> Chat Beta");
	});

	test("shows empty chat list hint", () => {
		const output = stripAnsi(
			render(buildState({ chats: [], selectedChatIndex: 0, screenSize: { rows: 12, cols: 80 } }))
		);

		expect(output).toContain("No chats yet");
		expect(output).toContain("Press n to create one");
	});

	test("renders message role labels", () => {
		const output = render(
			buildState({
				messages: [
					{ id: 1, role: "user", content: "Hi" },
					{ id: 2, role: "assistant", content: "Hello" },
				],
			})
		);

		expect(output).toContain("You:");
		expect(output).toContain("AI:");
	});

	test("shows streaming content with cursor", () => {
		const output = render(
			buildState({
				streaming: { active: true, content: "Thinking", chatId: 1 },
			})
		);

		expect(output).toContain("Thinking");
		expect(output).toContain("█");
	});

	test("wraps streaming content to the messages width", () => {
		const output = stripAnsi(
			render(
				buildState({
					screenSize: { rows: 12, cols: 30 },
					streaming: { active: true, content: "First second third fourth", chatId: 1 },
				})
			)
		);

		expect(output).toContain("AI: First second");
		expect(output).toContain("    third fourth");
	});

	test("overlays error messages", () => {
		const output = render(buildState({ error: "Something went wrong" }));

		expect(output).toContain("Something went wrong");
	});

	test("renders input prompt and text", () => {
		const output = stripAnsi(render(buildState({ inputBuffer: "Hello", cursorPosition: 5 })));

		expect(output).toContain("> Hello");
	});

	test("renders help overlay content when enabled", () => {
		const output = stripAnsi(
			render(buildState({ showHelp: true, screenSize: { rows: 30, cols: 80 } }))
		);

		expect(output).toContain("Help");
		expect(output).toContain("NORMAL MODE");
		expect(output).toContain("INSERT MODE");
		expect(output).toContain("n           New chat");
		expect(output).toContain("Press ? or Esc to close");
	});

	test("centers the help overlay for standard screen sizes", () => {
		const output = render(buildState({ showHelp: true, screenSize: { rows: 30, cols: 80 } }));

		const expectedTopLeft = `${cursor.moveTo(4, 17)}${fg.cyan}+`;
		expect(output).toContain(expectedTopLeft);
	});

	test("does not render help overlay when disabled", () => {
		const output = stripAnsi(
			render(buildState({ showHelp: false, screenSize: { rows: 30, cols: 80 } }))
		);

		expect(output).not.toContain("Press ? or Esc to close");
	});

	test("keeps dismiss hint visible on small screens", () => {
		const output = stripAnsi(
			render(buildState({ showHelp: true, screenSize: { rows: 6, cols: 40 } }))
		);

		expect(output).toContain("Press ? or Esc to close");
	});

	test("toggles cursor visibility by mode", () => {
		const normal = render(buildState({ mode: "normal" }));
		const insert = render(buildState({ mode: "insert" }));

		expect(normal).toContain(cursor.hide);
		expect(normal).not.toContain(cursor.show);
		expect(insert).toContain(cursor.show);
	});
});
