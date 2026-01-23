/**
 * Toast - Toast notification for displaying transient messages.
 */

import { Box, Text } from "ink";
import { useEffect, useState } from "react";

export type ToastType = "info" | "success" | "warning" | "error";

export interface ToastProps {
	message: string;
	type?: ToastType;
	duration?: number;
	onDismiss?: () => void;
}

/**
 * Get color for toast type.
 */
function getToastColor(type: ToastType): string {
	switch (type) {
		case "success":
			return "green";
		case "warning":
			return "yellow";
		case "error":
			return "red";
		default:
			return "blue";
	}
}

/**
 * Get icon for toast type.
 */
function getToastIcon(type: ToastType): string {
	switch (type) {
		case "success":
			return "✓";
		case "warning":
			return "⚠";
		case "error":
			return "✖";
		default:
			return "ℹ";
	}
}

/**
 * Toast notification component.
 *
 * Displays a transient message that auto-dismisses after a duration.
 * Used for errors, warnings, and other notifications.
 */
export function Toast({ message, type = "info", duration = 3000, onDismiss }: ToastProps) {
	const [visible, setVisible] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			setVisible(false);
			onDismiss?.();
		}, duration);

		return () => clearTimeout(timer);
	}, [duration, onDismiss]);

	if (!visible) {
		return null;
	}

	const color = getToastColor(type);
	const icon = getToastIcon(type);

	return (
		<Box marginTop={1} marginLeft={40} paddingX={1} borderStyle="round" borderColor={color}>
			<Text color={color} bold>
				{icon} {message}
			</Text>
		</Box>
	);
}

/**
 * Hook for managing toasts.
 */
export function useToasts() {
	const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastType }>>([]);

	const show = (message: string, type: ToastType = "info") => {
		const id = Date.now();
		setToasts((prev) => [...prev, { id, message, type }]);
	};

	const dismiss = (id: number) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	};

	const info = (message: string) => show(message, "info");
	const success = (message: string) => show(message, "success");
	const warning = (message: string) => show(message, "warning");
	const error = (message: string) => show(message, "error");

	return {
		toasts,
		show,
		dismiss,
		info,
		success,
		warning,
		error,
	};
}
