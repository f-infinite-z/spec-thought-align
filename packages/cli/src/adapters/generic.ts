import { BaseAdapter } from './base.js';

export const genericAdapter = new (class extends BaseAdapter {
  id = 'generic';
  name = 'generic';
  displayName = 'Unknown Agent';

  integration = {
    configFilePath: 'AGENTS.md 或自定义配置',
    configTemplate: `在编写代码前，调用 detect 判断是否需要需求确认：

\`\`\`bash
spec-thought-align detect --files <count> [--new-feature] [--architecture-change]
\`\`\`

如果 shouldTrigger 为 true，执行 spec-align 流程：
\`\`\`bash
spec-thought-align submit --id "<任务名>" --request "<用户需求>" --analysis "<分析>" --no-wait
\`\`\``,
    detectEnvVars: [],
    recommendedStrategy: 'no-wait',
    knownTimeoutSeconds: 300,
  };

  detectPlatform(): boolean {
    return false;
  }
})();
