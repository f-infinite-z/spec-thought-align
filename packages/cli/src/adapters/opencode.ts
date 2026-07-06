import { BaseAdapter } from './base.js';

export const opencodeAdapter = new (class extends BaseAdapter {
  id = 'opencode';
  name = 'opencode';
  displayName = 'opencode';

  integration = {
    configFilePath: '~/.config/opencode/AGENTS.md',
    configTemplate: `## Spec-Align 需求确认流程（强制）

在编写任何代码之前，必须按以下步骤执行：

1. **强制检测**：调用 \`spec-thought-align detect\` 判断是否需要需求确认
   \`\`\`
   spec-thought-align detect --platform opencode --files <count> [--new-feature] [--architecture-change] [--has-ambiguity] [--complexity low|medium|high]
   \`\`\`
   - 如果返回 \`mode: "require"\`，必须走 spec-align 流程
   - 如果返回 \`mode: "suggest"\`，使用 question 工具询问用户
   - 如果返回 \`mode: "skip"\`，可直接施工

2. 提交分析：
   \`\`\`
   spec-thought-align submit --id "<任务名>" --request "<用户原始需求>" --analysis "<你的完整分析>" --wait
   \`\`\`

3. 按确认后的 JSON 规约施工

4. 完成后标记：
   \`\`\`
   spec-thought-align complete --id "<任务名>" --summary "<做了什么>"
   \`\`\``,
    detectEnvVars: ['OPENCODE_'],
    recommendedStrategy: 'wait',
  };

  detectPlatform(): boolean {
    return Object.keys(process.env).some((k) => k.startsWith('OPENCODE_'));
  }
})();
