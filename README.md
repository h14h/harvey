# Harvey

<p align="center">
  <em>CLI application for long-running AI conversations with intelligent context management</em>
</p>

## Overview

Harvey is a terminal UI (TUI) application for having long-running conversations with AI assistants. It intelligently manages conversation context by summarizing old messages when token limits are approached, allowing you to maintain context over thousands of messages without losing important information.

### Key Features

- **Persistent Chat History**: Save conversations across sessions
- **Intelligent Summarization**: Automatically summarizes old messages when context limits are reached
- **Context Usage Indicators**: Real-time visibility into token usage
- **Chat Anchors**: Define role/persona for each conversation
- **Global Tone**: Set system-wide instructions for all conversations
- **Vim-Style Navigation**: Familiar keybindings for efficient navigation
- **Streaming Responses**: See AI responses in real-time
- **Error Recovery**: Graceful error handling with actionable suggestions

## Installation

### Prerequisites

- [Bun](https://bun.sh) >= 1.0.0
- OpenAI API key

### Quick Install

```bash
# Clone the repository
git clone https://github.com/h14h/harvey.git
cd harvey

# Install dependencies
bun install

# Run Harvey
bun start
```

For detailed installation instructions, see the [Installation Guide](./docs/installation.md) (TODO).

## Configuration

Configuration is stored in `~/.config/harvey/config.toml`:

```toml
[harvey]
# OpenAI API configuration
openai_api_key = "sk-..."

# Database location
database_path = "~/.local/share/harvey/harvey.db"

# Summarization frequency (turns between regenerations)
summarization_frequency = 6
```

## Quick Start

1. **Create a configuration file** with your OpenAI API key:
   ```bash
   # Create config directory if needed
   mkdir -p ~/.config/harvey
   echo '[harvey]\nopenai_api_key = "sk-..."' > ~/.config/harvey/config.toml
   ```

2. **Start Harvey**:
   ```bash
   bun start
   ```

3. **Create a new chat**:
   - Press `n` to open the new chat modal
   - Enter an anchor prompt (role definition like "You are a helpful Python expert")
   - Press Ctrl+Enter to create

4. **Start chatting**:
   - Press `i` to enter insert mode
   - Type your message
   - Press Enter to send

## Usage

### Interface Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Harvey - Chat: My Python Help Session              [NORMAL] │
├─────────────────────────────────────────────────────────────┤
│┌──────────────┬──────────────────────────────────┐            │
│ Chats          │ Messages                        │            │
│                │                                  │            │
│  [Chats]        │ User: How do I sort a list?       │            │
│  [My Python]     │                                  │            │
│  [Code Help]     │ Assistant: You can use the ...    │            │
│                │                                  │            │
│└──────────────┴──────────────────────────────────┘            │
├─────────────────────────────────────────────────────────────┤
│ > Type a message...                                               │
└─────────────────────────────────────────────────────────────┘
```

### Keybind Reference

| Mode | Key | Action |
|------|-----|--------|
| **Navigation** | `j` | Move down (chat list / messages) |
| | `k` | Move up |
| | `h` | Move left (to chat list) |
| | `l` | Move right (to message view) |
| | `gg` | Jump to top |
| | `G` | Jump to bottom |
| | `Tab` | Cycle focus forward |
| | `Shift+Tab` | Cycle focus backward |
| **Chats** | `n` | Create new chat |
| | `dd` | Delete current chat |
| **Input** | `i` | Enter insert mode |
| | `a` | Append mode |
| | `Esc` | Return to normal mode |
| | `Enter` | Send message |
| | `Ctrl+Enter` | New line in message |
| | `Ctrl+w` | Delete word |
| | `Ctrl+u` | Clear input |
| **Tone/Anchor** | `t` | Edit global tone |
| | `a` | Edit chat anchor |
| **Other** | `q` | Quit |
| | `?` | Show help |

For complete keybind documentation, see [Keybinds](./wiki/Keybinds.md).

### Creating Chats

1. Press `n` to open the new chat modal
2. Enter an **anchor prompt** - this defines the AI's role for this conversation:
   - "You are a helpful Python programming assistant"
   - "You are a creative writing partner helping with fiction"
   - "You are a code reviewer focused on security"

3. Press Ctrl+Enter to create the chat

### Managing Tone and Anchors

**Global Tone** (applies to all chats):
- Press `t` to open the tone modal
- Press `e` to enter edit mode
- Modify the global instructions
- Press Ctrl+Enter to save

**Chat Anchor** (per-chat role definition):
- Press `a` when a chat is selected
- Press `e` to edit the anchor prompt
- Press Ctrl+Enter to save

## How It Works

Harvey uses a **tiered summarization** approach to manage context:

1. **Global Tone Summary** (~100 tokens)
   - System-wide instructions for all conversations
   - Stored in global config

2. **Anchor Summary** (~200 tokens)
   - Role definition for each chat
   - Generated from the anchor prompt using OpenAI

3. **History Summary** (~400 tokens)
   - Condensed conversation history
   - Regenerated every N turns (default: 6)

When sending a message, Harvey assembles context in this priority order:
```
[Global Tone] → [Anchor Summary] → [History Summary] → [Recent Messages] → [Current Message]
```

### Context Usage Indicators

The status bar shows real-time token usage:
- `T:95/100` - Global tone tokens
- `A:180/200` - Anchor tokens
- `H:350/400` - History summary tokens
- `Turn 5/6` - Current turn / summarization threshold

Colors indicate status:
- Green: < 80% usage
- Yellow: 80-99% usage (regeneration soon)
- Red: >= 100% usage (regeneration needed)

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/h14h/harvey.git
cd harvey

# Install dependencies
bun install

# Run tests
bun test

# Start in development mode
bun dev
```

### Project Structure

```
harvey/
├── src/
│   ├── index.tsx           # Entry point
│   ├── types/              # TypeScript types
│   ├── db/                 # Database schema and repositories
│   ├── services/           # Business logic
│   ├── ui/                 # TUI components
│   │   ├── components/      # UI components
│   │   ├── hooks/           # Custom hooks
│   │   └── store/           # State management
│   ├── keybinds/           # Keybinding system
│   ├── config/             # Configuration management
│   └── utils/              # Utilities
├── wiki/                   # Documentation
├── tests/                  # Integration tests
└── docs/                   # Additional documentation
```

### Running Tests

```bash
# Run all tests
bun test

# Run with file watching
bun test --watch
```

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Built with [Ink](https://github.com/vadimdemedes/ink) - React for CLIs
- Uses [OpenAI API](https://openai.com/) - AI completions
- Token counting via [js-tiktoken](https://github.com/dqbdjve/openai-tiktoken) - Byte pair encoding
