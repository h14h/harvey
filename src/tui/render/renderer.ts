import type { FocusArea, TuiState } from "../types.js";
import { bg, clear, cursor, drawBox, fg, pad, style, styled, truncate } from "./ansi.js";
import { calculateLayout } from "./layout.js";

const STREAM_CURSOR = "█";
const HELP_OVERLAY_WIDTH = 48;
const HELP_OVERLAY_HEIGHT = 24;
const HELP_OVERLAY_LINES: Array<{
	text: string;
	tone?: "header" | "hint";
	align?: "left" | "center";
}> = [
	{ text: "  NORMAL MODE", tone: "header" },
	{ text: "  ?           Show this help" },
	{ text: "  q, Ctrl+c   Quit" },
	{ text: "  j, ↓        Move down" },
	{ text: "  k, ↑        Move up" },
	{ text: "  G           Jump to last chat" },
	{ text: "  i, a        Enter insert mode" },
	{ text: "  h           Focus chat list" },
	{ text: "  l           Focus messages" },
	{ text: "  Tab         Focus next panel" },
	{ text: "  Shift+Tab   Focus previous panel" },
	{ text: "  Ctrl+d      Scroll messages down" },
	{ text: "  Ctrl+u      Scroll messages up" },
	{ text: "" },
	{ text: "  INSERT MODE", tone: "header" },
	{ text: "  Esc         Return to normal mode" },
	{ text: "  Enter       Send message" },
	{ text: "  Ctrl+Enter  Insert newline" },
	{ text: "  Backspace   Delete character" },
	{ text: "  Ctrl+w      Delete word" },
	{ text: "  Ctrl+u      Clear input" },
	{ text: "Press ? or Esc to close", tone: "hint", align: "center" },
];

function selectHelpOverlayLines(innerHeight: number): typeof HELP_OVERLAY_LINES {
	if (innerHeight <= 0) {
		return [];
	}

	if (innerHeight >= HELP_OVERLAY_LINES.length) {
		return HELP_OVERLAY_LINES;
	}

	const hintLine = HELP_OVERLAY_LINES[HELP_OVERLAY_LINES.length - 1];
	if (!hintLine) {
		return HELP_OVERLAY_LINES.slice(0, innerHeight);
	}

	if (innerHeight === 1) {
		return [hintLine];
	}

	return [...HELP_OVERLAY_LINES.slice(0, innerHeight - 1), hintLine];
}

function borderStyleForFocus(current: FocusArea, target: FocusArea): string {
	return current === target ? fg.green : fg.gray;
}

function renderStatusBar(state: TuiState, width: number): string {
	const modeText = state.mode === "insert" ? "[INSERT]" : "[NORMAL]";
	const modeColor = state.mode === "insert" ? fg.green : fg.cyan;
	const focusText = `Focus: ${state.focus}`;
	const leftPlain = `${modeText} ${focusText}`;
	const rightPlain = state.streaming.active ? "Streaming..." : "";
	const reservedRight = rightPlain.length > 0 ? rightPlain.length + 1 : 0;
	const leftWidth = Math.max(0, width - reservedRight);
	const leftPlainTrimmed = truncate(leftPlain, leftWidth, "");
	const leftPadded = pad(leftPlainTrimmed, leftWidth);
	const leftRendered = leftPadded.replace(modeText, styled(modeText, modeColor));
	if (rightPlain.length === 0) {
		return leftRendered;
	}
	return `${leftRendered} ${rightPlain}`;
}

function renderChatList(state: TuiState): string {
	const layout = calculateLayout(state.screenSize.rows, state.screenSize.cols);
	const region = layout.chatList;
	const borderStyle = borderStyleForFocus(state.focus, "chat-list");
	const parts: string[] = [];

	parts.push(
		drawBox(region.row, region.col, region.width, region.height, {
			title: "Chats",
			style: borderStyle,
		})
	);

	const innerWidth = Math.max(0, region.width - 2);
	const innerHeight = Math.max(0, region.height - 2);
	for (let index = 0; index < innerHeight; index += 1) {
		const chat = state.chats[index];
		const isSelected = index === state.selectedChatIndex;
		const indicator = isSelected ? ">" : " ";
		const title = chat ? chat.title : "";
		const lineText = `${indicator} ${title}`;
		const truncated = truncate(lineText, innerWidth, "...");
		const padded = pad(truncated, innerWidth);
		const rendered = isSelected ? styled(padded, style.inverse) : padded;
		parts.push(`${cursor.moveTo(region.row + 1 + index, region.col + 1)}${rendered}`);
	}

	return parts.join("");
}

function formatMessageLine(
	label: string,
	labelColor: string,
	content: string,
	width: number
): string {
	if (width <= 0) {
		return "";
	}

	const labelWidth = label.length;
	const contentWidth = width - labelWidth - 1;
	if (contentWidth <= 0) {
		return truncate(label, width, "");
	}

	const trimmedContent = truncate(content, contentWidth, "");
	return `${styled(label, labelColor)} ${trimmedContent}`;
}

