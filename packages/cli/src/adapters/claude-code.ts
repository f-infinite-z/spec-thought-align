import { BaseAdapter } from './base.js';

export const claudeCodeAdapter = new (class extends BaseAdapter {
  id = 'claude-code';
  name = 'claude-code';
  displayName = 'Claude Code / OpenClaw';

  integration = {
    configFilePath: 'CLAUDE.md',
    configTemplate: `## Spec-Align 需求确认流程

在编写代码前，必须按以下步骤执行：

### 步骤 0：触发检测
\`\`\`bash
spec-thought-align detect --platform claude-code --files <预估修改文件数> --request "<用户原始需求>" [--new-feature] [--bug-fix] [--has-detailed-context] [--architecture-change] [--has-ambiguity] [--complexity low|medium|high]
\`\`\`
- mode: "require" → 必须走流程
- mode: "suggest" → 询问用户
- mode: "skip" → 跳过

### 步骤 1：提交分析
分析需求时，逐条回答两个问题：
1. 不确定检查：我是不是有不确定的地方，在猜测用户的意思？（标出并以"不确定："开头）
2. 影响范围评估：会不会产生结构性变化，影响的范围有哪些？（列出受影响的文件/模块）

\`\`\`bash
spec-thought-align submit --id "<任务名>" --request "<用户原始需求>" --analysis "<你的完整分析>" --no-wait
\`\`\`

### 步骤 2：等待确认
\`\`\`bash
spec-thought-align await-confirm --id "<任务名>" --timeout 600
\`\`\`

### 步骤 3：按规约施工
返回的 JSON 是最终规约，严格按它施工。面板中的 questions 以用户澄清后的回答为准。

### 步骤 4：标记完成
\`\`\`bash
spec-thought-align complete --id "<任务名>" --summary "<做了什么>"
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
