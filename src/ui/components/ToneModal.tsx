/**
 * ToneModal - Modal for viewing and editing the global tone.
 */

import React, { useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { useModal, useInputTextActions } from "../store";

interface ToneModalProps {
  currentTone: string | null;
  onSave: (tone: string) => void;
}

/**
 * Modal component for managing the global tone (system-wide persona).
 *
 * Displays when activeModal is "edit-tone", allowing the user to view
 * and edit the global tone instructions.
 */
export function ToneModal({ currentTone, onSave }: ToneModalProps) {
  const { activeModal, modalInput, closeModal, appendModalInput, deleteModalInputChar, setModalInput } = useModal();
  const [isEditing, setIsEditing] = React.useState(false);

  const isVisible = activeModal === "edit-tone";

  // Initialize modal input with current tone when opening
  useEffect(() => {
    if (isVisible && !isEditing) {
      setModalInput(currentTone || "");
    }
  }, [isVisible, currentTone, isEditing, setModalInput]);

  // Handle input in the modal
  useInput((input, key) => {
    if (!isVisible) return;

    if (key.escape) {
      closeModal();
      setIsEditing(false);
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

    if (key.backspace || (key.ctrl && input === "h")) {
      deleteModalInputChar();
      return;
    }

    // Handle regular character input
    if (input) {
      appendModalInput(input);
    }
  }, { isActive: isVisible });

  if (!isVisible) {
    return null;
  }

  return (
    <Box
      position="absolute"
      top={2}
      left="center"
      width={60}
      height={16}
      borderStyle="round"
      borderColor="cyan"
      flexDirection="column"
      paddingX={1}
    >
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Global Tone
        </Text>
      </Box>

      {!isEditing ? (
        // View mode
        <>
          <Box marginBottom={1}>
            <Text dimColor>
              Current global tone (system-wide persona):
            </Text>
          </Box>

          <Box
            marginBottom={1}
            borderStyle="single"
            borderColor="gray"
            paddingX={1}
            width="100%"
            height={6}
          >
            {currentTone ? (
              <Text>{currentTone}</Text>
            ) : (
              <Text color="gray" dimColor>
                No global tone set. Press {"'"}e{"'"} to create one.
              </Text>
            )}
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
            <Text dimColor>
              Edit global tone:
            </Text>
          </Box>

          <Box
            marginBottom={1}
            borderStyle="single"
            borderColor="yellow"
            paddingX={1}
            width="100%"
            height={6}
          >
            <Text>{modalInput || "Type global tone instructions..."}</Text>
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
