/**
 * fzf integration utilities for fuzzy search.
 */

import type { Chat } from "../types";

export interface FzfSearchResult {
	/** The selected chat, or null if cancelled/not found */
	chat: Chat | null;
	/** Whether an error occurred (e.g., fzf not installed) */
	error: boolean;
	/** Error message if an error occurred */
	errorMessage?: string;
}

/**
 * Search chats using fzf fuzzy finder.
 *
 * @param chats - Array of chats to search
 * @returns Result containing selected chat or error info
 *
 * @example
 * ```ts
 * const result = await searchChatsWithFzf(chats);
 * if (result.error) {
 *   console.error(result.errorMessage);
 *   return;
 * }
 * if (result.chat) {
 *   console.log("Selected:", result.chat.title);
 * }
 * ```
 */
export async function searchChatsWithFzf(chats: Chat[]): Promise<FzfSearchResult> {
	if (chats.length === 0) {
		return {
			chat: null,
			error: false,
		};
	}

	// Format chats for fzf: "id:title"
	const input = chats.map((c) => `${c.id}:${c.title}`).join("\n");

	try {
		// Spawn fzf with input
		const proc = Bun.spawn(["fzf", "--prompt=Search chats: ", "--height=50%"], {
			stdin: "pipe",
			stdout: "pipe",
			stderr: "pipe",
		});

		// Write input to fzf's stdin
		const writer = proc.stdin.getWriter();
		await writer.write(new TextEncoder().encode(input));
		await writer.close();

		// Wait for fzf to exit
		const exitCode = await proc.exited;

		// User cancelled (fzf returns non-zero exit code on cancel)
		if (exitCode !== 0) {
			return {
				chat: null,
				error: false,
			};
		}

		// Read the output
		const output = await new Response(proc.stdout).text();

		if (!output || !output.trim()) {
			return {
				chat: null,
				error: false,
			};
		}

		// Parse selection: "id:title"
		const trimmedOutput = output.trim();
		const colonIndex = trimmedOutput.indexOf(":");

		if (colonIndex === -1) {
			return {
				chat: null,
				error: true,
				errorMessage: "Invalid fzf output format",
			};
		}

		const selectedId = parseInt(trimmedOutput.slice(0, colonIndex), 10);

		if (Number.isNaN(selectedId)) {
			return {
				chat: null,
				error: true,
				errorMessage: "Invalid chat ID from fzf",
			};
		}

		const selectedChat = chats.find((c) => c.id === selectedId) ?? null;

		return {
			chat: selectedChat,
			error: false,
		};
	} catch (error) {
		// Check if fzf is not installed
		const errorMessage = error instanceof Error ? error.message : String(error);

		// Check for various "not found" error patterns
		const isNotFoundError =
			errorMessage.includes("ENOENT") ||
			errorMessage.includes("not found") ||
			errorMessage.includes("No such file") ||
			errorMessage.includes("executable") ||
			errorMessage.includes("fzf");

		if (isNotFoundError) {
			return {
				chat: null,
				error: true,
				errorMessage:
					"fzf not found. Please install fzf to use chat search.\n" +
					"  https://github.com/junegunn/fzf#installation",
			};
		}

		return {
			chat: null,
			error: true,
			errorMessage: `Search failed: ${errorMessage}`,
		};
	}
}

/**
 * Check if fzf is available on the system.
 *
 * @returns true if fzf is installed and executable
 */
export async function isFzfAvailable(): Promise<boolean> {
	try {
		const proc = Bun.spawn(["fzf", "--version"], {
			stdout: "pipe",
			stderr: "pipe",
		});

		const exitCode = await proc.exited;
		return exitCode === 0;
	} catch {
		return false;
	}
}
