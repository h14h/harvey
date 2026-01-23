import { describe, expect, test } from "bun:test";
import { PassThrough } from "node:stream";
import { type CommandHandler, runTui } from "./loop.js";
import type { Action, Command, TuiState } from "./types.js";

class MockStdin extends PassThrough {
	isTTY = true;
	isRaw = false;
	setRawMode(value: boolean) {
		this.isRaw = value;
	}
}

class MockStdout extends PassThrough {
	columns = 80;
	rows = 24;
}

function stripAnsi(text: string): string {
	// biome-ignore lint/complexity/useRegexLiterals: avoid control characters in regex literals.
	const ansiPattern = new RegExp("\\u001b\\[[0-9;?]*[ -/]*[@-~]", "g");
	return text.replace(ansiPattern, "");
}

function pause(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

function createHarness() {
	const stdin = new MockStdin();
	const stdout = new MockStdout();
	const outputs: string[] = [];

	stdout.on("data", (chunk) => {
		outputs.push(chunk.toString());
	});

	return { stdin, stdout, outputs };
}

describe("runTui", () => {
	test("re-renders on resize events", async () => {
		const { stdin, stdout, outputs } = createHarness();
		const onCommand: CommandHandler = async () => [] as Action[];
		const run = runTui({
			stdin: stdin as unknown as NodeJS.ReadStream,
			stdout: stdout as unknown as NodeJS.WriteStream,
			onCommand,
		});

		await pause();
		const initialWrites = outputs.length;

		stdout.columns = 100;
		stdout.rows = 40;
		stdout.emit("resize");

		await pause();
		expect(outputs.length).toBeGreaterThan(initialWrites);

		stdin.write(Buffer.from("q"));
		await run;
	});

	test("quits and restores raw mode", async () => {
		const { stdin, stdout } = createHarness();
		const onCommand: CommandHandler = async () => [] as Action[];
		const run = runTui({
			stdin: stdin as unknown as NodeJS.ReadStream,
			stdout: stdout as unknown as NodeJS.WriteStream,
			onCommand,
		});

		await pause();
		expect(stdin.isRaw).toBe(true);

		stdin.write(Buffer.from("q"));
		await run;

		expect(stdin.isRaw).toBe(false);
	});

	test("handles input updates in insert mode", async () => {
		const { stdin, stdout, outputs } = createHarness();
		const onCommand: CommandHandler = async () => [] as Action[];
		const run = runTui({
			stdin: stdin as unknown as NodeJS.ReadStream,
			stdout: stdout as unknown as NodeJS.WriteStream,
			onCommand,
			initialState: { mode: "normal" } as Partial<TuiState>,
		});

		await pause();
		stdin.write(Buffer.from("i"));
		await pause();
		stdin.write(Buffer.from("A"));
		await pause();

		const latest = outputs.at(-1) ?? "";
		expect(stripAnsi(latest)).toContain("> A");

		stdin.write(Buffer.from("\u001b"));
		await pause();
		stdin.write(Buffer.from("q"));
		await run;
	});

	test("applies command actions", async () => {
		const { stdin, stdout, outputs } = createHarness();
		const onCommand: CommandHandler = async (command: Command) => {
			if (command.type === "SEND_MESSAGE") {
				const actions: Action[] = [{ type: "SET_ERROR", error: "sent" }];
				return actions;
			}
			return [];
		};
		const run = runTui({
			stdin: stdin as unknown as NodeJS.ReadStream,
			stdout: stdout as unknown as NodeJS.WriteStream,
			onCommand,
			initialState: { mode: "insert" } as Partial<TuiState>,
		});

		await pause();
		stdin.write(Buffer.from("\r"));
		await pause();

		const latest = outputs.at(-1) ?? "";
		expect(stripAnsi(latest)).toContain("sent");

		stdin.write(Buffer.from("\u001b"));
		await pause();
		stdin.write(Buffer.from("q"));
		await run;
	});
});
