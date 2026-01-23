/**
 * Harvey - CLI application for long-running AI conversations.
 */

import { render, useStdin } from "ink";
import { HarveyApp, handleStdinKey } from "./ui/app";

render(<HarveyApp />);

// Set up stdin hook for key handling
useStdin(({ stdin, setRawMode }) => {
  setRawMode(true);
  stdin.on("data", (data: Buffer) => {
    const str = data.toString();
    const key: Record<string, boolean> = {
      escape: str === "\x1b",
      ctrl: str.length === 1 && data[0] < 32,
      shift: false,
      alt: false,
    };

    // Handle special keys
    if (str === "\r") {
      handleStdinKey("", { ...key, return: true });
    } else if (str === "\x7f") {
      handleStdinKey("", { ...key, backspace: true });
    } else if (str.startsWith("\x1b[")) {
      // ANSI escape sequences for arrows
      const code = str.slice(2);
      if (code === "A") {
        handleStdinKey("", { ...key, upArrow: true });
      } else if (code === "B") {
        handleStdinKey("", { ...key, downArrow: true });
      } else if (code === "C") {
        handleStdinKey("", { ...key, rightArrow: true });
      } else if (code === "D") {
        handleStdinKey("", { ...key, leftArrow: true });
      }
    } else {
      handleStdinKey(str, key);
    }
  });
});
