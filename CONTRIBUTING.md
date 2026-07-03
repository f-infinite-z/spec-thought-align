# Contributing to Spec-Align

## Development Setup

```bash
git clone https://github.com/f-infinite-z/spec-thought-align.git
cd spec-thought-align
pnpm install
```

## Project Structure

```
spec-thought-align/
├── packages/
│   ├── shared/    # Shared TypeScript types and utilities
│   ├── cli/       # CLI tool (Commander + Hono server)
│   └── ui/        # Web UI panel (React + Vite)
├── scripts/
│   └── build.js   # Production build script
└── docs/          # Design documents
```

## Commands

```bash
pnpm test          # Run all tests
pnpm build         # Build CLI + UI for production
node scripts/build.js  # Full build pipeline
```

## Running Locally

```bash
# CLI (dev mode with tsx)
npx tsx packages/cli/src/index.ts submit --id "test" --request "需求" --analysis "分析" --no-wait

# UI (dev mode)
cd packages/ui && npx vite dev
```

## Testing

- Unit tests: `packages/*/src/**/*.test.ts`
- Test framework: Vitest
- Run: `pnpm test`

## Pull Request Checklist

- [ ] Tests pass (`pnpm test`)
- [ ] Build succeeds (`node scripts/build.js`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Update CHANGELOG.md if needed
