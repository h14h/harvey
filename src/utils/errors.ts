/**
 * Error logging utility for Harvey.
 *
 * Logs errors to a file for debugging purposes.
 */

import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const logDir = () => {
	const homeDir = process.env.HOME ?? Bun.env.HOME ?? ".";
	return join(homeDir, ".local", "share", "harvey");
};

const logFilePath = () => join(logDir(), "errors.log");

/**
 * Ensure log directory exists.
 */
function ensureLogDir(): void {
	const dir = logDir();
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
}

/**
 * Format error for logging.
 */
function formatError(error: unknown, context?: string): string {
	const timestamp = new Date().toISOString();

	if (error instanceof Error) {
		const name = error.name;
		const message = error.message;
		const stack = error.stack?.split("\n").join("\n  ") || "No stack trace";
		const ctx = context ? `\nContext: ${context}` : "";
		return `[${timestamp}] ${name}: ${message}${ctx}\n  Stack: ${stack}\n`;
	}

	if (typeof error === "string") {
		const ctx = context ? `\nContext: ${context}` : "";
		return `[${timestamp}] Error: ${error}${ctx}\n`;
	}

	const ctx = context ? `\nContext: ${context}` : "";
	return `[${timestamp}] Unknown error: ${JSON.stringify(error)}${ctx}\n`;
}

/**
 * Log an error to the error log file.
 */
export function logError(error: unknown, context?: string): void {
	try {
		ensureLogDir();
		const logMessage = formatError(error, context);
		appendFileSync(logFilePath(), logMessage, "utf-8");
	} catch (e) {
		// Silently fail if we can't log errors
		console.error("Failed to log error:", e);
	}
}

/**
 * Get user-friendly error message for common error types.
 */
export function getUserFriendlyMessage(error: unknown): string {
	if (error instanceof Error) {
		const message = error.message.toLowerCase();

		// API key errors
		if (
			message.includes("api key") ||
			message.includes("authentication") ||
			message.includes("unauthorized")
		) {
			return "Invalid or missing API key. Please check your config file.";
		}

		// Rate limiting
		if (message.includes("rate limit") || message.includes("429")) {
			return "Rate limited. Please wait a moment and try again.";
		}

		// Database errors - check before network/connection errors
		if (message.includes("database") || message.includes("sql")) {
			return "Database error. Please check your data directory permissions.";
		}

		// Network errors
		if (message.includes("network") || message.includes("econnrefused")) {
			return "Network error. Please check your connection and try again.";
		}

		// Connection errors - generic (but not database connection)
		if (message.includes("connection") && !message.includes("database")) {
			return "Connection error. Please check your connection and try again.";
		}

		// Model errors
		if (message.includes("model") || message.includes("not found")) {
			return "AI model error. The requested model may not be available.";
		}

		// Configuration errors
		if (message.includes("config") || message.includes("parse")) {
			return "Configuration error. Please check your config file format.";
		}

		// Return original message for unknown errors
		return error.message;
	}

	if (typeof error === "string") {
		return error;
	}

	return "An unknown error occurred. Please check the error log for details.";
}

/**
 * Get actionable suggestion for error recovery.
 */
export function getRecoverySuggestion(error: unknown): string | null {
	if (error instanceof Error) {
		const message = error.message.toLowerCase();

		// API key errors
		if (message.includes("api key") || message.includes("authentication")) {
			return "Run 'harvey config' to update your API key.";
		}

		// Rate limiting
		if (message.includes("rate limit")) {
			return "Wait a few seconds, then try again.";
		}

		// Network errors
		if (message.includes("network") || message.includes("connection")) {
			return "Check your internet connection and try again.";
		}

		// Database errors
		if (message.includes("database") || message.includes("permission")) {
			return "Ensure ~/.local/share/harvey exists and is writable.";
		}

		// Configuration errors
		if (message.includes("config")) {
			return "Run 'harvey config' to create or update your config.";
		}
	}

	return null;
}
