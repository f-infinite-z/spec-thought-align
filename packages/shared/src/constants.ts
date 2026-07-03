import type { SpecAlignConfig, Spec } from './types.js';

// ---- 默认配置 ----

export const DEFAULT_CONFIG: SpecAlignConfig = {
  server: {
    port: 5678,
    host: '127.0.0.1',
  },
  storage: {
    path: '.spec-align',
  },
  llm: {
    provider: 'openai',
    enabled: false,
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  ui: {
    autoOpen: true,
  },
};

// ---- 存储相关 ----

export const STORAGE_DIR = '.spec-align';

export const INPUT_FILE = 'input.json';
export const SPEC_FILE = 'spec.json';
export const STATUS_FILE = 'status.json';
export const TASKS_FILE = 'tasks.json';

// ---- 退出码 ----

export const EXIT_CODES = {
  CONFIRMED: 0,
  TIMEOUT: 1,
  CANCELLED: 2,
  ERROR: 3,
} as const;

// ---- 默认超时（秒） ----

export const DEFAULT_TIMEOUT_SECONDS = 600; // 10 分钟

// ---- 轮询间隔（毫秒） ----

export const POLL_INTERVAL_MS = 2000;

// ---- 创建空规约模板 ----

export function createEmptySpec(
  id: string,
  request: string,
  analysis: string,
  agentType?: string,
): Spec {
  const now = new Date().toISOString();
  return {
    meta: { id, timestamp: now, status: 'pending', agentType },
    input: {
      meta: { id, timestamp: now, agentType },
      request,
      analysis,
    },
    understanding: { goal: '', context: '', rawRequest: request },
    scope: { inScope: [], outOfScope: [], constraints: [], assumptions: [] },
    plan: { architecture: '', components: [], techStack: [] },
    io: { inputs: [], outputs: [], acceptanceCriteria: [] },
    questions: [],
    userAdditions: { notes: '', fieldEdits: [] },
  };
}
