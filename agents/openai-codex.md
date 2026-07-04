# Spec-Align Integration

Install: `npm i -g spec-thought-align` or use local path `node packages/cli/dist/index.js`.

If the CLI is unavailable, skip this workflow and proceed directly.

## When to Trigger

**Skip:** Single-file bug fixes, config changes, comments, formatting, renames, or requirements with zero ambiguity.

**Trigger:** New features, multi-file refactoring, unclear requirements, architecture changes, or broad impact scope.

When triggered, inform the user first, then execute the workflow below.

## Workflow

> Codex CLI has exec timeout. Use `--no-wait` + `await-confirm` to avoid losing results.

### Step 1: Submit

```bash
spec-thought-align submit \
  --id "<task-id>" \
  --request "<user request>" \
  --analysis "<your analysis>" \
  --no-wait
```

Creates `.spec-thought-align/<task-id>/spec.json` and starts the visual panel server on port 5678. Share the panel URL with the user.

### Step 2: Wait for Confirmation

```bash
spec-thought-align await-confirm --id "<task-id>" --timeout 600
```

Polls the server via HTTP API first, falls back to filesystem polling if unreachable. Outputs the confirmed spec as JSON on success. Default timeout: 600s.

If the process is killed by Codex timeout, re-run this command in a new session. Data persists in `.spec-thought-align/<task-id>/spec.json`.

### Step 3: Build

Follow the confirmed JSON spec strictly:

- `scope.inScope` / `scope.outOfScope` — scope boundaries
- `questions[].userAnswer` — user clarifications
- `plan.components` / `plan.techStack` — architecture and stack

### Step 4: Complete

```bash
spec-thought-align complete --id "<task-id>" --summary "<summary>"
```

## Fallback

If the CLI is unavailable or the server has shut down, read files directly:

```bash
cat .spec-thought-align/<task-id>/result.json   # preferred
cat .spec-thought-align/<task-id>/spec.json     # fallback
```
