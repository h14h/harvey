/**
 * AnchorModal - Modal for viewing and editing a chat's anchor prompt.
 */

import { Box, Text, useInput } from "ink";
import React, { useEffect } from "react";
import { useModal, useSelectedChat } from "../store";
import { isBackspace, isPrintableChar } from "../utils/input";

interface AnchorModalProps {
	onSave: (anchorPrompt: string) => void;
}

/**
 * Modal component for managing a chat's anchor prompt (role definition).
 *
 * Displays when activeModal is "edit-anchor", allowing the user to view
 * and edit the current chat's anchor prompt.
 */
export function AnchorModal({ onSave }: AnchorModalProps) {
	const {
		activeModal,
		modalInput,
		closeModal,
		appendModalInput,
		deleteModalInputChar,
		setModalInput,
	} = useModal();
	const selectedChat = useSelectedChat();
	const [isEditing, setIsEditing] = React.useState(false);

	const isVisible = activeModal === "edit-anchor";

	// Initialize modal input with current anchor when opening
	useEffect(() => {
		if (isVisible && !isEditing && selectedChat) {
			setModalInput(selectedChat.anchorPrompt || "");
		}
	}, [isVisible, selectedChat, isEditing, setModalInput]);

	// Handle input in the modal
	useInput(
		(input, key) => {
			if (!isVisible) return;

			if (key.escape) {
				closeModal();
				setIsEditing(false);
				return;
			}

			// Don't allow editing if no chat is selected
			if (!selectedChat) {
				closeModal();
				return;
			}

			// 'e' to enter edit mode
			if (!isEditing && input === "e") {
				setIsEditing(true);
				return;
			}

			// Ctrl+Enter to save
			if (key.return && key.ctrl) {
				if (modalInput.trim()) {
					onSave(modalInput.trim());
				}
				closeModal();
				setIsEditing(false);
				return;
			}

			// Only handle character input when in edit mode
			if (!isEditing) {
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

	if (!selectedChat) {
		return null;
	}

	return (
		<Box
			marginTop={2}
			marginLeft={10}
			width={60}
			height={16}
			borderStyle="round"
			borderColor="cyan"
			flexDirection="column"
			paddingX={1}
		>
			<Box marginBottom={1}>
				<Text bold color="cyan">
					Chat Anchor
				</Text>
				<Text color="gray"> ({selectedChat.title})</Text>
			</Box>

			{!isEditing ? (
				// View mode
				<>
					<Box marginBottom={1}>
						<Text dimColor>Anchor prompt for this chat:</Text>
					</Box>

					<Box
						marginBottom={1}
						borderStyle="single"
						borderColor="gray"
						paddingX={1}
						width="100%"
						height={6}
					>
						<Text>{selectedChat.anchorPrompt}</Text>
					</Box>

					<Box marginTop={1}>
						<Text color="gray" dimColor>
							Press {"'"}e{"'"} to edit • Esc to close
						</Text>
					</Box>
				</>
			) : (
				// Edit mode
				<>
					<Box marginBottom={1}>
						<Text dimColor>Edit anchor prompt:</Text>
					</Box>

					<Box
						marginBottom={1}
						borderStyle="single"
						borderColor="yellow"
						paddingX={1}
						width="100%"
						height={6}
					>
						<Text>{modalInput || "Type anchor prompt..."}</Text>
						<Text color="yellow">█</Text>
					</Box>

					<Box marginTop={1}>
						<Text color="gray" dimColor>
							Ctrl+Enter: save • Esc: cancel
						</Text>
					</Box>
				</>
			)}
		</Box>
	);
}
