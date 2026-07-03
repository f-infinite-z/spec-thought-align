# Changelog

## [0.1.0] - 2026-07-02

### 🎉 Initial Release

Core functionality: CLI + Web UI + Rule Engine for AI agent specification alignment.

### Features

- **CLI Commands**: `submit`, `fetch`, `status`, `list`, `complete`, `config`
- **Blocking Wait Mode** (`--wait`): CLI blocks until user confirms spec in browser
- **Non-blocking Mode** (`--no-wait`): Submit spec and return immediately
- **Web UI Panel**: Dark-themed interactive specification review
  - Left panel: Agent's raw analysis (read-only reference)
  - Right panel: Structured specification (editable)
  - Confidence badges: 🟢 High / 🟡 Medium / 🔴 Low
  - Interactive Q&A: Radio buttons for options, text input for free-form
  - Confirm / Cancel actions
- **Rule Engine**: Keyword-based NLP to pre-fill spec from Agent's raw analysis
  - Assumption detection with confidence levels
  - Question generation from uncertainty markers
  - Tech stack extraction (40+ keywords)
  - Scope/constraint detection
- **Build Pipeline**: esbuild bundling for zero-dependency npm distribution
- **Agent-agnostic**: Works with any AI coding agent that can execute CLI commands

### Tech Stack

- TypeScript + Node.js 18+
- CLI: Commander + Chalk
- Server: Hono
- UI: React 18 + Vite
- Bundle: esbuild
- Test: Vitest (36 tests)

### Known Limitations

- Rule engine uses simple keyword matching (no ML/NLP)
- UI requires browser (no TUI mode)
- No MCP Server integration yet (planned for v0.2)
- No WebSocket real-time sync (uses polling)
