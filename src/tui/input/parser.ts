import type { InputEvent, KeyInfo, KeyName } from "../types.js";

const CSI = "\x1b[";
const SS3 = "\x1bO";

const MODIFIER_MAP = new Map<number, { shift: boolean; alt: boolean; ctrl: boolean }>([
	[2, { shift: true, alt: false, ctrl: false }],
	[3, { shift: false, alt: true, ctrl: false }],
	[4, { shift: true, alt: true, ctrl: false }],
	[5, { shift: false, alt: false, ctrl: true }],
	[6, { shift: true, alt: false, ctrl: true }],
	[7, { shift: false, alt: true, ctrl: true }],
	[8, { shift: true, alt: true, ctrl: true }],
]);

const CSI_TILDE_KEYS: Record<number, KeyName | undefined> = {
	1: "home",
	2: undefined,
	3: "delete",
	4: "end",
	5: "pageup",
	6: "pagedown",
	7: "home",
	8: "end",
};

function buildEvent(raw: string, key: KeyInfo): InputEvent {
	return {
		key,
		raw,
	};
}

function emptyEvent(raw: string): InputEvent {
	return buildEvent(raw, { name: "char", char: "", ctrl: false, alt: false, shift: false });
}

function modifiersFromParams(params: number[]): { shift: boolean; alt: boolean; ctrl: boolean } {
	if (params.length < 2) {
		return { shift: false, alt: false, ctrl: false };
	}

	const modifierValue = params[params.length - 1] ?? 1;
	return MODIFIER_MAP.get(modifierValue) ?? { shift: false, alt: false, ctrl: false };
}

function parseControlCharacter(code: number): string {
	if (code === 0) {
		return " ";
	}

	return String.fromCharCode(code + 96);
}

function parseNonEscape(buffer: Buffer, raw: string): InputEvent {
	if (raw === "\r" || raw === "\n") {
		return buildEvent(raw, { name: "enter", ctrl: false, alt: false, shift: false });
	}

	if (raw === "\t") {
		return buildEvent(raw, { name: "tab", ctrl: false, alt: false, shift: false });
	}

	if (raw === "\x7f" || raw === "\x08") {
		return buildEvent(raw, { name: "backspace", ctrl: false, alt: false, shift: false });
	}

	const code = buffer[0] ?? 0;
	if (code > 0 && code < 32) {
		return buildEvent(raw, {
			name: "char",
			char: parseControlCharacter(code),
			ctrl: true,
			alt: false,
			shift: false,
		});
	}

	return buildEvent(raw, {
		name: "char",
		char: raw,
		ctrl: false,
		alt: false,
		shift: false,
	});
}

function parseCsi(raw: string): InputEvent | null {
	const body = raw.slice(CSI.length);
	if (body === "13;5u" || body === "27;5;13~") {
		return buildEvent(raw, { name: "enter", ctrl: true, alt: false, shift: false });
	}

	if (body === "Z") {
		return buildEvent(raw, { name: "tab", ctrl: false, alt: false, shift: true });
	}

	const match = body.match(/^(\d[\d;]*|)([A-Za-z~])$/);
	if (!match) {
		return null;
	}

	const params = match[1] ? match[1].split(";").map((value) => Number.parseInt(value, 10)) : [];
	const final = match[2];
	const { shift, alt, ctrl } = modifiersFromParams(params);

	if (final === "A") {
		return buildEvent(raw, { name: "up", ctrl, alt, shift });
	}
	if (final === "B") {
		return buildEvent(raw, { name: "down", ctrl, alt, shift });
	}
	if (final === "C") {
		return buildEvent(raw, { name: "right", ctrl, alt, shift });
	}
	if (final === "D") {
		return buildEvent(raw, { name: "left", ctrl, alt, shift });
	}
	if (final === "H") {
		return buildEvent(raw, { name: "home", ctrl, alt, shift });
	}
	if (final === "F") {
		return buildEvent(raw, { name: "end", ctrl, alt, shift });
	}
	if (final === "~") {
		const keyCode = params[0] ?? 0;
		const name = CSI_TILDE_KEYS[keyCode];
		if (name) {
			return buildEvent(raw, { name, ctrl, alt, shift });
		}
	}

	return null;
}

function parseSs3(raw: string): InputEvent | null {
	const final = raw[SS3.length];
	if (final === "A") {
		return buildEvent(raw, { name: "up", ctrl: false, alt: false, shift: false });
	}
	if (final === "B") {
		return buildEvent(raw, { name: "down", ctrl: false, alt: false, shift: false });
	}
	if (final === "C") {
		return buildEvent(raw, { name: "right", ctrl: false, alt: false, shift: false });
	}
	if (final === "D") {
		return buildEvent(raw, { name: "left", ctrl: false, alt: false, shift: false });
	}

	return null;
}

function readCodePoint(raw: string, index: number): { text: string; length: number } {
	const codePoint = raw.codePointAt(index);
	if (codePoint === undefined) {
		return { text: "", length: 1 };
	}
	const length = codePoint > 0xffff ? 2 : 1;
	return { text: raw.slice(index, index + length), length };
}

function parseCsiPrefix(raw: string): { event: InputEvent; length: number } | null {
	if (!raw.startsWith(CSI)) {
		return null;
	}
	// biome-ignore lint/suspicious/noControlCharactersInRegex: CSI sequences include the ESC byte prefix.
	const csiPattern = /^\x1b\[[0-9;]*[A-Za-z~]/;
	const match = raw.match(csiPattern);
	if (!match) {
		return null;
	}
	const sequence = match[0];
	const event = parseCsi(sequence);
	if (!event) {
		return null;
	}
	return { event, length: sequence.length };
}

function parseSs3Prefix(raw: string): { event: InputEvent; length: number } | null {
	if (!raw.startsWith(SS3) || raw.length < SS3.length + 1) {
		return null;
	}
	const sequence = raw.slice(0, SS3.length + 1);
	const event = parseSs3(sequence);
	if (!event) {
		return null;
	}
	return { event, length: sequence.length };
}

function parseEscapeSequence(raw: string): { event: InputEvent; length: number } {
	const csiEvent = parseCsiPrefix(raw);
	if (csiEvent) {
		return csiEvent;
	}
	const ss3Event = parseSs3Prefix(raw);
	if (ss3Event) {
		return ss3Event;
	}

	if (raw.length > 1 && raw[1] !== "\x1b") {
		const { text, length } = readCodePoint(raw, 1);
		const altEvent = parseNonEscape(Buffer.from(text, "utf8"), text);
		return {
			event: {
				...altEvent,
				raw: `${raw[0]}${text}`,
				key: {
					...altEvent.key,
					alt: true,
				},
			},
			length: 1 + length,
		};
	}

	return {
		event: buildEvent(raw[0] ?? "\x1b", {
			name: "escape",
			ctrl: false,
			alt: false,
			shift: false,
		}),
		length: 1,
	};
}

export function parseInputEvents(buffer: Buffer): InputEvent[] {
	const raw = buffer.toString("utf8");
	if (!raw) {
		return [emptyEvent(raw)];
	}

	const events: InputEvent[] = [];
	let index = 0;
	while (index < raw.length) {
		const char = raw[index];
		if (char === "\x1b") {
			const { event, length } = parseEscapeSequence(raw.slice(index));
			events.push(event);
			index += length;
			continue;
		}

		const { text, length } = readCodePoint(raw, index);
		events.push(parseNonEscape(Buffer.from(text, "utf8"), text));
		index += length;
	}

	return events;
}

export function parseInput(buffer: Buffer): InputEvent {
	return parseInputEvents(buffer)[0] ?? emptyEvent("");
}
