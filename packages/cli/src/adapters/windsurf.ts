import { BaseAdapter } from './base.js';

export const windsurfAdapter = new (class extends BaseAdapter {
  id = 'windsurf';
  name = 'windsurf';
  displayName = 'Windsurf IDE';

  integration = {
    configFilePath: '.windsurfrules',
    configTemplate: `在修改代码前调用 detect：

\`\`\`bash
spec-thought-align detect --platform windsurf --files <count>
\`\`\`

如果 mode 为 require，使用 --no-wait 模式：
\`\`\`bash
spec-thought-align submit --id "<任务名>" --request "<用户需求>" --analysis "<分析>" --no-wait --agent-type cursor
spec-thought-align await-confirm --id "<任务名>"
\`\`\``,
    detectEnvVars: ['WINDSURF_'],
    recommendedStrategy: 'no-wait',
    knownTimeoutSeconds: 300,
  };

  detectPlatform(): boolean {
    return Object.keys(process.env).some((k) => k.startsWith('WINDSURF_'));
  }
})();
