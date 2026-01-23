import { resolveKeybind } from "./input/keybinds.js";
import { parseInput } from "./input/parser.js";
import { cursor, screen } from "./render/ansi.js";
import { render } from "./render/renderer.js";
import { INITIAL_STATE, reducer } from "./state/reducer.js";
import type { Action, Command, TuiState } from "./types.js";

export type CommandHandlerResult = Action[] | AsyncIterable<Action>;

export type CommandHandler = (command: Command, state: TuiState) => Promise<CommandHandlerResult>;

export interface TuiDependencies {
	stdin: NodeJS.ReadStream;
	stdout: NodeJS.WriteStream;
	onCommand: CommandHandler;
	initialState?: Partial<TuiState>;
}

function isAsyncIterable(value: unknown): value is AsyncIterable<Action> {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as AsyncIterable<Action>)[Symbol.asyncIterator] === "function"
	);
}

function getScreenSize(stdout: NodeJS.WriteStream, fallback: TuiState["screenSize"]) {
	const rows = stdout.rows ?? fallback.rows;
	const cols = stdout.columns ?? fallback.cols;
	return {
		rows: rows > 0 ? rows : fallback.rows,
		cols: cols > 0 ? cols : fallback.cols,
	};
}

function selectedChatId(state: TuiState): number | null {
	const chat = state.chats[state.selectedChatIndex];
	return chat ? chat.id : null;
}

export function runTui(deps: TuiDependencies): Promise<void> {
	const { stdin, stdout, onCommand, initialState } = deps;

	return new Promise((resolve) => {
		let state: TuiState = { ...INITIAL_STATE, ...initialState };
		state = { ...state, screenSize: getScreenSize(stdout, state.screenSize) };

		let isRunning = true;
		const wasRaw = (stdin as { isRaw?: boolean }).isRaw ?? false;
		const canSetRaw = stdin.isTTY && typeof stdin.setRawMode === "function";
		let commandQueue = Promise.resolve();

		const renderState = () => {
			stdout.write(render(state));
		};

		const applyAction = (action: Action) => {
			state = reducer(state, action);
			renderState();
		};

		const applyActions = (actions: Action[]) => {
			if (actions.length === 0) {
				return;
			}
			state = actions.reduce(reducer, state);
			renderState();
		};

		const applyCommandResult = async (result: CommandHandlerResult) => {
			if (Array.isArray(result)) {
				for (const action of result) {
					applyAction(action);
				}
				return;
			}

			if (isAsyncIterable(result)) {
				for await (const action of result) {
					applyAction(action);
				}
			}
		};

		const cleanup = () => {
			stdin.removeListener("data", onData);
			stdout.removeListener("resize", onResize);
			if (canSetRaw) {
				stdin.setRawMode(wasRaw);
			}
			stdin.pause();
			stdout.write(`${screen.main}${cursor.show}`);
		};

		const requestQuit = () => {
			if (!isRunning) {
				return;
			}
			isRunning = false;
			cleanup();
			resolve();
		};

		const runCommand = async (command: Command) => {
			if (command.type === "QUIT") {
				requestQuit();
				return;
			}

			try {
				const result = await onCommand(command, state);
				await applyCommandResult(result);
			} catch (error) {
				const message = error instanceof Error ? error.message : "Unknown error";
				applyAction({ type: "SET_ERROR", error: message });
			}
		};

		const enqueueCommand = (command: Command) => {
			commandQueue = commandQueue.then(() => runCommand(command));
		};

		const handleResize = () => {
			const nextSize = getScreenSize(stdout, state.screenSize);
			state = reducer(state, { type: "RESIZE", rows: nextSize.rows, cols: nextSize.cols });
			renderState();
		};

		const handleInput = async (buffer: Buffer) => {
			if (!isRunning) {
				return;
			}

			const previousChat = selectedChatId(state);
			const event = parseInput(buffer);
			const { actions, commands } = resolveKeybind(event, state.mode);

			applyActions(actions);

			for (const command of commands) {
				if (command.type === "QUIT") {
					requestQuit();
					return;
				}
				enqueueCommand(command);
			}

			const nextChat = selectedChatId(state);
			if (nextChat !== null && nextChat !== previousChat) {
				enqueueCommand({ type: "LOAD_CHAT", chatId: nextChat });
			}
		};

		const onData = (data: Buffer) => {
			void handleInput(data);
		};

		const onResize = () => handleResize();

		if (canSetRaw) {
			stdin.setRawMode(true);
		}
		stdin.resume();
		stdout.write(screen.alt);
		renderState();

		stdin.on("data", onData);
		stdout.on("resize", onResize);
	});
}
