# Quick Start

> 从零到第一次使用，不超过 3 分钟。

## 前置条件

- Node.js 18+
- 现代浏览器（Chrome / Edge / Firefox）
- 任何 AI Coding Agent（Cline、Cursor、Aider、Claude Code 等）

## Step 1：让 Agent 知道 Spec-Align

在你的 Agent 项目 rules 或 system prompt 中加入：

```markdown
## 需求确认

在写代码前：

1. 用自然语言描述你对需求的理解
2. 执行: npx spec-thought-align submit --id "<任务名>" --request "<用户需求>" --analysis "<你的分析>" --wait
3. 解析 stdout 的 JSON，按规约施工
```

## Step 2：正常使用 Agent

像平时一样给 Agent 提需求：

```
用户: 帮我做一个用户登录页面，需要邮箱密码登录
```

Agent 会自动：

1. 分析需求
2. 调用 `npx spec-thought-align submit --wait`
3. 浏览器自动打开确认面板
4. 等待你确认

## Step 3：在面板中确认

浏览器打开的页面上：

- **左侧**：Agent 的原始思考（参考）
- **右侧**：结构化面板（可编辑）
  - 🎯 核心目标 —— Agent 理解对了没？
  - 🔴🟡🟢 假设列表 —— 红色/黄色的重点确认
  - ❓ 待澄清问题 —— 选择题点一下就行
  - ✅ 验收标准

点击「确认」后，面板关闭，Agent 拿到最终规约开始施工。

## 进阶：启用自动提取

如果你想让面板自动预填（不需要手动对照填写）：

```bash
# 配置 LLM（任意 OpenAI-compatible API）
npx spec-thought-align config set llm.provider "openai"
npx spec-thought-align config set llm.apiKey "sk-xxx"
npx spec-thought-align config set llm.model "gpt-4o-mini"

# 之后 submit 会自动提取结构化信息，面板预填完整
# 成本：每次约 $0.0003
```

## 常用命令

```bash
# 查看所有任务
npx spec-thought-align list

# 查询特定任务状态
npx spec-thought-align status --id "login-page"

# 拉取已确认的规约
npx spec-thought-align fetch --id "login-page"

# 查看/修改配置
npx spec-thought-align config
```

## 数据存储

所有规约保存在项目根目录的 `.spec-align/` 文件夹中：

```
your-project/
├── .spec-align/
│   ├── login-page/
│   │   ├── input.json       # Agent 原始提交
│   │   ├── spec.json        # 结构化规约
│   │   └── status.json      # 状态信息
│   └── dashboard/
│       └── ...
├── src/
└── ...
```

建议将 `.spec-align/` 加入 `.gitignore` 或提交到仓库（团队共享规约）。

## 下一步

- [完整设计文档](./DESIGN.md)
- [规约 Schema 参考](./spec-schema.md)
- [各 Agent 集成教程](./agent-integration.md)
