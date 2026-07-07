import { BaseAdapter } from './base.js';

export const opencodeAdapter = new (class extends BaseAdapter {
  id = 'opencode';
  name = 'opencode';
  displayName = 'opencode';

  integration = {
    configFilePath: '~/.config/opencode/AGENTS.md',
    configTemplate: `## Spec-Align 需求确认流程（半硬约束）

在编写代码前，必须按以下步骤执行：

### 步骤 0：程序化触发检测（半硬约束 — 必须调用）

在分析用户需求后，**必须先调用 detect 命令**以程序化判断是否需要走 spec-align 流程：

\`\`\`
spec-thought-align detect --platform opencode --files <预估修改文件数> --request "<用户原始需求>" [--new-feature] [--bug-fix] [--has-detailed-context] [--architecture-change] [--has-ambiguity] [--complexity low|medium|high]
\`\`\`

detect 返回 JSON，根据 mode 决定：
- mode: "require" — **必须**走 spec-align 流程，直接进入步骤 1
- mode: "suggest" — **应该**询问用户是否使用 spec-align（调用 question 工具）
- mode: "skip" — **可以**跳过，直接施工

### 步骤 1：用户自主触发（快捷语法）

用户可以通过以下方式直接触发需求确认（无需 Agent 判断）：
- 明确说"用 spec-align"
- 使用快捷语法：在对话中输入 spec-thought-align "用户需求"

### 步骤 2：Agent 分析和规约提交

1. 用自然语言输出你对需求的理解和分析，必须逐条回答以下两个问题：
   - **不确定检查**：我是不是有不确定的地方，在猜测用户的意思？如果有，明确标出并以"不确定："开头
   - **影响范围评估**：会不会产生结构性变化，影响的范围有哪些？明确列出受影响的文件/模块

2. 提交规约（使用 --no-wait 避免 bash 工具超时）：
   \`\`\`
   spec-thought-align submit --id "<任务名>" --request "<用户原始需求>" --analysis "<你的完整分析>" --no-wait
   \`\`\`

3. 立即等待用户确认（HTTP API 轮询，每 1s 检测一次，确认后自动返回）：
   \`\`\`
   spec-thought-align await-confirm --id "<任务名>" --timeout 600
   \`\`\`

4. 命令返回 JSON 是最终规约，严格按它施工
   - 面板中的 questions 在用户确认时可能获得逐条澄清，澄清内容体现在最终规约的 userAdditions 或对应的字段修改中
   - 施工时以用户确认后的最终规约为准，不可对用户已回答的问题自行假设

5. 施工完成后，标记任务完成：
   \`\`\`
   spec-thought-align complete --id "<任务名>" --summary "<做了什么>"
   \`\`\`

注意：如果上述命令不可用（未构建），跳过此流程直接施工。`,
    detectEnvVars: ['OPENCODE_'],
    recommendedStrategy: 'no-wait',
  };

  detectPlatform(): boolean {
    return Object.keys(process.env).some((k) => k.startsWith('OPENCODE_'));
  }
})();
