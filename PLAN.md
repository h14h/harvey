# Harvey - Implementation Plan

## Project Overview
Harvey is a CLI application for long-running AI conversations with intelligent context management. The goal is to maintain on-topic conversations through automatic summarization and strategic context windowing.

## Core Features
- Long-running conversations that stay on topic
- Automatic context summarization with token targets
- Vim-inspired TUI interface
- Chat creation with guided setup
- Fuzzy search across chats (via fzf)
- Per-chat "anchor" prompts (role definition)
- Global "tone" system prompt
- Automatic title generation and updates

## Context Management Strategy
Each API call to OpenAI includes:
1. **Global tone summary** (~100 tokens) - Compressed user's global system prompt
2. **Chat anchor summary** (~200 tokens) - Compressed role/purpose for this chat
3. **History summary** (~400 tokens) - Compressed older conversation context
4. **Last 4 turns** (full messages) - Recent conversation window (8 messages total)

Summaries and titles regenerate every 6 turns by default (configurable).

## Technology Stack
- **Runtime**: Bun
- **Language**: TypeScript
- **Storage**: SQLite (better-sqlite3)
- **TUI Framework**: TBD (ink, blessed, or custom)
- **Fuzzy Search**: fzf (external dependency)
- **Config Location**: `~/.config/harvey/config.json`

## Configuration (MVP)
The config file supports:
1. `openai_api_key` - OpenAI API authentication
2. `turn_frequency` - How often to regenerate titles/summaries (default: 6)

## Implementation Tasks

### Phase 1: Foundation
- [x] Initialize Bun project with TypeScript
- [ ] Set up project structure (src/, types/, utils/)
- [ ] Install core dependencies (better-sqlite3, openai)
- [ ] Define TypeScript types for core domain models
- [ ] Create database schema and migrations
- [ ] Implement database initialization and connection

### Phase 2: Core Logic
- [ ] Build config file management system
  - [ ] Read/write `~/.config/harvey/config.json`
  - [ ] Handle config validation and defaults
  - [ ] Create config initialization on first run
- [ ] Implement OpenAI API integration
  - [ ] Set up OpenAI client with API key from config
  - [ ] Create message formatting for API calls
  - [ ] Handle streaming responses
  - [ ] Error handling and retries
- [ ] Build context assembly system
  - [ ] Fetch and combine summaries + recent messages
  - [ ] Implement token counting
  - [ ] Assemble context in correct order for API

### Phase 3: Summarization & Titles
- [ ] Implement automatic summarization
  - [ ] Global tone summarization (~100 tokens)
  - [ ] Anchor prompt summarization (~200 tokens)
  - [ ] History summarization (~400 tokens)
  - [ ] Track turn numbers to trigger regeneration
- [ ] Implement title generation
  - [ ] Generate initial title from anchor prompt
  - [ ] Regenerate title every N turns from context
  - [ ] Store titles in database

### Phase 4: Data Layer
- [ ] Create Chat repository/service
  - [ ] CRUD operations for chats
  - [ ] Fetch chat with messages and summaries
  - [ ] Update titles and summaries
- [ ] Create Message repository/service
  - [ ] Save user and assistant messages
  - [ ] Fetch last N turns for context window
  - [ ] Track turn numbers
- [ ] Create Summary repository/service
  - [ ] Store generated summaries
  - [ ] Fetch latest summary by type and chat
- [ ] Create GlobalConfig repository/service
  - [ ] Store and retrieve global tone
  - [ ] Store and retrieve global tone summary

### Phase 5: TUI Interface
- [ ] Choose and set up TUI framework
- [ ] Build main application layout
  - [ ] Chat list sidebar
  - [ ] Message display area
  - [ ] Input area
  - [ ] Status bar
- [ ] Implement vim keybinds
  - [ ] Navigation (j/k, gg/G, etc.)
  - [ ] Mode switching (normal/insert)
  - [ ] Chat selection and switching
- [ ] Build new chat creation flow
  - [ ] Guided prompts for anchor setup
  - [ ] Save new chat to database
- [ ] Implement chat interface
  - [ ] Display messages with proper formatting
  - [ ] Send messages and show responses
  - [ ] Show loading/streaming indicators
- [ ] Add global tone management UI
  - [ ] Set/edit global tone
  - [ ] Trigger manual summarization
- [ ] Add per-chat anchor management UI
  - [ ] View/edit chat anchor
  - [ ] Trigger manual summarization

### Phase 6: Search & Polish
- [ ] Integrate fzf for chat search
  - [ ] Generate searchable list of chat titles
  - [ ] Spawn fzf process and capture selection
  - [ ] Navigate to selected chat
- [ ] Add context usage indicators
  - [ ] Show token counts for summaries
  - [ ] Show turn counter
  - [ ] Indicate when regeneration will occur
- [ ] Error handling and user feedback
  - [ ] API errors
  - [ ] Database errors
  - [ ] Configuration errors
- [ ] Testing and bug fixes
  - [ ] Manual testing of all features
  - [ ] Edge case handling
  - [ ] Performance optimization

### Phase 7: Distribution
- [ ] Configure Bun for executable builds
- [ ] Create build script for universal distributables
- [ ] Write installation instructions
- [ ] Update README with usage guide

## Database Schema

```sql
-- Chats table
CREATE TABLE chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    anchor_prompt TEXT NOT NULL,
    anchor_summary TEXT,
    turn_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Messages table
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    turn_number INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- Summaries table
CREATE TABLE summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('history')),
    content TEXT NOT NULL,
    generated_at_turn INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- Global config table (single row)
CREATE TABLE global_config (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    global_tone TEXT,
    global_tone_summary TEXT,
    updated_at INTEGER NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_turn_number ON messages(chat_id, turn_number);
CREATE INDEX idx_summaries_chat_id ON summaries(chat_id);
```

## Project Structure

```
harvey/
├── src/
│   ├── index.ts                 # CLI entry point
│   ├── db/
│   │   ├── connection.ts        # Database initialization
│   │   ├── schema.ts            # Schema definitions and migrations
│   │   └── repositories/
│   │       ├── chats.ts
│   │       ├── messages.ts
│   │       ├── summaries.ts
│   │       └── config.ts
│   ├── services/
│   │   ├── openai.ts            # OpenAI API integration
│   │   ├── context.ts           # Context assembly logic
│   │   ├── summarization.ts     # Summarization logic
│   │   └── titles.ts            # Title generation logic
│   ├── ui/
│   │   ├── app.tsx              # Main TUI application
│   │   ├── components/
│   │   │   ├── ChatList.tsx
│   │   │   ├── MessageView.tsx
│   │   │   ├── InputArea.tsx
│   │   │   └── StatusBar.tsx
│   │   └── keybinds.ts          # Vim keybind handling
│   ├── config/
│   │   └── manager.ts           # Config file management
│   └── types/
│       └── index.ts             # TypeScript type definitions
├── PLAN.md                      # This file
├── package.json
├── tsconfig.json
└── README.md
```

## Open Questions / Future Enhancements
- Should users be able to edit message history?
- Export/import conversations?
- Support for attachments/images?
- Multiple model support (Claude, local models)?
- Conversation forking/branching?
- Search within a chat?
- Syntax highlighting for code blocks?
