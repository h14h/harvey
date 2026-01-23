export interface Region {
	row: number;
	col: number;
	width: number;
	height: number;
}

export interface Layout {
	statusBar: Region;
	chatList: Region;
	messages: Region;
	input: Region;
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(value, max));
}

export function calculateLayout(rows: number, cols: number): Layout {
	const safeRows = Math.max(1, rows);
	const safeCols = Math.max(1, cols);
	const statusHeight = 1;
	const desiredInputHeight = 3;
	const minContentHeight = 1;

	let inputHeight = desiredInputHeight;
	if (safeRows < statusHeight + desiredInputHeight + minContentHeight) {
		inputHeight = Math.max(1, safeRows - statusHeight - minContentHeight);
	}

	const contentHeight = Math.max(minContentHeight, safeRows - statusHeight - inputHeight);

	const statusBar: Region = {
		row: 1,
		col: 1,
		width: safeCols,
		height: statusHeight,
	};

	const contentRow = statusBar.row + statusBar.height;
	const inputRow = contentRow + contentHeight;
	const input: Region = {
		row: inputRow,
		col: 1,
		width: safeCols,
		height: inputHeight,
	};

	const rawChatWidth = Math.floor(safeCols * 0.3);
	const chatWidth = clamp(Math.min(30, rawChatWidth), 1, Math.max(1, safeCols - 1));
	const messagesWidth = Math.max(1, safeCols - chatWidth);

	const chatList: Region = {
		row: contentRow,
		col: 1,
		width: chatWidth,
		height: contentHeight,
	};

	const messages: Region = {
		row: contentRow,
		col: chatWidth + 1,
		width: messagesWidth,
		height: contentHeight,
	};

	return { statusBar, chatList, messages, input };
}
