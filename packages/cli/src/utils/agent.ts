export interface AgentProfile {
  id: string;
  name: string;
  knownForTimeout: boolean;
  recommendedStrategy: 'wait' | 'no-wait';
  knownTimeoutSeconds?: number;
}

const PROFILES: Record<string, AgentProfile> = {
  opencode: {
    id: 'opencode',
    name: 'opencode',
    knownForTimeout: false,
    recommendedStrategy: 'wait',
  },
  'claude-code': {
    id: 'claude-code',
    name: 'Claude Code / OpenClaw',
    knownForTimeout: true,
    recommendedStrategy: 'no-wait',
    knownTimeoutSeconds: 120,
  },
  cline: {
    id: 'cline',
    name: 'Cline (VS Code)',
    knownForTimeout: true,
    recommendedStrategy: 'no-wait',
    knownTimeoutSeconds: 300,
  },
  cursor: {
    id: 'cursor',
    name: 'Cursor IDE',
    knownForTimeout: true,
    recommendedStrategy: 'no-wait',
    knownTimeoutSeconds: 300,
  },
  aider: {
    id: 'aider',
    name: 'Aider',
    knownForTimeout: false,
    recommendedStrategy: 'wait',
  },
};

const GENERIC_PROFILE: AgentProfile = {
  id: 'generic',
  name: 'Unknown Agent',
  knownForTimeout: true,
  recommendedStrategy: 'no-wait',
};

export function resolveAgentProfile(explicitType?: string): AgentProfile {
  if (explicitType && PROFILES[explicitType]) {
    return PROFILES[explicitType];
  }

  // Auto-detect from environment variables
  const envVars = Object.keys(process.env);

  if (envVars.some((k) => k.startsWith('OPENCODE_'))) return PROFILES.opencode;
  if (envVars.some((k) => k.startsWith('CLINE_'))) return PROFILES.cline;
  if (envVars.some((k) => k.startsWith('AIDER_'))) return PROFILES.aider;

  // Many agents set common IDE env vars
  if (process.env.VSCODE_CWD || process.env.CURSOR_TRACE_ID) return PROFILES.cursor;

  return GENERIC_PROFILE;
}

export function getFallbackMessage(profile: AgentProfile, _taskId: string): string {
  if (profile.knownForTimeout) {
    if (profile.knownTimeoutSeconds) {
      return (
        `[spec-align] 检测到 ${profile.name}，其 exec 超时约 ${profile.knownTimeoutSeconds}s。\n` +
        `  为确保数据不丢失，推荐使用 --no-wait 模式。`
      );
    }
    return (
      `[spec-align] 检测到 ${profile.name}，该 Agent 可能有 exec 超时。\n` +
      `  推荐使用 --no-wait 模式，然后通过 await-confirm 获取结果。`
    );
  }
  return `[spec-align] 检测到 ${profile.name}。`;
}

export function getReconnectHint(taskId: string, panelUrl: string): string {
  const lines = [
    ``,
    `  若此进程因超时被终止，可通过以下方式获取结果：`,
    `  方式1: spec-thought-align await-confirm --id "${taskId}"`,
    `  方式2: 直接读取文件 .spec-thought-align/${taskId}/spec.json`,
    `  面板:   ${panelUrl}`,
  ];
  return lines.join('\n');
}
