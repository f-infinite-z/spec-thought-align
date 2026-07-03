# GitHub 项目规范化指导书

> 从当前状态到正式开源仓库的完整规范清单

---

## 1. 仓库设置

### 1.1 基本信息

创建仓库后，在 Settings → General 中设置：

| 设置项          | 值                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Repository name | `spec-align`                                                                                      |
| Description     | AI Coding Agent 施工前的需求规约可视化确认面板                                                    |
| Website         | （可选）文档站点 URL                                                                              |
| Topics          | `ai-agent`, `specification`, `cli`, `developer-tools`, `coding-agent`, `cursor`, `cline`, `aider` |
| Social preview  | 上传一张 1280×640 的封面图                                                                        |
| Default branch  | `main`                                                                                            |

### 1.2 分支保护（Settings → Branches）

```
Branch: main
☑ Require a pull request before merging
☑ Require approvals (1)
☑ Require status checks to pass before merging
  ☑ build (CI workflow)
☑ Require conversation resolution before merging
```

### 1.3 功能开关（Settings → Features）

```
☑ Issues          → 启用
☑ Discussions     → 启用
☑ Wiki            → 不启用（用 docs/ 代替）
☑ Projects        → 可选
☑ Sponsorships    → 可选
☐ Packages        → 不启用（用 npm）
```

---

## 2. Issue 模板

创建 `.github/ISSUE_TEMPLATE/bug_report.md`：

```markdown
---
name: Bug 报告
about: 报告一个 bug
title: '[Bug] '
labels: bug
assignees: ''
---

## 描述

清晰简洁地描述 bug。

## 复现步骤

1. 执行 '...'
2. 点击 '...'
3. 看到错误

## 期望行为

描述期望发生什么。

## 环境

- OS: [Windows / macOS / Linux]
- Node.js 版本: [18 / 20 / 22]
- Spec-Align 版本: [0.1.0]
- Agent 类型: [Cline / Cursor / Aider / Claude Code]

## 截图/日志

如果有，粘贴相关输出。
```

创建 `.github/ISSUE_TEMPLATE/feature_request.md`：

```markdown
---
name: 功能建议
about: 建议一个新功能
title: '[Feature] '
labels: enhancement
assignees: ''
---

## 问题描述

这个功能解决什么问题？

## 建议方案

描述你期望的实现方式。

## 替代方案

有没有其他方案可以达到同样目的？

## 附加信息

任何相关的上下文或截图。
```

### 2.1 Issue 标签体系

```
类型标签:
  bug              # 红色  #d73a4a
  enhancement      # 蓝色  #a2eeef
  documentation    # 灰色  #0075ca
  question         # 粉色  #d876e3

优先级标签:
  P0-critical      # 红色  #b60205
  P1-high          # 橙色  #d93f0b
  P2-medium        # 黄色  #fbca04
  P3-low           # 绿色  #0e8a16

状态标签:
  good first issue # 绿色  #7057ff
  help wanted      # 金色  #008672
  wontfix          # 灰色  #ffffff
  duplicate        # 灰色  #cfd3d7
```

---

## 3. PR 模板

创建 `.github/PULL_REQUEST_TEMPLATE.md`：

```markdown
## 变更类型

- [ ] Bug 修复
- [ ] 新功能
- [ ] 文档更新
- [ ] 重构
- [ ] 其他

## 描述

简要描述变更内容。

## 测试

- [ ] 单元测试通过 (`pnpm test`)
- [ ] 构建成功 (`node scripts/build.js`)
- [ ] 手动测试通过

## 截图/录屏

如果是 UI 变更，附上截图。

## Checklist

- [ ] 代码符合项目风格
- [ ] 更新了相关文档
- [ ] 新增了测试（如需要）
- [ ] CHANGELOG 已更新（如需要）
```

---

## 4. CI/CD 工作流

### 4.1 已有：基础 CI（`.github/workflows/ci.yml`）

```yaml
# 目前已有：pnpm install → build → test
# Node 18/20/22 矩阵
```

