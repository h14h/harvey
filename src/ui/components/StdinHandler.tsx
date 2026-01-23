/**
 * StdinHandler - Handles stdin input for the Harvey TUI.
 *
 * This component sets up raw mode on stdin and processes keypresses,
 * forwarding them to the KeyHandler for keybind resolution.
 */

import { useStdin } from "ink";
import { useEffect } from "react";
import { handleStdinKey } from "../app";

/**
 * Component that sets up global stdin handling.
 *
 * This is a renderless component - it doesn't render anything to the UI.
 * It only sets up side effects for stdin processing.
 */
export function StdinHandler(): null {
	const { stdin, setRawMode, isRawModeSupported } = useStdin();

	useEffect(() => {
		if (!isRawModeSupported) {
			return;
		}

		setRawMode(true);

		const handleData = (data: Buffer) => {
			const str = data.toString();
			const key: Record<string, boolean> = {
				escape: str === "\x1b",
				ctrl: str.length === 1 && data[0] !== undefined && data[0] < 32,
				shift: false,
				alt: false,
			};

			// Handle special keys
			if (str === "\r") {
				handleStdinKey("", { ...key, return: true });
			} else if (str === "\x7f") {
				handleStdinKey("", { ...key, backspace: true });
			} else if (str.startsWith("\x1b[")) {
				// ANSI escape sequences
				const code = str.slice(2);

				// Arrow keys
				if (code === "A") {
					handleStdinKey("", { ...key, upArrow: true });
				} else if (code === "B") {
					handleStdinKey("", { ...key, downArrow: true });
				} else if (code === "C") {
					handleStdinKey("", { ...key, rightArrow: true });
				} else if (code === "D") {
					handleStdinKey("", { ...key, leftArrow: true });
				}
				// Ctrl+Enter escape sequences (bug #41)
				// xterm extended keys: \x1b[13;5u (Enter=13, Ctrl modifier=5)
				// CSI format: \x1b[27;5;13~ or similar
				else if (code === "13;5u" || code.match(/^27;5;13~?$/) || code.match(/^13;5~$/)) {
					handleStdinKey("", { ...key, return: true, ctrl: true });
				}
				// Silently ignore other escape sequences to prevent garbage input
			} else {
				handleStdinKey(str, key);
			}
		};

		stdin.on("data", handleData);

		return () => {
			stdin.off("data", handleData);
		};
	}, [stdin, setRawMode, isRawModeSupported]);

	return null;
}
