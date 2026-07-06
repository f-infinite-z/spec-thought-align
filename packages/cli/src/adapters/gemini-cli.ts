import { BaseAdapter } from './base.js';

export const geminiCliAdapter = new (class extends BaseAdapter {
  id = 'gemini-cli';
  name = 'gemini-cli';
  displayName = 'Gemini CLI';

  integration = {
    configFilePath: '.gemini/settings.json',
    configTemplate: `在编写代码前，必须调用 detect：

\`\`\`bash
spec-thought-align detect --platform gemini-cli --files <count>
\`\`\`

如果 mode 为 require，使用 --no-wait 模式（Gemini CLI 可能有超时）：
\`\`\`bash
spec-thought-align submit --id "<任务名>" --request "<用户需求>" --analysis "<分析>" --no-wait --agent-type claude-code
spec-thought-align await-confirm --id "<任务名>"
\`\`\``,
    detectEnvVars: ['GEMINI_CLI_', 'GOOGLE_API_KEY'],
    recommendedStrategy: 'no-wait',
    knownTimeoutSeconds: 300,
  };

  detectPlatform(): boolean {
    return Object.keys(process.env).some(
      (k) => k.startsWith('GEMINI_CLI_') || k === 'GOOGLE_API_KEY',
    );
  }
})();
