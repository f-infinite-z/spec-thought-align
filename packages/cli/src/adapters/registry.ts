import type { PlatformAdapter } from '@spec-thought-align/shared';
import { opencodeAdapter } from './opencode.js';
import { claudeCodeAdapter } from './claude-code.js';
import { cursorAdapter } from './cursor.js';
import { aiderAdapter } from './aider.js';
import { windsurfAdapter } from './windsurf.js';
import { geminiCliAdapter } from './gemini-cli.js';
import { openaiCodexAdapter } from './openai-codex.js';
import { genericAdapter } from './generic.js';

const ALL_ADAPTERS: PlatformAdapter[] = [
  opencodeAdapter,
  claudeCodeAdapter,
  cursorAdapter,
  aiderAdapter,
  windsurfAdapter,
  geminiCliAdapter,
  openaiCodexAdapter,
  genericAdapter,
];

export function getAdapter(platformId: string): PlatformAdapter | undefined {
  return ALL_ADAPTERS.find((a) => a.id === platformId);
}

export function resolveAdapter(platformId?: string): PlatformAdapter {
  if (platformId) {
    const explicit = getAdapter(platformId);
    if (explicit) return explicit;
  }

  const detected = ALL_ADAPTERS.find((a) => a.detectPlatform());
  if (detected) return detected;

  return genericAdapter;
}

export function listAdapters(): PlatformAdapter[] {
  return ALL_ADAPTERS;
}
