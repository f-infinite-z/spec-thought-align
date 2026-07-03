# 🎯 Spec-Align

> AI Coding Agent 施工前的「需求评审」面板 —— 让 Agent 把思考摊开，确认无误再动工。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](package.json)

## 解决的问题

```
用户说需求 → Agent 自己理解 → 直接开工 → 返工 😫
                  ↑
           这里缺了一个「需求评审」环节
```

**Spec-Align** 在你和 Agent 之间插入一个可视化确认层：

```
用户说需求 → Agent 分析 → [📋 可视化确认面板] → 按规约施工 ✅
                              ↑
                        你在这里介入：
                        - 看看 Agent 理解对了没
                        - 标红的地方补充细节
                        - 回答待澄清的问题
                        - 点确认，Agent 严格按你的意思来
```

## 3 步上手

```bash
# 1. Agent 提交它的理解（自然语言，不需要特殊格式）
npx spec-thought-align submit \
  --id "login-page" \
  --request "做一个登录页面，支持邮箱密码登录" \
  --analysis "核心是做登录表单。假设用 React + Tailwind。
不确定密码强度要求，也不清楚要不要记住我功能。错误处理用 toast。" \
  --wait

# 2. 浏览器自动打开面板 → 你确认/补充 → 点「确认」

# 3. 命令返回最终规约 JSON → Agent 严格按照它施工
```

## 核心特点

| 特点                  | 说明                                                                            |
| --------------------- | ------------------------------------------------------------------------------- |
| 🎯 **Agent 无关**     | 任何能执行命令的 Agent 都能用（Cline / Cursor / Aider / Claude Code / Copilot） |
| 🚀 **npx 零安装**     | 一行命令，不依赖 Docker 或云服务                                                |
| 👁️ **不确定性可视化** | Agent 不确定的地方标红，一眼看到风险点                                          |
| ✏️ **可交互编辑**     | 点击任何字段直接修改                                                            |
| 💰 **Token 友好**     | Agent 不需要格式化 JSON，只传原始思考文本                                       |
| 📁 **本地存储**       | 数据在 `.spec-align/`，纯 JSON                                                  |
| 🤖 **规则引擎**       | 自动从分析文本中提取目标/假设/问题/技术栈                                       |

## Agent 集成

在任何 Agent 的 system prompt 或项目 rules 中加一段：

```markdown
在编写代码前：

1. 用自然语言描述你对需求的理解（包含假设和不确定之处）
2. 执行: npx spec-thought-align submit --id "<任务名>" \
   --request "<用户需求>" --analysis "<你的分析>" --wait
3. 命令返回 JSON 后，严格按规约施工
```

## 命令参考

```bash
submit    # 提交规约，--wait 阻塞等待确认
fetch     # 拉取已确认的规约 JSON
status    # 查询任务状态
list      # 列出所有任务
complete  # 标记任务完成
config    # 查看/修改配置
```

## 开发

```bash
git clone https://github.com/f-infinite-z/spec-thought-align.git
cd spec-thought-align
pnpm install
pnpm test          # 36 tests
node scripts/build.js  # 构建 CLI + UI
```

## 文档

- [设计文档](DESIGN.md)
- [架构图](docs/architecture.md)
- [规约 Schema](docs/spec-schema.md)
- [规约引擎](docs/spec-engine.md)
- [路线图](docs/roadmap.md)
- [开发指南](CONTRIBUTING.md)

MIT © 2026 f-infinite-z
