# Spec-Align 核心类型定义

> 这是规约系统的数据契约。CLI、Server、Web UI 都依赖这些类型。

```typescript
// ============================================================
// Agent 提交的原始输入（极简，Agent 不需要学习任何新格式）
// ============================================================

export interface SpecInput {
  meta: {
    /** 任务唯一标识，如 "login-page" */
    id: string;
    /** ISO 8601 时间戳 */
    timestamp: string;
    /** 来源 Agent 类型（可选，如 "cline" | "cursor" | "aider"） */
    agentType?: string;
  };
  /** 用户的原始需求描述（直接引用） */
  request: string;
  /** Agent 的自然语言思考分析（不需要格式化） */
  analysis: string;
}

// ============================================================
// 规约状态
// ============================================================

export type SpecStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

// ============================================================
// 置信度
// ============================================================

export type Confidence = 'high' | 'medium' | 'low';

// ============================================================
// 结构化规约（spec-align 提取 + 用户确认后的最终产物）
// ============================================================

export interface Spec {
  meta: SpecInput['meta'] & {
    status: SpecStatus;
    confirmedAt?: string;
    completedAt?: string;
  };

  /** 1. 核心理解 */
  understanding: SpecUnderstanding;

  /** 2. 范围与边界 */
  scope: SpecScope;

  /** 3. 技术方案 */
  plan: SpecPlan;

  /** 4. 输入输出 */
  io: SpecIO;

  /** 5. 待澄清问题 */
  questions: Question[];

  /** 6. 用户补充 */
  userAdditions: UserAdditions;
}

// ============================================================
// 子类型
// ============================================================

export interface SpecUnderstanding {
  /** 核心目标（一句话） */
  goal: string;
  /** 背景/现状描述 */
  context: string;
  /** 用户原始需求引用 */
  rawRequest: string;
}

export interface SpecScope {
  /** 明确要做的事 */
  inScope: string[];
  /** 明确不做的事 */
  outOfScope: string[];
  /** 技术/业务约束 */
  constraints: string[];
  /** Agent 的假设（关键字段） */
  assumptions: Assumption[];
}

export interface Assumption {
  id: string;
  /** 假设内容 */
  text: string;
  /** Agent 对此假设的置信度 */
  confidence: Confidence;
  /** 是否需要用户确认 */
  needsConfirmation: boolean;
  /** 用户是否已确认 */
  userConfirmed?: boolean;
  /** 用户的补充说明 */
  userNote?: string;
}

export interface SpecPlan {
  /** 架构描述（V1 文字，V2 支持 Mermaid） */
  architecture: string;
  /** 组件/模块拆分 */
  components: Component[];
  /** 数据流描述 */
  dataFlow?: string;
  /** 技术栈 */
  techStack: string[];
}

export interface Component {
  name: string;
  description: string;
  dependencies: string[];
  /** 涉及的文件 */
  files?: string[];
}

export interface SpecIO {
  inputs: IODescriptor[];
  outputs: IODescriptor[];
  /** 验收标准 */
  acceptanceCriteria: string[];
}

export interface IODescriptor {
  name: string;
  type: string;
  description: string;
}

export interface Question {
  id: string;
  question: string;
  /** 可选项（提供选项降低用户输入成本） */
  options?: string[];
  importance: 'critical' | 'important' | 'nice-to-have';
  /** 用户的回答 */
  userAnswer?: string;
}

export interface UserAdditions {
  /** 用户通用备注 */
  notes: string;
  /** 用户对特定字段的修改记录 */
  fieldEdits: FieldEdit[];
}

export interface FieldEdit {
  /** 字段路径，如 "scope.assumptions[0].text" */
  field: string;
  oldValue: string;
  newValue: string;
}

// ============================================================
// CLI 输出类型
// ============================================================

export interface StatusResult {
  id: string;
  status: SpecStatus;
  url?: string;
  createdAt: string;
  goal?: string;
}

export interface ListResult {
  tasks: StatusResult[];
}

// ============================================================
// Server API 类型
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================
// 配置类型
// ============================================================

export interface SpecAlignConfig {
  server: {
    port: number;
  };
  storage: {
    path: string;
  };
  llm: {
    provider: 'openai' | 'custom';
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    enabled: boolean;
  };
}
```

## 面板字段可编辑性

| 字段                             | 可编辑 | 说明                                 |
| -------------------------------- | ------ | ------------------------------------ |
| `understanding.goal`             | ✅     | 用户可修正 Agent 理解的核心目标      |
| `understanding.context`          | ✅     | 补充背景信息                         |
| `scope.inScope[]`                | ✅     | 增删改                               |
| `scope.outOfScope[]`             | ✅     | 增删改                               |
| `scope.constraints[]`            | ✅     | 增删改                               |
| `scope.assumptions[].text`       | ✅     | 修正 Agent 假设                      |
| `scope.assumptions[].confidence` | ❌     | Agent 设定的，不可改（反映原始判断） |
| `scope.assumptions[].userNote`   | ✅     | 用户补充                             |
| `plan.architecture`              | ✅     | 修正架构                             |
| `plan.components[]`              | ✅     | 增删改组件                           |
| `plan.techStack[]`               | ✅     | 增删改                               |
| `io.inputs[]`                    | ✅     | 增删改                               |
| `io.outputs[]`                   | ✅     | 增删改                               |
| `io.acceptanceCriteria[]`        | ✅     | 增删改                               |
| `questions[].userAnswer`         | ✅     | 回答问题                             |
| `questions[].question`           | ⚠️     | 用户可补充新问题                     |
| `userAdditions.notes`            | ✅     | 自由文本                             |
