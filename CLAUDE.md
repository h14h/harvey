<!-- SYNC: This file must be kept in sync with AGENTS.md -->
<!-- NOTE: Any update to either file must be mirrored in the other in the same change. -->

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// import .css files directly and it works
import './index.css';

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.

## GitHub Issues

Project tasks are tracked in GitHub issues. Use the `gh` CLI to fetch and read them, and always run `gh` commands from the harvey project root (not from the `wiki/` submodule).

```sh
# List all open issues
gh issue list

# List issues by phase label
gh issue list --label phase-1-foundation
gh issue list --label phase-2-core
gh issue list --label phase-5-tui

# List issues needing discussion
gh issue list --label needs-discussion

# View a specific issue (always include comments)
gh issue view 15 --comments

# View issue in browser
gh issue view 15 --web
```

**Important:** Always use `--comments` when reading issues. Comments take precedence over the issue description — they contain corrections, additional context, and clarifications added after the issue was created.

### Issue Labels

| Label | Description |
|-------|-------------|
| `phase-1-foundation` | Project setup, types, database |
| `phase-2-core` | Config, OpenAI, context assembly |
| `phase-3-summarization` | Auto-summarization, titles |
| `phase-4-data` | Repository implementations |
| `phase-5-tui` | Terminal UI |
| `phase-6-polish` | Search, error handling, testing |
| `phase-7-distribution` | Builds

 and docs |
| `needs-discussion` | Requires team input before starting |

## Wiki

The wiki (in `wiki/` submodule) documents the current state of the system. Update it after completing work, not before.

### When to Update

- When completed work invalidates existing wiki content
- When adding something others need to know for future issues
- When implementation status of documented features changes

### Page Frontmatter

Each wiki page should have YAML frontmatter tracking implementation status:

```yaml
---
status: implemented | partial | planned
related_issues: [15, 23]
---
```

Status values:
- `planned` — documented but not yet implemented
- `partial` — some sections implemented, others pending
- `implemented` — fully implemented and current

### Commit Workflow

When closing an issue that affects the wiki:

1. **Code commit** (main repo): `Fixes #15`
2. **Wiki commit** (wiki submodule): `Fixes #15`
3. **Submodule bump** (main repo): `Bump wiki for #15`

```sh
# After code changes are committed
cd wiki
git add -A && git commit -m "Fixes #15"
git push
cd ..
git add wiki && git commit -m "Bump wiki for #15"
```

### Review

- Direct to main: no review required
- Feature branches: wiki updates reviewed alongside code