function renderMessages(state: TuiState): string {
	const layout = calculateLayout(state.screenSize.rows, state.screenSize.cols);
	const region = layout.messages;
	const borderStyle = borderStyleForFocus(state.focus, "messages");
	const parts: string[] = [];

	parts.push(
		drawBox(region.row, region.col, region.width, region.height, {
			title: "Messages",
			style: borderStyle,
		})
	);

	const innerWidth = Math.max(0, region.width - 2);
	const innerHeight = Math.max(0, region.height - 2);
	const startIndex = Math.max(0, state.messageScrollOffset);
	let renderedLines = 0;

	for (
		let index = startIndex;
		index < state.messages.length && renderedLines < innerHeight;
		index += 1
	) {
		const message = state.messages[index];
		if (!message) {
			continue;
		}
		const firstLine = message.content.split("\n")[0] ?? "";
		const label = message.role === "user" ? "You:" : "AI:";
		const labelColor = message.role === "user" ? fg.blue : fg.green;
		const line = formatMessageLine(label, labelColor, firstLine, innerWidth);
		parts.push(`${cursor.moveTo(region.row + 1 + renderedLines, region.col + 1)}${line}`);
		renderedLines += 1;
	}

	if (state.streaming.active && renderedLines < innerHeight) {
		const streamingLine = formatMessageLine(
			"AI:",
			fg.green,
			`${state.streaming.content.split("\n")[0] ?? ""}${STREAM_CURSOR}`,
			innerWidth
		);
		parts.push(`${cursor.moveTo(region.row + 1 + renderedLines, region.col + 1)}${streamingLine}`);
	}

	if (state.error) {
		const message = truncate(state.error, innerWidth, "");
		const centered = pad(message, innerWidth, "center");
		const overlayRow = region.row + Math.floor(region.height / 2);
		parts.push(`${cursor.moveTo(overlayRow, region.col + 1)}${styled(centered, bg.red, fg.white)}`);
	}

	return parts.join("");
}

function renderInput(state: TuiState): { output: string; cursorRow: number; cursorCol: number } {
	const layout = calculateLayout(state.screenSize.rows, state.screenSize.cols);
	const region = layout.input;
	const borderStyle = state.focus === "input" || state.mode === "insert" ? fg.green : fg.gray;
	const parts: string[] = [];

	parts.push(
		drawBox(region.row, region.col, region.width, region.height, {
			style: borderStyle,
		})
	);

	const innerWidth = Math.max(0, region.width - 2);
	const prompt = ">";
	const promptStyle = state.mode === "insert" ? fg.yellow : fg.gray;
	const promptRendered = styled(prompt, promptStyle);
	const available = Math.max(0, innerWidth - prompt.length - 1);

	let visibleInput = state.inputBuffer;
	let cursorOffset = state.cursorPosition;
	if (state.inputBuffer.length > available && available > 0) {
		const ellipsis = "...";
		const windowSize = Math.max(0, available - ellipsis.length);
		const start = Math.max(0, state.inputBuffer.length - windowSize);
		visibleInput = `${ellipsis}${state.inputBuffer.slice(start)}`;
		cursorOffset = Math.max(0, state.cursorPosition - start) + ellipsis.length;
		cursorOffset = Math.min(cursorOffset, visibleInput.length);
	}

	const paddedInput = pad(visibleInput, available);
	const inputRow = region.row + 1;
	const inputCol = region.col + 1;
	parts.push(`${cursor.moveTo(inputRow, inputCol)}${promptRendered} ${paddedInput}`);

	const cursorRow = inputRow;
	const cursorCol = inputCol + prompt.length + 1 + Math.min(cursorOffset, available);
	return { output: parts.join(""), cursorRow, cursorCol };
}

function renderHelpOverlay(state: TuiState): string {
	const { rows, cols } = state.screenSize;
	const width = Math.min(HELP_OVERLAY_WIDTH, cols);
	const height = Math.min(HELP_OVERLAY_HEIGHT, rows);

	if (width < 4 || height < 4) {
		return "";
	}

	const row = Math.max(1, Math.floor((rows - height) / 2) + 1);
	const col = Math.max(1, Math.floor((cols - width) / 2) + 1);
	const innerWidth = width - 2;
	const innerHeight = height - 2;
	const parts: string[] = [];

	parts.push(drawBox(row, col, width, height, { title: "Help", style: fg.cyan }));

	const lines = selectHelpOverlayLines(innerHeight);
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		if (!line) {
			continue;
		}
		const truncated = truncate(line.text, innerWidth, "");
		const padded = pad(truncated, innerWidth, line.align ?? "left");
		let rendered = padded;
		if (line.tone === "header") {
			rendered = styled(padded, style.bold, fg.cyan);
		} else if (line.tone === "hint") {
			rendered = styled(padded, style.dim, fg.gray);
		}
		parts.push(`${cursor.moveTo(row + 1 + index, col + 1)}${rendered}`);
	}

	return parts.join("");
}

export function render(state: TuiState): string {
	const layout = calculateLayout(state.screenSize.rows, state.screenSize.cols);
	const output: string[] = [];

	output.push(cursor.hide, cursor.home, clear.screen);
	output.push(
		`${cursor.moveTo(layout.statusBar.row, layout.statusBar.col)}${renderStatusBar(state, layout.statusBar.width)}`
	);
	output.push(renderChatList(state));
	output.push(renderMessages(state));

	const inputRender = renderInput(state);
	output.push(inputRender.output);

	if (state.showHelp) {
		output.push(renderHelpOverlay(state));
	}

	if (state.mode === "insert") {
		output.push(cursor.moveTo(inputRender.cursorRow, inputRender.cursorCol), cursor.show);
	}

	return output.join("");
}
