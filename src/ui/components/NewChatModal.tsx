/**
 * NewChatModal - Modal for creating a new chat with anchor prompt.
 */

import { Box, Text, useInput } from "ink";
import { useModal } from "../store";
import { isBackspace, isPrintableChar } from "../utils/input";

interface NewChatModalProps {
	onSubmit: (anchorPrompt: string) => void;
}

/**
 * Modal component for creating a new chat.
 *
 * Displays when activeModal is "new-chat", allowing the user to input
 * an anchor prompt that defines the AI's role for the new chat.
 */
export function NewChatModal({ onSubmit }: NewChatModalProps) {
	const { activeModal, modalInput, closeModal, appendModalInput, deleteModalInputChar } =
		useModal();

	const isVisible = activeModal === "new-chat";

	// Handle input in the modal
	useInput(
		(input, key) => {
			if (!isVisible) return;

			if (key.escape) {
				closeModal();
				return;
			}

			if (key.return && (input === "\r" || key.ctrl)) {
				// Ctrl+Enter or Enter to submit
				if (modalInput.trim()) {
					onSubmit(modalInput.trim());
					closeModal();
				}
				return;
			}

			if (isBackspace(input, key)) {
				deleteModalInputChar();
				return;
			}

			// Handle regular character input (ignore control characters)
			if (isPrintableChar(input)) {
				appendModalInput(input);
			}
		},
		{ isActive: isVisible }
	);

	if (!isVisible) {
		return null;
	}

	return (
		<Box
			marginTop={2}
			marginLeft={10}
			width={60}
			height={15}
			borderStyle="round"
			borderColor="cyan"
			flexDirection="column"
			paddingX={1}
		>
			<Box marginBottom={1}>
				<Text bold color="cyan">
					Create New Chat
				</Text>
			</Box>

			<Box marginBottom={1}>
				<Text dimColor>Enter the anchor prompt (role definition for the AI):</Text>
			</Box>

			<Box marginBottom={1}>
				<Text color="gray">Examples:</Text>
			</Box>

			<Box flexDirection="column" marginBottom={1} paddingX={2}>
				<Text color="gray" dimColor>
					• "You are a helpful Python programming assistant"
				</Text>
				<Text color="gray" dimColor>
					• "You are a creative writing partner"
				</Text>
				<Text color="gray" dimColor>
					• "You are a code reviewer focused on security"
				</Text>
			</Box>

			<Box marginTop={1} borderStyle="single" borderColor="yellow" paddingX={1} width="100%">
				<Text color="yellow">{modalInput || "Type anchor prompt..."}</Text>
				<Text color="yellow">█</Text>
			</Box>

			<Box marginTop={1}>
				<Text color="gray" dimColor>
					Esc: cancel • Ctrl+Enter: submit
				</Text>
			</Box>
		</Box>
	);
}
