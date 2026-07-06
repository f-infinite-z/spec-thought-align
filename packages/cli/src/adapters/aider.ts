import { BaseAdapter } from './base.js';

export const aiderAdapter = new (class extends BaseAdapter {
  id = 'aider';
  name = 'aider';
  displayName = 'Aider';

  integration = {
    configFilePath: '.aider.conf.yml 或 CONVENTIONS.md',
    configTemplate: `在编写代码前，必须调用 detect：

\`\`\`bash
spec-thought-align detect --platform aider --files <count>
\`\`\`

如果 mode 为 require 或 suggest，使用 --wait 模式：
\`\`\`bash
spec-thought-align submit --id "<任务名>" --request "<用户需求>" --analysis "<分析>" --wait --agent-type aider
\`\`\``,
    detectEnvVars: ['AIDER_'],
    recommendedStrategy: 'wait',
  };

  detectPlatform(): boolean {
    return Object.keys(process.env).some((k) => k.startsWith('AIDER_'));
  }
})();
