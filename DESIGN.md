# Spec-Align 设计文档 v1.0

> **一句话定义**：AI Coding Agent 施工前的「需求评审」可视化面板。让 Agent 把思考草稿纸摊开，用户确认无误后再动工。

---

## 目录

1. [背景与问题](#1-背景与问题)
2. [解决方案](#2-解决方案)
3. [核心设计原则](#3-核心设计原则)
4. [架构设计](#4-架构设计)
5. [核心技术选型](#5-核心技术选型)
6. [项目结构](#6-项目结构)
7. [核心数据结构](#7-核心数据结构)
8. [进度对齐机制](#8-进度对齐机制)
9. [Token 优化策略](#9-token-优化策略)
10. [Web UI 面板设计](#10-web-ui-面板设计)
11. [CLI 命令参考](#11-cli-命令参考)
12. [V1 功能边界](#12-v1-功能边界)
13. [开源路线图](#13-开源路线图)

---

## 1. 背景与问题

### 核心矛盾

```
用户脑中的需求 → 用户表达出的需求 → Agent 理解的需求 → Agent 执行的结果
     ↑_______________↓_______________↑_______________↓
              每一跳都有信息损失
```

### 具体痛点

| 痛点             | 表现                                                    |
| ---------------- | ------------------------------------------------------- |
| **信息不对称**   | 用户以为说清楚了，Agent 以为理解对了，双方都在盲猜      |
| **无确认环节**   | Agent 直接从理解跳到执行，中间没有 checkpoint           |
| **返工成本高**   | 理解偏差导致大量代码重写，浪费 token 和时间             |
| **假设不可见**   | Agent 做了很多假设但用户不知道，直到产出结果才发现不对  |
| **双向信任缺失** | 用户不知道 Agent 是否真的懂了，Agent 不知道用户是否满意 |

### 传统开发中如何解决？

**需求评审会议**——所有利益相关方坐下来，对照需求文档逐条确认。但在 AI Agent 工作流中，这个环节缺失了。

---

## 2. 解决方案

### Spec-Align：Agent 需求对齐面板

在 Agent「理解需求」和「开始施工」之间，插入一个**可视化交互确认层**：

```
需求输入 → Agent分析 → [Spec-Align 可视化确认] → 施工执行
                           ↑
                    用户在此介入：
                    - 查看 Agent 的理解
                    - 发现模糊/错误的地方
                    - 补充细节和约束
                    - 确认后 Agent 严格按规约执行
```

### 核心价值

1. **显式化 Agent 的 mental model**——Agent 脑中的理解变成可见的面板
2. **不确定性可视化**——Agent 不确定的部分标红/黄，用户一眼看到风险点
3. **双向交互确认**——用户可以编辑、补充、修正任何字段
4. **规约即合同**——确认后的规约是 Agent 和用户的「施工合同」

---

## 3. 核心设计原则

### 3.1 普适性：Agent 无关

**不对任何特定 Agent 做深度集成。** 所有主流 AI Coding Agent（Cline、Cursor、Aider、Claude Code、OpenHands、Copilot 等）都有一个共同能力：**执行 CLI 命令**。

```bash
# 这就是我们的通用接口
npx spec-thought-align submit --request "..." --analysis "..." --wait
```

Agent 只需要：能输出文本 + 能执行命令。两个能力，覆盖 100% 的 Agent。

### 3.2 零摩擦上手

```
# 新人 3 步跑起来：
npx spec-thought-align submit --request "..." --analysis "..." --wait  # 1. 提交
# 浏览器自动打开 → 用户确认                                    # 2. 确认
# stdout 输出最终规约 JSON，Agent 继续施工                      # 3. 施工
```

- 不需要 `npm install`
- 不需要 Docker
- 不需要注册账号
- 不需要 API Key（默认模式）
- `npx` 一句话启动

### 3.3 渐进增强

| 级别                | 依赖                       | 体验                                            |
| ------------------- | -------------------------- | ----------------------------------------------- |
| **Level 1（默认）** | 零依赖                     | 左侧 Agent 原始思考，右侧空白模板，用户手动填充 |
| **Level 2（可选）** | 任意 OpenAI-compatible API | LLM 自动提取，面板预填，用户只需微调            |
| **Level 3（V2）**   | 本地 Ollama                | 纯离线自动提取，零隐私泄露                      |

### 3.4 Token 经济性

**Agent 不需要为 spec-thought-align 格式化输出。** Agent 只输出它本来就有的思考文本（草稿纸），spec-thought-align 负责从中提取结构化信息。

---

## 4. 架构设计

### 4.1 整体架构

```
                         任何 Agent（只需能执行 CLI）
                                  │
                                  │ npx spec-thought-align submit ...
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      Spec-Align 服务                        │
│                                                             │
│  ┌──────────┐   ┌──────────────┐   ┌────────────────────┐  │
│  │  CLI 入口  │──▶│  规约引擎     │──▶│  本地 HTTP Server   │  │
│  │           │   │              │   │  (端口可配)         │  │
│  │ submit    │   │ 文本解析      │   │                    │  │
│  │ fetch     │   │ 规则匹配      │   │  Web UI 面板        │  │
│  │ status    │   │ [可选] LLM   │   │  WebSocket 实时同步  │  │
│  │ config    │   │              │   │                    │  │
│  │ mcp (v2)  │   │              │   │                    │  │
│  └──────────┘   └──────────────┘   └────────────────────┘  │
│                                                             │
│  存储: .spec-align/（项目根目录，纯 JSON 文件）              │
└─────────────────────────────────────────────────────────────┘
        │                                            │
        │ CLI stdout (规约JSON)                      │ 浏览器 localhost:PORT
        ▼                                            ▼
     Agent 进程                                 用户（交互确认）
```

### 4.2 数据流

```
1. Agent 收到用户需求
2. Agent 内部分析，输出自然语言思考
3. Agent 调用: npx spec-thought-align submit \
     --id "task-001" \
     --request "用户原始需求..." \
     --analysis "Agent的思考分析..." \
     --wait
4. spec-thought-align:
   a. 启动/复用本地 HTTP Server
   b. 将原始文本写入 .spec-align/task-001/
   c. [可选] 调用 LLM 做结构化提取
   d. 打开浏览器 → Web UI 面板
   e. 等待用户确认（轮询状态文件）
5. 用户:
   a. 在浏览器看到认知面板
   b. 对照 Agent 原始思考，修正/补充各字段
   c. 回答待澄清问题
   d. 点击「确认」
6. spec-thought-align:
   a. 更新状态为 confirmed
   b. 将最终规约写入 .spec-align/task-001/spec.json
   c. CLI --wait 解除阻塞，stdout 输出最终规约 JSON
7. Agent 解析 stdout 的规约 JSON
8. Agent 严格按照规约施工
```

### 4.3 与 Agent 的关系

```
┌──────────────────┐         ┌──────────────────┐
│     Agent        │         │   Spec-Align     │
│                  │         │                  │
│ 职责:            │  CLI    │ 职责:            │
│ - 理解需求       │◄───────▶│ - 可视化确认      │
│ - 输出自然语言思考│         │ - 结构化提取      │
│ - 等待规约确认   │         │ - 用户交互        │
│ - 按规约施工     │         │ - 状态管理        │
│                  │         │                  │
│ 不负责:          │         │ 不负责:          │
│ - 格式化 JSON    │         │ - 理解需求        │
│ - 管理状态       │         │ - 编写代码        │
│ - 展示 UI        │         │ - 执行施工        │
└──────────────────┘         └──────────────────┘
```

---

## 5. 核心技术选型

| 层次            | 选型                             | 理由                                |
| --------------- | -------------------------------- | ----------------------------------- |
| **语言**        | TypeScript (Node.js)             | JS 生态最广，npx 分发零摩擦         |
| **运行时**      | Node.js 18+                      | LTS，ESM 原生支持                   |
| **CLI 框架**    | `commander` + `chalk` + `ora`    | 轻量、主流                          |
| **Web UI**      | React 18 + Vite                  | 构建快，HMR，打包体积小             |
| **UI 组件**     | 纯手写 + shadcn/ui (可选)        | 避免重量级依赖                      |
| **Web Server**  | `hono` (轻量 HTTP 框架)          | 比 Express 轻 10 倍，支持 WebSocket |
| **WebSocket**   | `ws` 或 hono 内置                | 用户编辑时实时推送到面板            |
| **图表 (V2)**   | Mermaid.js                       | 架构图/流程图，纯前端渲染           |
| **状态存储**    | 本地 JSON 文件（`.spec-align/`） | 零依赖，可 git 纳入版本管理         |
| **打包发布**    | npm publish                      | npx 直接可用                        |
| **编译 (可选)** | `bun build` → 单文件二进制       | 彻底免 Node，进一步降低门槛         |
| **测试**        | Vitest                           | 与 Vite 同生态，速度快              |
| **Monorepo**    | npm workspaces 或 turborepo      | cli + ui + shared 多包管理          |

### 为什么不用 Python？

Python 分发有虚拟环境问题，`pip install` 对非 Python 开发者不够友好。`npx spec-thought-align` 一句话即可。

### 为什么不用 Electron / Tauri？

太重。浏览器人人都有，本地 Web Server + 浏览器即可，零安装增量。

### 为什么用 hono 而不是 express？

- 更小（hono ~10KB vs express ~600KB）
- 内置 WebSocket 支持
- 边缘优先设计，同样适合本地服务
- TypeScript-first

---

## 6. 项目结构

```
spec-thought-align/
├── README.md                     # 中英双语，GIF 演示，3 步 Quick Start
├── CONTRIBUTING.md
├── LICENSE                       # MIT
├── CHANGELOG.md
├── package.json                  # workspace root
│
├── packages/
│   ├── cli/                      # CLI 入口 + 本地服务 + 规约引擎
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts          # CLI 主入口
│   │   │   ├── commands/
│   │   │   │   ├── submit.ts     # submit 命令
│   │   │   │   ├── fetch.ts      # fetch 命令
│   │   │   │   ├── status.ts     # status 命令
│   │   │   │   ├── config.ts     # config 命令
│   │   │   │   └── complete.ts   # complete 命令
│   │   │   ├── server/
│   │   │   │   ├── index.ts      # HTTP Server (hono)
│   │   │   │   ├── routes.ts     # API 路由
│   │   │   │   └── ws.ts         # WebSocket 处理
│   │   │   ├── engine/
│   │   │   │   ├── parser.ts     # 文本解析引擎（规则匹配）
│   │   │   │   ├── llm.ts        # [可选] LLM 结构化提取
│   │   │   │   └── template.ts   # 规约模板定义
│   │   │   ├── storage/
│   │   │   │   └── index.ts      # 文件读写、状态管理
│   │   │   └── utils/
│   │   │       ├── browser.ts    # 打开浏览器
│   │   │       └── port.ts       # 端口检测
│   │   └── tsconfig.json
│   │
│   ├── ui/                       # Web 可视化面板
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── api.ts            # 与 Server 通信
│   │   │   ├── panels/
│   │   │   │   ├── GoalPanel.tsx        # 核心目标
│   │   │   │   ├── ScopePanel.tsx       # 范围与边界
│   │   │   │   ├── ArchitecturePanel.tsx # 架构/组件树
│   │   │   │   ├── AssumptionsPanel.tsx  # Agent 假设（带置信度标色）
│   │   │   │   ├── ClarifyPanel.tsx      # 待澄清问题
│   │   │   │   ├── IOPanel.tsx           # 输入输出 & 验收标准
│   │   │   │   └── ConfirmPanel.tsx      # 最终确认
│   │   │   ├── components/
│   │   │   │   ├── ConfidenceBadge.tsx   # 置信度标签
│   │   │   │   ├── EditableField.tsx     # 可编辑字段
│   │   │   │   ├── RawAnalysis.tsx       # Agent 原始思考展示
│   │   │   │   └── ProgressBar.tsx       # 完成度进度
│   │   │   ├── hooks/
│   │   │   │   ├── useSpec.ts           # 规约数据 hook
│   │   │   │   └── useWebSocket.ts      # WebSocket hook
│   │   │   └── styles/
│   │   │       └── globals.css
│   │   └── tsconfig.json
│   │
│   └── shared/                   # 共享类型和工具
│       ├── package.json
│       ├── src/
│       │   ├── types.ts          # 规约完整类型定义
│       │   ├── constants.ts      # 常量
│       │   └── utils.ts
│       └── tsconfig.json
│
├── examples/                     # 示例规约（降低上手门槛）
│   ├── basic-mvp/
│   │   └── spec.json
│   ├── fullstack-app/
│   │   └── spec.json
│   └── api-endpoint/
│       └── spec.json
│
├── docs/
│   ├── DESIGN.md                 # 本文档
│   ├── quick-start.md
│   ├── agent-integration.md      # 各 Agent 集成指南
│   ├── spec-schema.md            # 规约 Schema 详细文档
│   └── contributing.md
│
├── scripts/
│   └── dev.js                    # 开发启动脚本
│
└── .github/
    ├── workflows/
    │   └── ci.yml                # lint + test + build
    └── ISSUE_TEMPLATE.md
```

---

## 7. 核心数据结构

### 7.1 Input：Agent 提交的原始数据（极简）

```typescript
interface SpecInput {
  meta: {
    id: string; // 任务唯一标识
    timestamp: string; // ISO 8601
    agentType?: string; // 可选：标识来源 Agent
  };

  // Agent 只需传这两个纯文本字段
  request: string; // 用户的原始需求描述
  analysis: string; // Agent 的自然语言思考分析
}
```

### 7.2 Spec：结构化规约（spec-thought-align 提取 + 用户确认）

```typescript
interface Spec {
  meta: SpecInput['meta'] & {
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    confirmedAt?: string;
  };

  // === 结构化字段（由 spec-thought-align 提取或用户手动填充） ===

  // 1. 核心理解
  understanding: {
    goal: string; // 核心目标（一句话）
    context: string; // 背景/现状
    rawRequest: string; // 用户原始需求（引用）
  };

  // 2. 范围与边界
  scope: {
    inScope: string[]; // 明确要做的事
    outOfScope: string[]; // 明确不做的事
    constraints: string[]; // 技术/业务约束
    assumptions: Assumption[]; // ⚠️ 最关键：Agent 的假设
  };

  // 3. 技术方案
  plan: {
    architecture: string; // 文字描述 (V2: Mermaid)
    components: Component[]; // 组件/模块拆分
    dataFlow?: string; // 数据流
    techStack: string[]; // 技术栈
  };

  // 4. 输入输出
  io: {
    inputs: IODescriptor[];
    outputs: IODescriptor[];
    acceptanceCriteria: string[]; // 验收标准
  };

  // 5. 待澄清问题
  questions: Question[];

  // 6. 用户补充
  userAdditions: {
    notes: string; // 用户通用补充
    fieldEdits: FieldEdit[]; // 用户对特定字段的修改记录
  };
}

// === 子类型 ===

interface Assumption {
  id: string;
  text: string; // 假设内容
  confidence: 'high' | 'medium' | 'low'; // Agent 的置信度
  needsConfirmation: boolean; // 是否需要用户确认
  userConfirmed?: boolean; // 用户是否已确认
  userNote?: string; // 用户的补充说明
}

interface Component {
  name: string;
  description: string;
  dependencies: string[];
  files?: string[];
}

interface IODescriptor {
  name: string;
  type: string;
  description: string;
}

interface Question {
  id: string;
  question: string;
  options?: string[]; // 可选项（降低用户输入成本）
  importance: 'critical' | 'important' | 'nice-to-have';
  userAnswer?: string; // 用户回答
}

interface FieldEdit {
  field: string; // 被编辑的字段路径，如 "scope.assumptions[0].text"
  oldValue: string;
  newValue: string;
}
```

### 7.3 状态生命周期

```
                    ┌──────────┐
           submit → │ pending  │
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
        ┌─────────┐ ┌──────────┐ ┌───────────┐
        │confirmed│ │cancelled │ │  timeout   │
        └────┬────┘ └──────────┘ └───────────┘
             │
        complete
             │
             ▼
        ┌───────────┐
        │ completed │
        └───────────┘
```

---

## 8. 进度对齐机制

### 8.1 主力方案：阻塞等待（`--wait`）

Agent 执行命令后进程阻塞，直到用户在 Web UI 确认或取消：

```bash
npx spec-thought-align submit \
  --id "task-001" \
  --request "用户需求..." \
  --analysis "Agent分析..." \
  --wait \
  --timeout 600
```

**实现原理**：

```
submit --wait 内部流程:
  1. 启动/复用本地 HTTP Server (默认端口 5678)
  2. 将原始文本写入 .spec-align/task-001/
  3. [可选] 调用 LLM 做结构化提取
  4. 打开浏览器 → http://localhost:5678/task-001
  5. 进入轮询循环:
     while true:
       sleep 2s
       read .spec-align/task-001/status.json
       if status == "confirmed":
         输出最终规约 JSON 到 stdout
         exit 0
       if status == "cancelled":
         exit 2
       if elapsed > timeout:
         exit 1
```

**退出码约定**：

| 退出码 | 含义     | Agent 行为                               |
| ------ | -------- | ---------------------------------------- |
| 0      | 用户确认 | stdout 为最终规约 JSON，Agent 解析后施工 |
| 1      | 超时     | Agent 可重试或降级（不经过确认直接施工） |
| 2      | 用户取消 | Agent 停止当前任务                       |

### 8.2 辅助方案：分步非阻塞

```bash
# 提交规约（立即返回）
npx spec-thought-align submit --id "task-001" --request "..." --analysis "..." --no-wait

# 查询状态
npx spec-thought-align status --id "task-001"
# → {"status":"pending","url":"http://localhost:5678/task-001"}

# 确认后拉取
npx spec-thought-align fetch --id "task-001"
# → {...最终规约 JSON...}
```

### 8.3 Agent 完整工作流

```
Agent 收到需求
  │
  ├─ Step 1: 内部分析，自然语言输出思考
  │
  ├─ Step 2: npx spec-thought-align submit --wait
  │          [进程阻塞，等待用户确认]
  │          stdout: 最终规约 JSON
  │
  ├─ Step 3: 解析 JSON，提取关键信息
  │     goal, scope, assumptions, questions →
  │
  ├─ Step 4: 按规约施工
  │     有不确定的地方随时:
  │     npx spec-thought-align status --id "task-001"
  │     (检查用户是否补充了新信息)
  │
  └─ Step 5: 施工完成
        npx spec-thought-align complete --id "task-001" --summary "做了什么"
```

### 8.4 施工中持续对齐（V2 方向）

```bash
# Agent 施工过程中可随时核对是否偏离规约
npx spec-thought-align check --id "task-001" \
  --current "当前实际在做的步骤..." \
  --diff
# → 输出偏离检测结果
```

---

## 9. Token 优化策略

### 9.1 问题：Agent 反复思考浪费 Token

**传统做法（浪费）**：

```
Agent 内部分析（思考1）→ 格式化为 JSON（思考2）→ 提交 spec-thought-align
→ 等待确认 → 重新消化规约（思考3）→ 施工
        ↑ 同一份理解被「翻译」了 3 遍
```

**Spec-Align 做法（节省）**：

```
Agent 内部分析（思考1，唯一一次）→ 原始文本传给 spec-thought-align
→ spec-thought-align 做结构化提取（用规则或便宜模型）
→ 用户确认 → 最终规约返回 Agent → 施工
        ↑ Agent 的思考只发生一次
```

### 9.2 三级提取策略

```
Level 1: 纯规则提取（默认，零 Token）
  ┌─────────────────────────────────────┐
  │ Agent 原始思考文本                     │
  │                                       │
  │ 输入 → 规则匹配 → 半结构化的面板数据    │
  │                                       │
  │ 规则示例:                              │
  │ - "假设/可能/应该" → 标记为 assumption │
  │ - "技术栈/用XX做" → 提取为 techStack   │
  │ - "不确定/不清楚" → 生成 question       │
  │ - "1. 2. - *" → 列表提取              │
  │                                       │
  │ 成本: 0 token（纯 JS 字符串处理）        │
  │ 体验: 面板部分预填，用户手动补全         │
  └─────────────────────────────────────┘

Level 2: LLM 自动提取（可选，极低成本）
  ┌─────────────────────────────────────┐
  │ 用户配置: npx spec-thought-align config set   │
  │   llm.provider "openai"              │
  │   llm.model "gpt-4o-mini"            │
  │   llm.apiKey "sk-xxx"                │
  │                                       │
  │ 流程:                                  │
  │ 原始文本 → 小模型 → 结构化 JSON        │
  │                                       │
  │ 成本: ~500 input + ~1000 output tokens │
  │       ≈ $0.0003 (GPT-4o-mini)         │
  │       ≈ 比 Agent 自己做便宜 50-100 倍   │
  │                                       │
  │ 体验: 面板预填完整，用户只需微调         │
  └─────────────────────────────────────┘

Level 3: 本地模型（V2，零成本+零隐私泄露）
  ┌─────────────────────────────────────┐
  │ 用户本机运行 Ollama / llama.cpp        │
  │                                       │
  │ 成本: 0（本地推理）                     │
  │ 隐私: 数据不离开本机                    │
  └─────────────────────────────────────┘
```

### 9.3 Token 对比

| 环节                    | 传统做法            | Spec-Align Level 1 | Spec-Align Level 2  |
| ----------------------- | ------------------- | ------------------ | ------------------- |
| Agent 内部分析          | 正常                | 正常               | 正常                |
| Agent 格式化输出        | **额外 1-2K token** | **0**              | **0**               |
| spec-thought-align 提取 | 不存在              | 0（纯规则）        | ~1.5K（便宜模型）   |
| 总增量                  | +1-2K token         | **0**              | +1.5K（但便宜 50x） |

**结论**：Level 1 模式完全消除 Agent 侧增量 token 消耗；Level 2 模式将 token 消耗从昂贵模型转移到便宜模型。

### 9.4 Agent 侧零负担 Prompt

只需在 Agent 的 system prompt 或项目 rules 中加入：

```markdown
## 需求确认流程

在编写代码前，按以下步骤确认需求：

1. 用自然语言输出你对需求的理解和分析
   - 包含你的假设
   - 标注你不确定的地方
   - 不需要格式化，想到哪写到哪

2. 调用确认命令：
```

npx spec-thought-align submit \
--id "<任务名>" \
--request "<用户原始需求>" \
--analysis "<你的分析文本>" \
--wait

```

3. 等待命令返回规约 JSON，解析后按规约施工

注意：你不需要格式化 JSON，不需要管理状态，
只需把你的原始思考传给 spec-thought-align 即可。
```

---

## 10. Web UI 面板设计

### 10.1 整体布局

```
┌──────────────────────────────────────────────────────────────┐
│  🎯 Spec-Align                          task-001 | pending  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ Left Panel (40%) ────────┐  ┌─ Right Panel (60%) ────┐  │
│  │                            │  │                         │  │
│  │  📝 Agent 原始思考          │  │  📋 结构化规约           │  │
│  │                            │  │                         │  │
│  │  ┌──────────────────────┐ │  │  🎯 核心目标             │  │
│  │  │ "我理解需求如下：      │ │  │  [可编辑]               │  │
│  │  │ 1. 核心是登录表单...  │ │  │                         │  │
│  │  │ 2. 用JWT做会话管理... │ │  │  🔴 假设与风险 (3个)     │  │
│  │  │ 3. 假设用React+TW... │ │  │  ┌────────────────────┐ │  │
│  │  │ 4. 不确定密码强度...  │ │  │  │ ● high: React+TW   │ │  │
│  │  │ 5. 错误处理打算用...  │ │  │  │ 🟡 med: toast提示  │ │  │
│  │  │     ...              │ │  │  │ 🔴 low: 无需记住我  │ │  │
│  │  └──────────────────────┘ │  │  └────────────────────┘ │  │
│  │                            │  │                         │  │
│  │  (只读，参考对照用)          │  │  📥 输入 / 📤 输出      │  │
│  │                            │  │  [可编辑]               │  │
│  │                            │  │                         │  │
│  │                            │  │  🧱 架构/组件           │  │
│  │                            │  │  [可编辑]               │  │
│  │                            │  │                         │  │
│  │                            │  │  ⚠️ 边界约束             │  │
│  │                            │  │  [可编辑]               │  │
│  │                            │  │                         │  │
│  │                            │  │  ❓ 待澄清问题 (2个)     │  │
│  │                            │  │  Q1: 密码强度要求？     │  │
│  │                            │  │   ○ ≥8位 ○ 含特殊字符  │  │
│  │                            │  │  Q2: 失败锁定策略？     │  │
│  │                            │  │   ○ 不锁定 ○ 5次30分  │  │
│  │                            │  │                         │  │
│  │                            │  │  ✅ 验收标准             │  │
│  │                            │  │  [可编辑]               │  │
│  │                            │  │                         │  │
│  │                            │  └─────────────────────────┘  │
│  └────────────────────────────┘                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  [补充说明] 自由文本框...                   完成度: 60%   │ │
│  │                                                          │ │
│  │              [ 取消 ]    [ 保存草稿 ]    [ ✅ 确认开始 ]  │ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 10.2 关键交互设计

| 交互                   | 说明                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **置信度色标**         | 🔴 Low（红色边框）= 用户必须确认 / 🟡 Medium（黄色）= 建议确认 / 🟢 High（绿色）= 可信 |
| **行内编辑**           | 点击任意字段直接编辑，失焦自动保存                                                     |
| **左右对照**           | 左侧展示 Agent 原始思考（只读），右侧展示结构化面板（可编辑）                          |
| **自动高亮**           | 当用户在右侧编辑时，左侧自动滚动到相关段落                                             |
| **添加项**             | inScope / outOfScope / constraints / acceptanceCriteria 支持动态增减                   |
| **问答交互**           | 有选项的用 Radio/Checkbox（点击即答），无选项的用输入框                                |
| **进度条**             | 实时显示规约完整度（还有多少字段未填/未确认）                                          |
| **WebSocket 实时同步** | 用户编辑时立即写入文件，Agent 可随时拉取最新状态                                       |

### 10.3 移动端适配（V2）

- 响应式布局：小屏时面板上下堆叠
- Touch-friendly：大按钮、大输入框
- PWA 可选：可添加到主屏幕

---

## 11. CLI 命令参考

### 11.1 核心命令

```bash
# 提交规约（阻塞等待确认）
npx spec-thought-align submit \
  --id <task-id>              # 必填，任务唯一标识
  --request <text>            # 必填，用户原始需求
  --analysis <text>           # 必填，Agent 思考分析
  --wait                      # 阻塞等待用户确认（默认）
  --no-wait                   # 立即返回，不等待
  --timeout <seconds>         # 超时秒数（默认 600）
  --port <port>               # 指定端口（默认自动分配）

# 查询状态
npx spec-thought-align status --id <task-id>
# 输出: {"status":"pending"|"confirmed"|"cancelled"|"completed"}

# 拉取最终规约
npx spec-thought-align fetch --id <task-id>
# 输出: 完整规约 JSON

# 标记完成
npx spec-thought-align complete --id <task-id> --summary <text>

# 列表所有任务
npx spec-thought-align list
# 输出: [{id, status, goal, createdAt}, ...]
```

### 11.2 配置命令

```bash
# 查看当前配置
npx spec-thought-align config

# 配置 LLM（启用自动提取）
npx spec-thought-align config set llm.provider "openai"
npx spec-thought-align config set llm.apiKey "sk-xxx"
npx spec-thought-align config set llm.model "gpt-4o-mini"
npx spec-thought-align config set llm.baseUrl "https://api.openai.com/v1"

# 配置端口
npx spec-thought-align config set server.port 5678

# 配置存储路径
npx spec-thought-align config set storage.path ".spec-align"

# 重置配置
npx spec-thought-align config reset
```

### 11.3 开发调试命令

```bash
# 启动 Web UI 开发模式
npx spec-thought-align dev

# 模拟提交（不启动 Agent）
npx spec-thought-align mock --id "demo-001"
```

---

## 12. V1 功能边界

### ✅ V1 必须实现

| 功能            | 说明                                     |
| --------------- | ---------------------------------------- |
| `submit --wait` | 核心命令：提交规约 → 打开面板 → 等待确认 |
| `fetch`         | 拉取确认后的规约 JSON                    |
| `status`        | 查询任务状态                             |
| `config`        | 基本配置管理                             |
| Web UI 面板     | 左右对照布局：原始思考 + 结构化面板      |
| 置信度色标      | 🔴🟡🟢 三色标注 Agent 假设               |
| 行内编辑        | 所有字段可点击编辑                       |
| Q&A 交互        | 选择题 + 文本题                          |
| 确认/取消       | 确认后写入文件，取消后标记状态           |
| 本地存储        | `.spec-align/` 目录，纯 JSON             |
| Level 1 提取    | 纯规则匹配预填充（关键字识别）           |
| 跨平台          | Windows / macOS / Linux                  |
| `npx` 分发      | npm 发布，npx 直接可用                   |

### ❌ V2 再做

| 功能                           | 优先级   |
| ------------------------------ | -------- |
| LLM 自动提取（Level 2）        | 高——V1.1 |
| Mermaid 架构图渲染             | 中——V2   |
| MCP Server 模式                | 中——V2   |
| 施工中偏离检测（`check` 命令） | 中——V2   |
| 历史对比 / diff                | 低——V2   |
| 规约模板自定义                 | 低——V2   |
| 本地模型支持（Level 3）        | 低——V2   |
| PWA 移动端支持                 | 低——V2   |
| 多 Agent 协作规约              | 低——V3   |

---

## 13. 开源路线图

### Phase 0：项目初始化（1-2 天）

- [ ] 创建仓库 `github.com/<org>/spec-thought-align`
- [ ] Monorepo 骨架搭建
- [ ] TypeScript 配置
- [ ] ESLint + Prettier + Vitest 配置
- [ ] CI/CD (GitHub Actions: lint + test + build)

### Phase 1：CLI 核心 + 最小 UI（1-2 周）

- [ ] CLI 框架：`commander` + `submit` / `fetch` / `status` 命令
- [ ] 本地 HTTP Server：`hono` + 基本 API 路由
- [ ] Web UI：Vite + React 项目初始化
- [ ] 面板骨架：左右分栏布局
- [ ] 核心面板：GoalPanel, AssumptionsPanel, ConfirmPanel
- [ ] 文件存储层：`.spec-align/` 读写
- [ ] `--wait` 阻塞逻辑：轮询状态文件
- [ ] npm 发布

### Phase 2：UI 完善 + 发布（1 周）

- [ ] 剩余面板：ScopePanel, IOPanel, ClarifyPanel
- [ ] 置信度色标样式
- [ ] 行内编辑交互
- [ ] 问答交互组件
- [ ] WebSocket 实时同步
- [ ] Level 1 规则匹配引擎（关键字提取）
- [ ] README + 文档 + GIF 演示
- [ ] `examples/` 示例规约

### Phase 3：推广迭代

- [ ] Level 2 LLM 自动提取
- [ ] 各 Agent 集成教程（Cline / Cursor / Aider / Claude Code）
- [ ] 社区反馈收集
- [ ] 根据反馈规划 V2

### 发布 Checklist

| 项目        | 内容                                               |
| ----------- | -------------------------------------------------- |
| **README**  | 中英双语、顶部 GIF 演示、3 步 Quick Start          |
| **LICENSE** | MIT                                                |
| **文档**    | Quick Start / API 参考 / Agent 集成指南            |
| **示例**    | `examples/` 目录 3 个典型场景                      |
| **社区**    | Issue 模板、PR 模板                                |
| **推广**    | V2EX / Twitter(X) / Reddit r/cursor r/CLine / 掘金 |

---

## 附录

### A. Agent Prompt 注入模板

在任意 Agent 的项目 rules 或 system prompt 中加入：

````markdown
## 需求确认流程（Spec-Align）

在开始编写代码前：

1. 用自然语言描述你对需求的理解和分析
   - 写下你的假设和不确定的地方
   - 不需要格式化，自由表达

2. 将分析提交确认：
   ```bash
   npx spec-thought-align submit \
     --id "<任务名>" \
     --request "<用户原始需求>" \
     --analysis "<你的完整分析>" \
     --wait
   ```
````

3. 命令返回的 JSON 是最终规约，严格按它施工

如果 npx spec-thought-align 不可用，跳过此流程直接施工。

```

### B. 配色方案

| 元素 | 颜色 | 用途 |
|------|------|------|
| 主色 | `#3B82F6` (Blue-500) | 按钮、链接、强调 |
| 高置信度 | `#22C55E` (Green-500) | 绿色边框/标签 |
| 中置信度 | `#F59E0B` (Amber-500) | 黄色边框/标签 |
| 低置信度 | `#EF4444` (Red-500) | 红色边框/标签 + 脉冲动画 |
| 背景 | `#0F172A` (Slate-900) | 暗色模式主背景 |
| 卡片 | `#1E293B` (Slate-800) | 面板卡片背景 |
| 文字 | `#F1F5F9` (Slate-100) | 主文字色 |

---

> **最后更新**: 2026-07-02
> **作者**: Spec-Align Team
> **License**: MIT
```
