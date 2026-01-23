/**
 * InputArea - Bottom area for typing messages.
 */

import { Box, Text } from "ink";
import { useInputText, useFocus, useMode } from "../store";

export interface InputAreaProps {
  prompt?: string;
}

/**
 * Input area component for message composition.
 */
export function InputArea({ prompt = ">" }: InputAreaProps) {
  const inputText = useInputText();
  const focus = useFocus();
  const mode = useMode();

  const isFocused = focus === "input" || mode === "insert";
  const borderColor = isFocused ? "green" : "gray";

  // Truncate input if too long for display
  const maxDisplayLength = Math.max(20, (process.stdout.columns || 80) - 10);
  const displayText =
    inputText.length > maxDisplayLength
      ? "..." + inputText.slice(-(maxDisplayLength - 3))
      : inputText;

  return (
    <Box
      borderStyle="round"
      borderColor={borderColor}
      paddingX={1}
      marginTop={1}
    >
      <Text color={isFocused ? "yellow" : "gray"} bold>
        {prompt}{" "}
      </Text>
      {inputText.length > 0 ? (
        <Text>{displayText}</Text>
      ) : (
        <Text color="gray" dimColor>
          Type a message...
        </Text>
      )}
      {isFocused && <Text block>█</Text>}
    </Box>
  );
}
