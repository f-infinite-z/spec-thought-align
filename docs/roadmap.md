# Spec-Align 分阶段推进计划

> 目标：4 周内从零到 npm 可发布版本

---

## 总览

```
Phase 0  Phase 1    Phase 2      Phase 3       Phase 4
[脚手架] [CLI核心] [Server+UI] [UI完善+引擎]  [发布推广]
  2天      4天        5天          5天           2天
  ██      ████       █████       █████          ██
```

---

## Phase 0：项目脚手架（预计 2h）

**目标**：能 `npm run dev` 跑起来，CI 绿

### 任务清单

- [ ] **Monorepo 骨架**
  - 根 `package.json`（npm workspaces）
  - `packages/cli/`、`packages/ui/`、`packages/shared/` 三个包
  - 每个包独立 `package.json`、`tsconfig.json`

- [ ] **TypeScript 配置**
  - 根 `tsconfig.base.json`（共享配置）
  - 各包继承 base + 各自路径别名
  - `shared` 包通过 workspace 引用

- [ ] **开发工具链**
  - ESLint + Prettier 配置
  - Vitest 配置（根级别 + 各包）
  - Git hooks（husky + lint-staged，可选）

- [ ] **CI/CD**
  - GitHub Actions：`pnpm install → lint → test → build`
  - 触发条件：push 到 main、PR

- [ ] **类型定义先行**
  - `packages/shared/src/types.ts`：完整 Spec 类型定义
  - `packages/shared/src/constants.ts`：默认配置、端口等

### 验证方式

```bash
git clone ... && pnpm install && pnpm build && pnpm test
# 全部通过 ✅
```

---

## Phase 1：CLI 核心闭环（预计 4h）

**目标**：`npx spec-thought-align submit --wait` 能跑通完整流程

### 任务清单

- [ ] **CLI 框架搭建**
  - `commander` 主入口
  - `submit` / `fetch` / `status` / `list` 四个命令骨架
  - `--help` 输出清晰

- [ ] **存储层**
  - `storage/index.ts`：`.spec-align/{id}/` 目录 + JSON 读写
  - `input.json`：Agent 原始提交
  - `spec.json`：结构化规约
  - `status.json`：`{ status, createdAt, updatedAt }`

- [ ] **`submit` 命令**
  - 接收 `--id` `--request` `--analysis` 参数
  - 写入 `input.json` → 初始化 `spec.json`（半空） → 写入 `status.json: pending`
  - `--wait` 逻辑：`while (true) { sleep(2s); check status.json; }`
  - 退出码：0 确认 / 1 超时 / 2 取消
  - stdout 输出最终 `spec.json`

- [ ] **`fetch` / `status` / `list` 命令**
  - `fetch --id`：读取并输出完整 `spec.json`
  - `status --id`：输出状态摘要 JSON
  - `list`：遍历 `.spec-align/` 输出所有任务摘要

- [ ] **测试**
  - 存储层单元测试
  - CLI 命令集成测试（启动 submit --no-wait → fetch → 验证）

### 验证方式

```bash
# 终端 1：启动一个 submit --wait
npx spec-thought-align submit --id "test-001" \
  --request "做个登录页" \
  --analysis "假设用 React，不确定要不要验证码" \
  --wait

# 终端 2：手动改 status 为 confirmed
echo '{"status":"confirmed"}' > .spec-align/test-001/status.json

# 终端 1 应立即退出 0，stdout 输出 spec.json ✅
```

---

## Phase 3：Web UI 面板（预计 5h）

**目标**：浏览器打开能看见面板，点确认能打通 CLI

### 任务清单

- [ ] **hono HTTP Server**
  - `server/index.ts`：hono 实例，端口检测
  - API 路由：
    - `GET /api/task/:id` → 返回 spec + status
    - `POST /api/task/:id/confirm` → 更新 status → confirmed
    - `POST /api/task/:id/cancel` → 更新 status → cancelled
    - `POST /api/task/:id/spec` → 更新 spec 字段
  - 静态文件服务：指向 UI build 产物

- [ ] **Vite + React 项目骨架**
  - `packages/ui/` 项目初始化
  - `App.tsx`：读取 URL 中的 task id，调用 API
  - 开发模式 proxy → hono server

- [ ] **核心面板组件（MVP 最小集）**
  - `LeftPanel.tsx`：展示 `spec.input.analysis`（只读，滚动）
  - `GoalPanel.tsx`：核心目标，可编辑
  - `AssumptionsPanel.tsx`：假设列表 + 置信度色标（🔴🟡🟢）
  - `ConfirmPanel.tsx`：确认 / 取消按钮

- [ ] **确认流程打通**
  - 用户点确认 → `POST /api/task/:id/confirm` → server 更新 status → CLI 轮询到 → 退出

### 验证方式

