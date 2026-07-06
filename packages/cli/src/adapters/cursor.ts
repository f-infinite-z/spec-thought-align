import { BaseAdapter } from './base.js';

export const cursorAdapter = new (class extends BaseAdapter {
  id = 'cursor';
  name = 'cursor';
  displayName = 'Cursor IDE';

  integration = {
    configFilePath: '.cursor/rules 或 .cursorrules',
    configTemplate: `在修改代码前调用 detect 判断触发：

\`\`\`bash
spec-thought-align detect --platform cursor --files <count> [--complexity high]
\`\`\`

如果 mode 为 require，必须走 spec-align 流程（使用 --no-wait 模式）：
\`\`\`bash
spec-thought-align submit --id "<任务名>" --request "<用户需求>" --analysis "<分析>" --no-wait --agent-type cursor
spec-thought-align await-confirm --id "<任务名>"
\`\`\``,
    detectEnvVars: ['CURSOR_TRACE_ID', 'VSCODE_CWD'],
    recommendedStrategy: 'no-wait',
    knownTimeoutSeconds: 300,
  };

  detectPlatform(): boolean {
    return !!(process.env.VSCODE_CWD || process.env.CURSOR_TRACE_ID);
  }
})();
