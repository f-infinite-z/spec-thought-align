# Spec-Align 发布部署计划

> 自用迭代验证 → 正式发布的全流程

---

## 阶段 A：自用验证（当前 → 1-2 周）

### A1. 本地集成测试

在真实 Agent 环境（Cline / Cursor / Aider）中跑通完整流程：

```bash
# 在 Agent 的项目 rules 中加入：
在编写代码前：
1. 用自然语言描述你对需求的理解
2. 执行: npx tsx ../../path/to/spec-thought-align/packages/cli/src/index.ts submit \
     --id "<任务名>" --request "<用户需求>" --analysis "<你的分析>" --wait
3. 解析 stdout JSON，严格按规约施工
```

**验证清单**：

- [ ] Cline 集成：Agent 自动调用 `spec-thought-align submit --wait`
- [ ] Cursor 集成：同上
- [ ] Aider 集成：同上
- [ ] Claude Code 集成：同上
- [ ] 面板 UI 显示正常，左侧分析 + 右侧规约
- [ ] 规则引擎预填效果可接受（目标/假设/问题/技术栈）
- [ ] 确认流程：点确认 → CLI 解除阻塞 → Agent 拿到 JSON
- [ ] 取消流程：点取消 → CLI exit 2
- [ ] 网络延迟 / 超时情况处理

### A2. 收集反馈 & 迭代

- [ ] 记录每次使用的体验问题
- [ ] 规则引擎误提取 / 漏提取案例收集
- [ ] UI 交互痛点记录
- [ ] Agent prompt 注入效果评估
- [ ] Token 节省量对比（用 vs 不用 spec-align）

### A3. 迭代目标

| 问题                                | 预期修复              |
| ----------------------------------- | --------------------- |
| 规则引擎对特定 Agent 文本风格召回低 | 增加规则 / 微调关键词 |
| UI 操作不便                         | 快捷键、批量操作      |
| 大文本分析时面板卡顿                | 虚拟滚动、分页        |
| Agent 不按 prompt 输出分析          | Prompt 模板优化       |

---

## 阶段 B：发布准备（验证通过后，1-2 天）

### B1. 代码质量

- [ ] ESLint 全量通过
- [ ] TypeScript strict 模式零 error
- [ ] 36 tests 全部通过
- [ ] 新增集成测试（至少 2 个 Agent 的真实场景录制）
- [ ] 代码审查（自查一遍）

### B2. 文档完善

- [ ] `docs/agent-integration.md`：Cline / Cursor / Aider / Claude Code 集成教程（含截图）
- [ ] `examples/`：3+ 个完整规约 JSON 示例
- [ ] README 顶部 GIF 动图（录屏：从 submit → 面板 → 确认 → Agent 施工）
- [ ] 英文 README 版本（可选，国际化）

### B3. npm 发布

```bash
# 1. 更新版本号
# packages/cli/package.json: "version": "0.1.0"

# 2. 构建
node scripts/build.js

# 3. 本地测试安装
cd /tmp && npm install /path/to/spec-thought-align/packages/cli
npx spec-thought-align --help  # 验证

# 4. 发布
cd packages/cli
npm publish --access public

# 5. 验证线上
npx spec-thought-align --help  # 从 npm registry 安装
```

### B4. 版本策略

```
v0.1.0 → 首次发布，核心功能
v0.2.0 → LLM 自动提取 + MCP Server
v0.3.0 → 施工中偏离检测 + 历史对比
v1.0.0 → 稳定 API + 完整文档
```

---

## 阶段 C：推广（发布后）

### C1. 社区推广渠道

| 渠道                          | 内容                                    | 时机          |
| ----------------------------- | --------------------------------------- | ------------- |
| V2EX                          | 中文介绍帖（解决什么问题 + 3 步上手）   | 发布当天      |
| Twitter(X)                    | 英文 + GIF 演示 + GitHub 链接           | 发布当天      |
| Reddit r/CursorAI / r/CLineAI | 集成教程帖                              | 发布后 1-2 天 |
| 掘金                          | 技术深度文章（架构设计 + 规则引擎原理） | 发布后 1 周   |
| GitHub Trending               | 靠自然增长                              | 持续          |

### C2. 推广文案锚点

**中文版**：

> 用 AI Agent 写代码最大的痛点：你以为说清楚了，Agent 以为理解了，结果返工。
>
> 我做了一个工具 **Spec-Align**，在 Agent 动手前弹出一个可视化面板：
>
> - Agent 把它的理解摊开给你看
> - 不确定的地方标红
> - 你补充完点确认，Agent 严格按确认后的规约来
>
> 3 步上手，不需要安装任何东西：
> `npx spec-thought-align submit --wait`
>
> GitHub: [链接]

### C3. 技术合作

- [ ] 联系 Cline / Aider / Cursor 团队，探讨官方集成
- [ ] 提交到 awesome-cursor / awesome-claude-code 等列表
- [ ] 考虑 MCP 协议集成（v0.2 路线图）

---

## 阶段 D：持续维护

### D1. Issue 管理

- 使用 GitHub Issues + Labels
- 标签体系：`bug` / `enhancement` / `documentation` / `good first issue` / `help wanted`

### D2. 版本发布节奏

- 补丁版本（0.1.x）：Bug 修复，随时发布
- 小版本（0.x.0）：新功能，1-2 周
- 大版本（1.0.0）：稳定 API，积累反馈后

### D3. 社区建设

- [ ] GitHub Discussions 开启
- [ ] 中文用户群（微信群 / Discord）
- [ ] 定期发布更新日志