```bash
npx spec-thought-align submit --id "test-002" \
  --request "做个 API 接口" \
  --analysis "RESTful API，假设用 Express" \
  --wait

# 浏览器自动打开 → 看到面板 → 左侧显示 Agent 分析 → 右侧显示字段
# 编辑目标字段 → 强制刷新确认无误 → 点确认
# 终端返回 JSON ✅
```

---

## Phase 4：UI 完善 + 规约引擎（预计 5h）

**目标**：完整的面板体验，规则引擎能预填大部分字段

### 任务清单

- [ ] **剩余面板**
  - `ScopePanel.tsx`：inScope / outOfScope / constraints（动态增删）
  - `IOPanel.tsx`：输入 / 输出 / 验收标准
  - `ClarifyPanel.tsx`：待澄清问题（有选项的点选，无选项的填文本）
  - `PlanPanel.tsx`：架构描述 + 组件列表 + 技术栈

- [ ] **交互增强**
  - 行内编辑：点击字段 → 变为输入框 → 失焦保存
  - `EditableField.tsx` / `EditableList.tsx` 通用组件
  - 完成度进度条

- [ ] **规约引擎（Level 1 纯规则）**
  - `engine/parser.ts`：关键字匹配 + 分段识别
  - 提取：目标 / 假设（带置信度）/ 技术栈 / 问题
  - submit 时自动调用，预填 `spec.json`

- [ ] **WebSocket 实时同步**
  - 用户编辑 → WS 推送 → server 写入文件 → CLI 可立即感知
  - 可选：V1 可以跳过，用轮询 + 手动保存替代

### 验证方式

```bash
npx spec-thought-align submit --id "test-003" \
  --request "用户注册功能，需要邮箱验证" \
  --analysis "核心是注册表单+验证API。假设用React+Node.js。
不确定：密码强度要求？是否需要图形验证码？
我猜测错误处理用统一错误码返回。" \
  --wait

# 面板显示：
# 🎯 目标: "用户注册功能，需要邮箱验证"（已预填 ✅）
# 🔴 假设(low): "错误处理用统一错误码"（标红，需确认）
# 🟡 假设(med): "不确定密码强度要求"（标黄）
# ❓ 问题1: "密码强度要求？"
# ❓ 问题2: "是否需要图形验证码？"
```

---

## Phase 5：发布准备（预计 2h）

**目标**：npm 可装，README 能让人 3 分钟上手

### 任务清单

- [ ] **构建配置**
  - CLI 包：tsc 或 tsup 编译
  - UI 包：Vite build → `packages/cli/dist/ui/`
  - `bin` 入口配置
  - npm publish 脚本

- [ ] **文档**
  - README 最终版：GIF 演示 + Quick Start
  - `docs/agent-integration.md`：Cline / Cursor / Aider / Claude Code 集成
  - `examples/`：3 个示例规约

- [ ] **发布**
  - `npm publish`
  - GitHub Release v0.1.0
  - 推广帖子撰写

---

## 时间估算

| Phase    | 内容               | 时间     |
| -------- | ------------------ | -------- |
| Phase 0  | 脚手架             | 2h       |
| Phase 1  | CLI 核心 + 存储层  | 4h       |
| Phase 2  | Server + 最小 UI   | 5h       |
| Phase 3  | UI 完善 + 规则引擎 | 5h       |
| Phase 4  | 发布准备           | 2h       |
| **合计** |                    | **~18h** |

实际按碎片时间穿插，约 **2-3 周** 可完成。

---

## 每条完成后的验证标准

每个 Phase 结束必须通过「端到端验收」：

```bash
# 模拟一次真实使用
npx spec-thought-align submit \
  --id "e2e-test" \
  --request "做一个用户登录页面" \
  --analysis "我理解要做登录功能..." \
  --wait

# → 浏览器弹出面板
# → 用户编辑字段
# → 点确认
# → 终端输出完整规约 JSON
# → Agent 拿到 JSON 后继续
```

---

## 技术风险与对策

| 风险                           | 影响             | 对策                                |
| ------------------------------ | ---------------- | ----------------------------------- |
| `npx` 冷启动慢（首次下载依赖） | 首次体验差       | 文档提前说明；V2 研究单文件二进制   |
| 端口冲突                       | 服务启动失败     | 自动检测 + 递增端口 + `--port` 参数 |
| 浏览器自动打开失败             | 用户找不到面板   | CLI 输出 URL，引导手动打开          |
| 不同 Agent 的文本风格差异大    | 规则引擎召回率低 | Level 1 规则做基础覆盖，不追求完美  |
| workspace monorepo 复杂度      | 开发体验下降     | 保持简单，只用 npm workspaces       |

---

## 下一步行动

> **立刻开始 Phase 0：搭建项目脚手架。**

需要我开始写 Phase 0 的代码吗？
