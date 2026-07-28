# Pilot IDE v1.0

A browser-based IDE built with Next.js 16, React 19, and TypeScript. Features a Monaco editor, xterm.js terminal, git integration, AI chat with full project context, and more — all running on localhost.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (turbopack) |
| UI | React 19, shadcn/ui (radix-nova), Tailwind CSS v4 |
| State | zustand (persisted to localStorage) |
| Editor | Monaco (via @monaco-editor/react) |
| Terminal | xterm.js + node-pty (server-side PTY) |
| Layout | react-resizable-panels |
| Package Mgmt | npm workspaces + turbo |

## Architecture

```
apps/web/          — Next.js app (the IDE)
packages/
  ui/              — @workspace/ui (shared components)
  eslint-config/   — flat ESLint configs
  typescript-config/ — shared TS configs
```

## Features

- **File Explorer** — browse, create, rename, delete files — supports both server file system and browser File System Access API (`showDirectoryPicker`)
- **Monaco Editor** — syntax highlighting, minimap, bracket pair colorization, diff editor, breadcrumbs, format on save, auto-save on blur
- **Multi-terminal** — multiple xterm.js tabs with PTY sessions, configurable font/shell, copy/paste
- **Git Integration** — status, stage/unstage, commit, diff, push/pull/fetch
- **AI Chat** — streaming chat with configurable OpenAI-compatible API (URL, key, model), full project context (file tree + open files), token usage counter
- **Search & Replace** — workspace-wide grep with replace-all
- **Command Palette** — Ctrl+Shift+P overlay with fuzzy search
- **Problems Panel** — Monaco diagnostics (errors/warnings)
- **Output Panel** — build/task output logging
- **Settings** — theme (light/dark/system), minimap, format on save, auto-save, terminal settings, AI config
- **Markdown Preview** — rendered preview toggle for .md files
- **Welcome Page** — landing with recent projects and quick actions

## Getting Started

```bash
# Install dependencies
npm install

# Set up AI (optional — without these, the chat panel shows "Not configured")
export AI_API_URL=https://api.openai.com/v1
export AI_API_KEY=sk-...
export AI_MODEL=gpt-4o-mini

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Open a folder via the file picker (Chrome/Edge) or type a path, then start editing.

## Commands

| Command | Action |
|---|---|
| `npm run dev` | Start all workspaces in dev mode |
| `npm run build` | Build all workspaces |
| `npm run lint` | Lint all workspaces |
| `npm run typecheck` | TypeScript type checking |
| `npm run format` | Format with Prettier |

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + S` | Save + format (if enabled) |
| `Ctrl/Cmd + W` | Close active editor tab |
| `Ctrl/Cmd + Shift + P` | Command Palette |
| `Ctrl/Cmd + B` | Toggle Sidebar |
| `Ctrl/Cmd + J` | Toggle Bottom Panel |

## AI Configuration

AI settings can be configured in two ways:

1. **Environment variables** (server-side, set before starting):
   - `AI_API_URL` — API base URL (default: `https://api.openai.com/v1`)
   - `AI_API_KEY` — API key (required for chat)
   - `AI_MODEL` — Model name (default: `gpt-4o-mini`)

2. **Settings panel** (client-side, persisted to localStorage):
   - Open Settings (gear icon) → AI section
   - Overrides environment variables when set

## Project Structure

```
apps/web/
├── app/
│   ├── api/           — API routes (chat, files, git, search, terminal, workspace)
│   ├── globals.css    — Global styles (imports @workspace/ui/globals.css)
│   ├── layout.tsx     — Root layout (ThemeProvider)
│   └── page.tsx       — IDE entry point
├── components/
│   ├── ai/            — Chat panel
│   ├── command/       — Command palette overlay
│   ├── editor/        — Monaco editor, tabs, breadcrumbs, markdown preview
│   ├── explorer/      — File tree, project selector
│   ├── git/           — Git panel
│   ├── output/        — Output panel
│   ├── problems/      — Problems/diagnostics panel
│   ├── search/        — Search & replace panel
│   ├── settings/      — Settings panel
│   ├── shell/         — IDE layout (activity bar, sidebar, resizable panels, status bar)
│   ├── terminal/      — xterm.js terminal tabs
│   └── welcome/       — Welcome page
├── lib/utils/         — terminal-manager, path-security, markdown renderer
└── stores/            — zustand stores (layout, editor, chat, git, output, problems, settings, etc.)
```