### 4.2 建议补充：发布 CI（`.github/workflows/publish.yml`）

```yaml
name: Publish to npm

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install
      - run: node scripts/build.js
      - run: npm publish
        working-directory: packages/cli
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 4.3 建议补充：自动标签（`.github/workflows/labeler.yml`）

```yaml
name: Labeler

on:
  issues:
    types: [opened]

jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/labeler@v5
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
```

---

## 5. 社区健康文件

### 5.1 CODE_OF_CONDUCT.md（行为准则）

```markdown
# 贡献者行为准则

## 我们的承诺

为了营造一个开放和友好的环境，我们承诺让每个人都能无骚扰地参与项目。

## 我们的标准

- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情

## 执行

如有不可接受的行为，请联系项目维护者。
```

### 5.2 SECURITY.md（安全政策）

```markdown
# 安全政策

## 报告漏洞

如果发现安全漏洞，请不要创建公开 Issue。
请发送邮件至 [TODO: 邮箱地址]。

## 支持版本

| 版本  | 支持状态    |
| ----- | ----------- |
| 0.1.x | ✅ 活跃支持 |

## 安全考量

- Spec-Align 在本地运行，不传输数据到外部服务
- 规约数据存储在 `.spec-align/` 目录，建议加入 `.gitignore`
- 如果启用 LLM 自动提取，API Key 存储在本地配置文件
```

### 5.3 FUNDING.yml（可选）

```yaml
github: [你的用户名]
custom: ['https://buymeacoffee.com/你的用户名']
```

---

## 6. Repository 文件清单

确保以下文件存在且内容正确：

```
☑ README.md           # 项目门面（中英双语推荐）
☑ LICENSE             # MIT
☑ CHANGELOG.md        # 版本变更记录
☑ CONTRIBUTING.md     # 贡献指南
☑ CODE_OF_CONDUCT.md  # 行为准则
☑ SECURITY.md         # 安全政策
☑ .github/
   ☑ workflows/ci.yml
   ☑ workflows/publish.yml (建议)
   ☑ ISSUE_TEMPLATE/
      ☑ bug_report.md
      ☑ feature_request.md
   ☑ PULL_REQUEST_TEMPLATE.md
☑ .gitignore
☑ .npmrc (pnpm 相关)
```

---

## 7. 首次提交建议

```bash
cd spec-thought-align

# 初始化 git
git init
git checkout -b main

# 添加所有文件
git add .

# 首次提交
git commit -m "🎉 Initial commit: Spec-Align v0.1.0

Core features:
- CLI with submit/fetch/status/list/complete/config commands
- Web UI panel for interactive requirement confirmation
- Rule engine for auto-filling specs from Agent analysis
- Agent-agnostic design (works with any CLI-capable agent)
- 36 tests passing
"

# 关联远程仓库
git remote add origin https://github.com/spec-thought-align/spec-align.git
git push -u origin main
```

---

## 8. 后续工作流

### 日常开发

```bash
git checkout -b feature/xxx    # 新功能分支
# ... 开发 ...
pnpm test                       # 跑测试
git commit -m "feat: 描述"
git push origin feature/xxx
# 创建 PR → Code Review → 合并
```

### 版本发布

```bash
# 1. 更新版本号
# packages/cli/package.json → version
# CHANGELOG.md → 新版本条目

# 2. 提交
git commit -m "chore: release v0.1.0"

# 3. 打 tag
git tag v0.1.0

# 4. 推送
git push origin main --tags

# 5. GitHub Release 页面手动创建 Release
#    - 填写 Release notes（从 CHANGELOG 复制）
#    - 附上构建产物的 tar.gz（可选）

# 6. npm publish（或等 CI 自动发布）
cd packages/cli && npm publish
```

### 提交消息规范

```
feat:     新功能
fix:      Bug 修复
docs:     文档更新
style:    代码格式（不影响逻辑）
refactor: 重构
test:     测试相关
chore:    构建/工具/依赖
```

---

> 以上清单覆盖了 GitHub 开源项目的标准实践。按需启用即可，不必一步到位。
