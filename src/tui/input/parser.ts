import type { InputEvent, KeyInfo, KeyName } from "../types.js";

const ESC = 0x1b;
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

export function parseInput(buffer: Buffer): InputEvent {
	const raw = buffer.toString("utf8");
	if (!raw) {
		return buildEvent(raw, { name: "char", char: "", ctrl: false, alt: false, shift: false });
	}

	if (buffer[0] === ESC) {
		if (raw.startsWith(CSI)) {
			const csiEvent = parseCsi(raw);
			if (csiEvent) {
				return csiEvent;
			}
		}

		if (raw.startsWith(SS3)) {
			const ss3Event = parseSs3(raw);
			if (ss3Event) {
				return ss3Event;
			}
		}

		if (raw.length > 1) {
			const altRaw = raw.slice(1);
			const altEvent = parseNonEscape(Buffer.from(altRaw, "utf8"), altRaw);
			return {
				...altEvent,
				key: {
					...altEvent.key,
					alt: true,
				},
			};
		}

		return buildEvent(raw, { name: "escape", ctrl: false, alt: false, shift: false });
	}

	return parseNonEscape(buffer, raw);
}
