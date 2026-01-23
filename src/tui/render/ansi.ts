const ESC = "\u001b[";

export const cursor = {
	hide: `${ESC}?25l`,
	show: `${ESC}?25h`,
	home: `${ESC}H`,
	moveTo: (row: number, col: number) => `${ESC}${row};${col}H`,
	up: (n = 1) => `${ESC}${n}A`,
	down: (n = 1) => `${ESC}${n}B`,
	left: (n = 1) => `${ESC}${n}D`,
	right: (n = 1) => `${ESC}${n}C`,
};

export const clear = {
	screen: `${ESC}2J`,
	line: `${ESC}2K`,
};

export const screen = {
	alt: `${ESC}?1049h`,
	main: `${ESC}?1049l`,
};

export const fg = {
	black: `${ESC}30m`,
	red: `${ESC}31m`,
	green: `${ESC}32m`,
	yellow: `${ESC}33m`,
	blue: `${ESC}34m`,
	magenta: `${ESC}35m`,
	cyan: `${ESC}36m`,
	white: `${ESC}37m`,
	default: `${ESC}39m`,
	gray: `${ESC}90m`,
};

export const bg = {
	black: `${ESC}40m`,
	red: `${ESC}41m`,
	green: `${ESC}42m`,
	yellow: `${ESC}43m`,
	blue: `${ESC}44m`,
	magenta: `${ESC}45m`,
	cyan: `${ESC}46m`,
	white: `${ESC}47m`,
	default: `${ESC}49m`,
};

export const style = {
	reset: `${ESC}0m`,
	bold: `${ESC}1m`,
	dim: `${ESC}2m`,
	italic: `${ESC}3m`,
	underline: `${ESC}4m`,
	inverse: `${ESC}7m`,
};

export type Align = "left" | "right" | "center";

export interface BorderStyle {
	topLeft: string;
	topRight: string;
	bottomLeft: string;
	bottomRight: string;
	horizontal: string;
	vertical: string;
}

export interface BoxOptions {
	title?: string;
	borderStyle?: BorderStyle;
	style?: string;
}

const DEFAULT_BORDER_STYLE: BorderStyle = {
	topLeft: "+",
	topRight: "+",
	bottomLeft: "+",
	bottomRight: "+",
	horizontal: "-",
	vertical: "|",
};

export function styled(text: string, ...styles: string[]): string {
	if (styles.length === 0) {
		return text;
	}

	return `${styles.join("")}${text}${style.reset}`;
}

function applyLineStyle(line: string, lineStyle?: string): string {
	if (!lineStyle) {
		return line;
	}

	return `${lineStyle}${line}${style.reset}`;
}

export function drawBox(
	row: number,
	col: number,
	width: number,
	height: number,
	options: BoxOptions = {}
): string {
	if (width < 2 || height < 2) {
		return "";
	}

	const border = options.borderStyle ?? DEFAULT_BORDER_STYLE;
	const innerWidth = Math.max(0, width - 2);
	const lines: string[] = [];

	let topLine = `${border.topLeft}${border.horizontal.repeat(innerWidth)}${border.topRight}`;
	if (options.title && innerWidth >= 2) {
		const titleText = truncate(options.title, innerWidth - 2, "");
		const titleSegment = ` ${titleText} `;
		const remaining = Math.max(0, innerWidth - titleSegment.length);
		topLine = `${border.topLeft}${titleSegment}${border.horizontal.repeat(remaining)}${border.topRight}`;
	}

	lines.push(`${cursor.moveTo(row, col)}${applyLineStyle(topLine, options.style)}`);

	for (let offset = 1; offset < height - 1; offset += 1) {
		const midLine = `${border.vertical}${" ".repeat(innerWidth)}${border.vertical}`;
		lines.push(`${cursor.moveTo(row + offset, col)}${applyLineStyle(midLine, options.style)}`);
	}

	const bottomLine = `${border.bottomLeft}${border.horizontal.repeat(innerWidth)}${border.bottomRight}`;
	lines.push(`${cursor.moveTo(row + height - 1, col)}${applyLineStyle(bottomLine, options.style)}`);

	return lines.join("");
}

export function truncate(text: string, maxWidth: number, ellipsis = "..."): string {
	if (maxWidth <= 0) {
		return "";
	}

	if (text.length <= maxWidth) {
		return text;
	}

	if (maxWidth <= ellipsis.length) {
		return ellipsis.slice(0, maxWidth);
	}

	return `${text.slice(0, maxWidth - ellipsis.length)}${ellipsis}`;
}

export function pad(text: string, width: number, align: Align = "left"): string {
	if (width <= 0) {
		return "";
	}

	const truncated = truncate(text, width, "");
	const padding = Math.max(0, width - truncated.length);
	if (padding === 0) {
		return truncated;
	}

	if (align === "right") {
		return `${" ".repeat(padding)}${truncated}`;
	}

	if (align === "center") {
		const left = Math.floor(padding / 2);
		const right = padding - left;
		return `${" ".repeat(left)}${truncated}${" ".repeat(right)}`;
	}

	return `${truncated}${" ".repeat(padding)}`;
}
