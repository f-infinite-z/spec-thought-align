// ============================================================
// Spec-Align 核心类型定义
// ============================================================

// ---- Agent 原始输入 ----

export interface SpecInput {
  meta: SpecMeta;
  /** 用户原始需求 */
  request: string;
  /** Agent 自然语言分析 */
  analysis: string;
}

export interface SpecMeta {
  id: string;
  timestamp: string;
  agentType?: string;
}

// ---- 状态 ----

export type SpecStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

// ---- 置信度 ----

export type Confidence = 'high' | 'medium' | 'low';

// ---- 重要性 ----

export type Importance = 'critical' | 'important' | 'nice-to-have';

// ---- 结构化规约 ----

export interface Spec {
  meta: SpecMeta & {
    status: SpecStatus;
    confirmedAt?: string;
    completedAt?: string;
  };
  input: SpecInput;
  understanding: SpecUnderstanding;
  scope: SpecScope;
  plan: SpecPlan;
  io: SpecIO;
  questions: Question[];
  userAdditions: UserAdditions;
}

export interface SpecUnderstanding {
  goal: string;
  context: string;
  rawRequest: string;
}

export interface SpecScope {
  inScope: string[];
  outOfScope: string[];
  constraints: string[];
  assumptions: Assumption[];
}

export interface Assumption {
  id: string;
  text: string;
  confidence: Confidence;
  needsConfirmation: boolean;
  userConfirmed?: boolean;
  userNote?: string;
}

export interface SpecPlan {
  architecture: string;
  components: Component[];
  dataFlow?: string;
  techStack: string[];
}

export interface Component {
  name: string;
  description: string;
  dependencies: string[];
  files?: string[];
}

export interface SpecIO {
  inputs: IODescriptor[];
  outputs: IODescriptor[];
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
  options?: string[];
  importance: Importance;
  userAnswer?: string;
}

export interface UserAdditions {
  notes: string;
  fieldEdits: FieldEdit[];
}

export interface FieldEdit {
  field: string;
  oldValue: string;
  newValue: string;
}

// ---- CLI 输出 ----

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

// ---- API ----

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ---- 配置 ----

export interface SpecAlignConfig {
  server: {
    port: number;
    host: string;
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
  ui: {
    autoOpen: boolean;
  };
}

// ============================================================
// 任务编排
// ============================================================

export type SubTaskStatus = 'pending' | 'in-progress' | 'done' | 'failed';

export interface SubTask {
  id: string;
  description: string;
  relatedScope: string[];
  acceptanceCriteria: string[];
  status: SubTaskStatus;
  agentNote: string;
  dependencies: string[];
  context?: SubTaskContext;
}

export interface SubTaskContext {
  goal?: string;
  techStack?: string[];
  architecture?: string;
  constraints?: string[];
  outOfScope?: string[];
}

export interface TaskManifest {
  taskId: string;
  createdAt: string;
  subtasks: SubTask[];
}

export interface SubTaskStatusResult {
  id: string;
  description: string;
  status: SubTaskStatus;
  acceptanceCriteria: string[];
  agentNote: string;
  dependencies: string[];
}

// ============================================================
// 平台适配器（半硬约束触发规则）
// ============================================================

export type TriggerAction = 'skip' | 'suggest' | 'require';

export interface TriggerContext {
  fileCount?: number;
  files?: string[];
  complexity?: 'low' | 'medium' | 'high';
  userRequest?: string;
  isNewFeature?: boolean;
  isBugFix?: boolean;
  hasArchitectureChange?: boolean;
  hasAmbiguity?: boolean;
  hasDetailedContext?: boolean;
}

export interface TriggerRuleDef {
  name: string;
  description: string;
  evaluate: (ctx: TriggerContext) => boolean;
  action: TriggerAction;
  priority: number;
  reason: string;
}

export interface TriggerResult {
  shouldTrigger: boolean;
  mode: TriggerAction;
  reason: string;
  matchedRules: Array<{
    name: string;
    matched: boolean;
    action: TriggerAction;
    reason: string;
  }>;
}

export interface PlatformIntegration {
  configFilePath: string;
  configTemplate: string;
  detectEnvVars: string[];
  recommendedStrategy: 'wait' | 'no-wait';
  knownTimeoutSeconds?: number;
}

export interface PlatformAdapter {
  id: string;
  name: string;
  displayName: string;
  integration: PlatformIntegration;
  triggerRules: TriggerRuleDef[];
  shouldTrigger(context: TriggerContext): TriggerResult;
  detectPlatform(): boolean;
}
