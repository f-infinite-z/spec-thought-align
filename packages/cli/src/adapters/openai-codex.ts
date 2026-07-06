import { BaseAdapter } from './base.js';

export const openaiCodexAdapter = new (class extends BaseAdapter {
  id = 'openai-codex';
  name = 'openai-codex';
  displayName = 'OpenAI Codex CLI';

  integration = {
    configFilePath: '.codex/config.md',
    configTemplate: `在编写代码前，必须调用 detect：

\`\`\`bash
spec-thought-align detect --platform openai-codex --files <count>
\`\`\`

如果 mode 为 require，使用 --no-wait 模式：
\`\`\`bash
spec-thought-align submit --id "<任务名>" --request "<用户需求>" --analysis "<分析>" --no-wait --agent-type generic
spec-thought-align await-confirm --id "<任务名>"
\`\`\``,
    detectEnvVars: ['OPENAI_API_KEY'],
    recommendedStrategy: 'no-wait',
    knownTimeoutSeconds: 300,
  };

  detectPlatform(): boolean {
    return Object.keys(process.env).some((k) => k === 'OPENAI_API_KEY' || k.startsWith('CODEX_'));
  }
})();
