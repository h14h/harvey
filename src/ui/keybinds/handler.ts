/**
 * Vim-style key handler for Harvey TUI.
 * Handles mode switching, key bindings, and multi-key sequences.
 */

import type {
  KeyAction,
  KeyBinding,
  KeyHandlerConfig,
  KeyHandlerState,
  InputEvent,
  Mode,
  FocusArea,
} from "./types.js";

/**
 * KeyHandler processes input events and dispatches actions based on
 * vim-style keybindings with mode support.
 */
export class KeyHandler {
  private bindings: Map<string, KeyBinding[]>;
  private onAction: (action: KeyAction) => void;
  private sequenceTimeout: number;
  private sequenceTimer: ReturnType<typeof setTimeout> | null = null;

  public state: KeyHandlerState;

  constructor(config: KeyHandlerConfig) {
    this.bindings = this.buildBindingMap(config.bindings);
    this.onAction = config.onAction;
    this.sequenceTimeout = config.sequenceTimeout ?? 500;
    this.state = {
      mode: "normal",
      focus: "chat-list",
      buffer: [],
      inSequence: false,
    };
  }

  /**
   * Build a map from key sequences to their bindings for fast lookup.
   */
  private buildBindingMap(bindings: KeyBinding[]): Map<string, KeyBinding[]> {
    const map = new Map<string, KeyBinding[]>();

    for (const binding of bindings) {
      const existing = map.get(binding.sequence) ?? [];
      existing.push(binding);
      map.set(binding.sequence, existing);
    }

    return map;
  }

  /**
   * Process an input event and dispatch the appropriate action.
   */
  public handleInput(event: InputEvent): void {
    // Build the sequence key for this event
    const sequenceKey = this.buildSequenceKey(event);

    // Clear any pending sequence timeout
    if (this.sequenceTimer) {
      clearTimeout(this.sequenceTimer);
      this.sequenceTimer = null;
    }

    // Try to match the full sequence (join buffer + new key without separator)
    const fullSequence = this.state.buffer.join("") + sequenceKey;
    const bindings = this.getBindingsForSequence(fullSequence);

    if (bindings.length > 0) {
      // Match found - execute the action
      const activeBinding = bindings.find((b) =>
        b.modes.includes(this.state.mode)
      );

      if (activeBinding) {
        this.executeAction(activeBinding.action);
      }

      // Clear the buffer after a match
      this.state.buffer = [];
      this.state.inSequence = false;
      return;
    }

    // Check if this could be the start of a sequence
    const potentialSequence = this.state.buffer.join("") + sequenceKey;
    const hasPotentialMatch = this.hasPotentialSequence(potentialSequence);

    if (hasPotentialMatch) {
      // Add to buffer and wait for more input
      this.state.buffer.push(sequenceKey);
      this.state.inSequence = true;

      // Set timeout to clear buffer if no more input
      this.sequenceTimer = setTimeout(() => {
        // Timeout - treat buffer as individual key presses
        this.flushBuffer();
      }, this.sequenceTimeout);
      return;
    }

    // No sequence match and no potential - handle as single key
    this.flushBuffer();
  }

  /**
   * Execute an action.
   */
  private executeAction(action: KeyAction): void {
    // Handle mode-switching actions specially
    switch (action) {
      case "enterInsertMode":
      case "enterInsertModeAppend":
        this.state.mode = "insert";
        break;
      case "enterNormalMode":
        this.state.mode = "normal";
        break;
      case "focusNext":
        this.cycleFocus(1);
        return;
      case "focusPrev":
        this.cycleFocus(-1);
        return;
      default:
        // Other actions are passed to the handler
        break;
    }

    this.onAction(action);
  }

  /**
   * Cycle through focus areas.
   */
  private cycleFocus(direction: number): void {
    const areas: FocusArea[] = ["chat-list", "message-view", "input"];
    const currentIndex = areas.indexOf(this.state.focus);
    const nextIndex =
      (currentIndex + direction + areas.length) % areas.length;
    this.state.focus = areas[nextIndex];
    this.onAction("focusNext");
  }

  /**
   * Flush the buffer by processing each key individually.
   */
  private flushBuffer(): void {
    for (const key of this.state.buffer) {
      const bindings = this.getBindingsForSequence(key);
      const activeBinding = bindings.find((b) =>
        b.modes.includes(this.state.mode)
      );

      if (activeBinding) {
        this.executeAction(activeBinding.action);
      }
    }

    this.state.buffer = [];
    this.state.inSequence = false;
  }

  /**
   * Get bindings for a specific sequence, considering the current mode.
   */
  private getBindingsForSequence(sequence: string): KeyBinding[] {
    const bindings = this.bindings.get(sequence) ?? [];
    return bindings.filter((b) => b.modes.includes(this.state.mode));
  }

  /**
   * Check if any potential sequence starts with the given prefix.
   */
  private hasPotentialSequence(prefix: string): boolean {
    for (const sequence of this.bindings.keys()) {
      if (sequence.startsWith(prefix) && sequence !== prefix) {
        // Verify at least one binding is valid in current mode
        const bindings = this.bindings.get(sequence) ?? [];
        if (bindings.some((b) => b.modes.includes(this.state.mode))) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Build a sequence key from an input event.
   * Maps Ink's key event format to our internal sequence format.
   */
  private buildSequenceKey(event: InputEvent): string {
    // Build modifier prefix first
    const parts: string[] = [];
    if (event.ctrl) parts.push("Ctrl");
    if (event.alt) parts.push("Alt");
    if (event.shift) parts.push("Shift");

    // Special key mapping from Ink's format
    if (event.key === "escape") return [...parts, "Escape"].join("+");
    if (event.key === "return" || event.key === "Enter") return [...parts, "Enter"].join("+");
    if (event.key === "backspace") return [...parts, "Backspace"].join("+");
    if (event.key === "tab") {
      // Shift+Tab is handled via shift flag, but explicit check here too
      if (event.shift && parts.includes("Shift")) {
        return parts.join("+");
      }
      return [...parts, "Tab"].join("+");
    }
    if (event.key === "upArrow") return [...parts, "ArrowUp"].join("+");
    if (event.key === "downArrow") return [...parts, "ArrowDown"].join("+");

    // Use input for regular characters, key for special keys
    if (event.input) {
      parts.push(event.input);
    } else if (event.key) {
      parts.push(event.key);
    }

    return parts.join("+");
  }

  /**
   * Set the current mode directly.
   */
  public setMode(mode: Mode): void {
    this.state.mode = mode;
  }

  /**
   * Set the current focus area directly.
   */
  public setFocus(focus: FocusArea): void {
    this.state.focus = focus;
  }

  /**
   * Get the current mode indicator for display.
   */
  public getModeIndicator(): string {
    return this.state.mode === "normal" ? "[NORMAL]" : "[INSERT]";
  }

  /**
   * Reset the handler to initial state.
   */
  public reset(): void {
    this.state = {
      mode: "normal",
      focus: "chat-list",
      buffer: [],
      inSequence: false,
    };
  }
}

/**
 * Create a key handler from Ink's useInput callback arguments.
 */
export function handleInkInput(
  input: string,
  key: { escape?: boolean; ctrl?: boolean; shift?: boolean; alt?: boolean },
  handler: KeyHandler
): void {
  handler.handleInput({
    input,
    key: key.escape
      ? "escape"
      : input || key.ctrl
      ? (key.ctrl ? "Ctrl" : "") + (key.shift ? "Shift" : "")
      : "",
    ctrl: key.ctrl ?? false,
    shift: key.shift ?? false,
    alt: key.alt ?? false,
  });
}
