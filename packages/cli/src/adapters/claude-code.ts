import { BaseAdapter } from './base.js';

export const claudeCodeAdapter = new (class extends BaseAdapter {
  id = 'claude-code';
  name = 'claude-code';
  displayName = 'Claude Code / OpenClaw';

  integration = {
    configFilePath: 'project-root/.claude/settings.json 或 CLAUDE.md',
    configTemplate: `在施工前必须调用 spec-thought-align detect 进行触发判断：

\`\`\`bash
spec-thought-align detect --platform claude-code --files <count> [--new-feature] [--architecture-change] [--has-ambiguity] [--complexity low|medium|high]
\`\`\`

如果 mode 为 require 或 suggest，执行 spec-align 流程（推荐 --no-wait 模式）：
\`\`\`bash
spec-thought-align submit --id "<任务名>" --request "<用户需求>" --analysis "<分析>" --no-wait
spec-thought-align await-confirm --id "<任务名>"
\`\`\``,
    detectEnvVars: ['CLAUDE_CODE_', 'ANTHROPIC_API_KEY'],
    recommendedStrategy: 'no-wait',
    knownTimeoutSeconds: 120,
  };

  detectPlatform(): boolean {
    return Object.keys(process.env).some(
      (k) => k.startsWith('CLAUDE_CODE_') || k === 'ANTHROPIC_API_KEY',
    );
  }
})();
