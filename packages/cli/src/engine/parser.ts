import type { Assumption, Question, Component, Confidence } from '@spec-thought-align/shared';
import { generateId } from '@spec-thought-align/shared';

// ============================================================
// 输入输出类型
// ============================================================

export interface ParsedSpec {
  goal: string;
  context: string;
  assumptions: Assumption[];
  questions: Question[];
  techStack: string[];
  inScope: string[];
  outOfScope: string[];
  constraints: string[];
  architecture: string;
  components: Component[];
  acceptanceCriteria: string[];
}

// ============================================================
// 输入标准化
// ============================================================

function normalizeAnalysis(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

// ============================================================
// 子句拆分
// ============================================================

const SUB_CLAUSE_SPLITTERS = /(以及|还有|另外|此外|同时|并且|再者|进而)\s*/;
const ALTERNATIVE_SPLITTERS = /\s*(?:还是|或|或者)\s*/;

function splitCompoundText(text: string): string[] {
  const parts = text.split(SUB_CLAUSE_SPLITTERS);
  const result: string[] = [];
  let current = '';

  for (const part of parts) {
    if (SUB_CLAUSE_SPLITTERS.test(part + ' ')) {
      if (current.trim()) result.push(current.trim());
      current = '';
    } else {
      current += part;
    }
  }
  if (current.trim()) result.push(current.trim());

  if (result.length <= 1) return [text];

  return result.filter((p) => p.length > 2);
}

function splitAlternatives(text: string): string[] {
  if (text.length < 60) return [text];

  const parts = text.split(ALTERNATIVE_SPLITTERS).filter((p) => p.trim().length > 0);
  if (parts.length <= 1) return [text];

  const baseQuestion = extractQuestionStem(parts[0]);
  if (!baseQuestion) return [text];

  const options = [parts[0].trim()];
  for (let i = 1; i < parts.length; i++) {
    options.push(baseQuestion + parts[i].trim());
  }
  return options.filter((o) => o.length > 3);
}

function extractQuestionStem(firstPart: string): string | null {
  const words = firstPart.split(/\s+/);
  if (words.length < 2) return null;

  const lastWord = words[words.length - 1];
  if (lastWord.length <= 2) return words.slice(0, -1).join(' ') + ' ';

  if (
    lastWord.endsWith('用') ||
    lastWord.endsWith('做') ||
    lastWord.endsWith('要') ||
    lastWord.endsWith('选')
  ) {
    return words.slice(0, -1).join(' ') + ' ';
  }

  return null;
}

// ============================================================
// 核心解析函数
// ============================================================

export function parseAnalysis(analysis: string, request?: string): ParsedSpec {
  const normalized = normalizeAnalysis(analysis);
  const segments = splitIntoSegments(normalized);

  const result: ParsedSpec = {
    goal: '',
    context: '',
    assumptions: [],
    questions: [],
    techStack: [],
    inScope: [],
    outOfScope: [],
    constraints: [],
    architecture: '',
    components: [],
    acceptanceCriteria: [],
  };

  result.goal = extractGoal(segments, request);
  result.context = extractContext(segments);

  // 第一遍：收集所有技术栈（每个 segment 都检查）
  for (const seg of segments) {
    const techs = extractTechStack(seg.text);
    for (const t of techs) {
      if (!result.techStack.includes(t)) result.techStack.push(t);
    }
  }

  // 第二遍：分类
  for (const seg of segments) {
    const text = seg.text.trim();
    if (!text) continue;

    // 跳过纯标题（太短 + 以冒号结尾的）
    if (isSectionHeader(text)) continue;

    // 范围检测（优先级最高）
    if (isOutOfScope(text)) {
      result.outOfScope.push(cleanScope(text));
      continue;
    }

    if (isConstraint(text)) {
      result.constraints.push(cleanScope(text));
      continue;
    }

    // 显示不确定 → 拆分为多个问题 + 低置信假设
    if (isUncertaintyMarker(text)) {
      const cleaned = cleanUncertainty(text);
      const subClauses = splitCompoundText(cleaned);

      for (const sub of subClauses) {
        if (sub.length < 3) continue;
        result.questions.push({
          id: generateId('q'),
          question: sub,
          importance: 'critical',
        });
        result.assumptions.push({
          id: generateId('a'),
          text: sub,
          confidence: 'low',
          needsConfirmation: true,
        });
      }
      continue;
    }

    // 自然问句（以？结尾）→ 先拆分子句再逐个生成
    if (text.endsWith('？') || text.endsWith('?')) {
      const cleaned = text.replace(/[？?]+$/, '').trim();
      if (cleaned.length > 1) {
        const subClauses = splitCompoundText(cleaned);
        for (const sub of subClauses) {
          if (sub.length < 3) continue;
          const subAlternatives = splitAlternatives(sub);
          // 「A还是B以及C」如果替代拆分也失败，至少拆出连接词两侧
          for (const sa of subAlternatives) {
            result.questions.push({
              id: generateId('q'),
              question: sa.endsWith('？') ? sa.slice(0, -1) : sa,
              importance: 'important',
            });
          }
        }
      }
      continue;
    }

    // 显式假设
    const assumption = detectExplicitAssumption(text);
    if (assumption) {
      result.assumptions.push(assumption);
      // 含技术栈的假设也归入 inScope
      if (text.length > 3) result.inScope.push(text);
      continue;
    }

    // 隐式假设（含不确定语气词）
    if (hasModerateConfidence(text)) {
      result.assumptions.push({
        id: generateId('a'),
        text,
        confidence: 'medium',
        needsConfirmation: true,
      });
      if (!result.inScope.includes(text)) result.inScope.push(text);
      continue;
    }

    // 隐式技术假设（含技术关键词的陈述句）
    const techHits = extractTechStack(text);
    if (techHits.length > 0 && text.length > 5) {
      result.assumptions.push({
        id: generateId('a'),
        text,
        confidence: 'medium',
        needsConfirmation: true,
      });
    }

    // 验收标准
    if (isAcceptanceCriterion(text)) {
      result.acceptanceCriteria.push(text);
    }

    // 有序/无序列表 → inScope
    if (seg.type === 'item' && text.length > 3 && !seg.isHeader) {
      if (!result.inScope.includes(text)) {
        result.inScope.push(text);
      }
    }
  }

  // 后处理：合并碎片化问题（连续的短问句）
  result.questions = mergeFragmentedQuestions(result.questions);

  // 后处理：去除结果中的纯标题
  result.assumptions = result.assumptions.filter(
    (a) => a.text.length > 3 && !isSectionHeader(a.text),
  );

  if (!result.goal && segments.length > 0) {
    result.goal = segments[0].text;
  }

  return result;
}

// ============================================================
// 分段
// ============================================================

interface Segment {
  text: string;
  type: 'header' | 'item' | 'paragraph';
  isHeader: boolean;
  number?: string;
}

// 使用 new RegExp 规避 esbuild 剥离 ^ 锚点的 bug
const HEADER_REGEX = new RegExp('^#{1,4}\\s+(.+)');
const NUM_REGEX = new RegExp('^(\\d+)[.\\)]\\s*(.+)');
const BULLET_REGEX = new RegExp('^[-*•]\\s+(.+)');

function splitSentences(text: string): string[] {
  const parts = text.split(/(?<=[。！？?])\s*/);
  return parts.filter((p) => p.trim().length > 0);
}

function splitIntoSegments(text: string): Segment[] {
  const lines = text.split('\n');
  const segments: Segment[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const sentences = splitSentences(trimmed);
    for (const sentence of sentences) {
      const s = sentence.trim();
      if (!s) continue;

      const headerMatch = s.match(HEADER_REGEX);
      if (headerMatch) {
        segments.push({ text: headerMatch[1], type: 'header', isHeader: true });
        continue;
      }

      const numMatch = s.match(NUM_REGEX);
      if (numMatch) {
        segments.push({ text: numMatch[2], type: 'item', isHeader: false, number: numMatch[1] });
        continue;
      }

      const bulletMatch = s.match(BULLET_REGEX);
      if (bulletMatch) {
        segments.push({ text: bulletMatch[1], type: 'item', isHeader: false });
        continue;
      }

      segments.push({ text: s, type: 'paragraph', isHeader: false });
    }
  }

  return segments;
}

// ============================================================
// 噪声过滤
// ============================================================

// 使用 new RegExp 规避 esbuild 剥离 ^ 锚点的 bug
const PAREN_WRAPPED_REGEX = new RegExp('^[（(].+[）)]$');
const SECTION_HEADER_REGEX = new RegExp(
  '^(不确定|技术方案|不做|默认假设|需要确认|以下|理解需要)[的：:\\s]*$',
);
const I_UNDERSTAND_REGEX = new RegExp('^我理解');

const UNCERTAIN_COLON_REGEX = new RegExp('^不确定[：:]\\s*(.+)');
const UNCERTAIN_SPACE_REGEX = new RegExp('^不确定\\s*(.+)');
const UNCLEAR_REGEX = new RegExp('^不清楚[：:]\\s*(.+)');
const WE_UNCERTAIN_REGEX = new RegExp('^[我我们]?不确定');

// cleanUncertainty 用的替换 regex（不区分开头，匹配前缀）
const PREFIX_UNCERTAIN = new RegExp('^不确定[：:\\s]*');
const PREFIX_UNCLEAR = new RegExp('^不清楚[：:\\s]*');
const PREFIX_UNKNOWN = new RegExp('^不知道[：:\\s]*');
const PREFIX_WE_UNCERTAIN = new RegExp('^[我我们]不确定[：:\\s]*');

/** 是否为段落标题（太短 + 以冒号结尾、或包含引导词） */
function isSectionHeader(text: string): boolean {
  const t = text.trim();
  if (t.length <= 20 && (t.endsWith('：') || t.endsWith(':'))) return true;
  if (PAREN_WRAPPED_REGEX.test(t) && t.length <= 15) return true;
  if (SECTION_HEADER_REGEX.test(t)) return true;
  if (I_UNDERSTAND_REGEX.test(t) && t.length <= 15) return true;
  return false;
}

/** 是否为不确定标记（而非提问内容本身） */
function isUncertaintyMarker(text: string): boolean {
  const t = text.trim();
  if (UNCERTAIN_COLON_REGEX.test(t)) return true;
  if (UNCERTAIN_SPACE_REGEX.test(t) && t.length > 6) return true;
  if (UNCLEAR_REGEX.test(t)) return true;
  if (WE_UNCERTAIN_REGEX.test(t) && t.length > 10) return true;
  return false;
}

/** 清理不确定性标记的前缀 */
function cleanUncertainty(text: string): string {
  return text
    .replace(PREFIX_UNCERTAIN, '')
    .replace(PREFIX_UNCLEAR, '')
    .replace(PREFIX_UNKNOWN, '')
    .replace(PREFIX_WE_UNCERTAIN, '')
    .trim();
}

/** 合并碎片化问题（被拆散的连接词片段归入前一个问题） */
function mergeFragmentedQuestions(questions: Question[]): Question[] {
  const merged: Question[] = [];
  const fragmentStart = /^[/、，,]|^或[者]?|^还是|^以及|^还有|^并且|^同时|^另外|^此外|^进而/;

  for (const q of questions) {
    const isFragment = fragmentStart.test(q.question);

    if (isFragment && merged.length > 0) {
      merged[merged.length - 1].question += '；' + q.question;
    } else {
      merged.push({ ...q });
    }
  }

  return merged;
}

// ============================================================
// 目标提取
// ============================================================

const GOAL_PATTERNS = [
  new RegExp('核心[目标是要做务求]{1,2}[是为：:]\\s*(.+)'),
  new RegExp('目标[是为：:]\\s*(.+)'),
  new RegExp('要做[的是：:]\\s*(.+)'),
  new RegExp('需要?[实现构建开发做][的是]?\\s*(.+)'),
  new RegExp('任务[是为：:]\\s*(.+)'),
];

function extractGoal(segments: Segment[], request?: string): string {
  for (const seg of segments) {
    for (const pattern of GOAL_PATTERNS) {
      const match = seg.text.match(pattern);
      if (match) {
        const goal = match[1].trim();
        if (goal.length > 3) return goal;
      }
    }
  }

  const firstPara = segments.find(
    (s) =>
      !s.isHeader &&
      s.text.length > 8 &&
      !/^\d+[.)、]\s*/.test(s.text) &&
      !/^(以下|方案|根因|实际|例如|故|所谓)/.test(s.text) &&
      !s.text.endsWith('：') &&
      !s.text.endsWith(':'),
  );
  if (firstPara && firstPara.text.length > 5) {
    return firstPara.text.length > 80 ? firstPara.text.slice(0, 80) + '...' : firstPara.text;
  }

  return request || '';
}

function extractContext(segments: Segment[]): string {
  const contextParts = segments
    .filter(
      (s) =>
        s.type === 'paragraph' &&
        !s.isHeader &&
        s.text.length > 10 &&
        !isSectionHeader(s.text) &&
        !s.text.endsWith('？') &&
        !s.text.endsWith('?') &&
        !/^[/、，,•·]/.test(s.text) &&
        !/^(或[者]?|还是|还有|以及)/.test(s.text),
    )
    .slice(0, 3)
    .map((s) => s.text);
  return contextParts.join('；');
}

// ============================================================
// 假设检测
// ============================================================

const ASSUMPTION_PATTERNS = [
  new RegExp('^假设[：:]?\\s*(.+)'),
  new RegExp('^[我我们]假设(.+)'),
  new RegExp('^猜测[：:]?\\s*(.+)'),
  new RegExp('^估计[：:]?\\s*(.+)'),
  new RegExp('^默认[：:]?\\s*(.+)'),
];

function detectExplicitAssumption(text: string): Assumption | null {
  for (const pattern of ASSUMPTION_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const content = (match[1] || match[0]).trim();
      if (content.length < 3) continue; // 太短忽略
      return {
        id: generateId('a'),
        text: content,
        confidence: detectConfidence(content),
        needsConfirmation: detectConfidence(content) !== 'high',
      };
    }
  }
  return null;
}

function detectConfidence(text: string): Confidence {
  const lower = text.toLowerCase();
  if (HIGH_CONFIDENCE_WORDS.some((w) => lower.includes(w))) return 'high';
  if (LOW_CONFIDENCE_WORDS.some((w) => lower.includes(w))) return 'low';
  if (
    lower.includes('可能') ||
    lower.includes('应该') ||
    lower.includes('通常') ||
    lower.includes('一般')
  )
    return 'medium';
  return 'medium';
}

const HIGH_CONFIDENCE_WORDS = ['肯定', '确定', '显然', '就是', '已经', '一定'];
const LOW_CONFIDENCE_WORDS = [
  '不确定',
  '不清楚',
  '没提到',
  '没说',
  '也许',
  '可能吧',
  '不知道',
  '猜测',
  '大概',
  '估计',
];

function hasModerateConfidence(text: string): boolean {
  const lower = text.toLowerCase();
  return ['可能', '应该', '通常', '一般', '大概', '估计'].some((w) => lower.includes(w));
}

// ============================================================
// 技术栈提取
// ============================================================

const TECH_KEYWORDS: string[] = [
  'React',
  'Vue',
  'Angular',
  'Svelte',
  'Next.js',
  'Nuxt',
  'SvelteKit',
  'TypeScript',
  'JavaScript',
  'Node.js',
  'Express',
  'Koa',
  'Hono',
  'Fastify',
  'Tailwind',
  'Bootstrap',
  'Material UI',
  'Ant Design',
  'shadcn',
  'Prisma',
  'Drizzle',
  'Sequelize',
  'TypeORM',
  'Mongoose',
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'SQLite',
  'Redis',
  'JWT',
  'OAuth',
  'Passport',
  'NextAuth',
  'Docker',
  'Kubernetes',
  'Vite',
  'Webpack',
  'Zustand',
  'Redux',
  'Pinia',
  'React Hook Form',
  'Formik',
  'tRPC',
  'GraphQL',
  'REST',
  'gRPC',
  'React Router',
  'Markdown',
  'pnpm',
  'npm',
  'yarn',
];

function extractTechStack(text: string): string[] {
  const found: string[] = [];
  for (const tech of TECH_KEYWORDS) {
    if (text.toLowerCase().includes(tech.toLowerCase())) {
      found.push(tech);
    }
  }
  return found;
}

// ============================================================
// 范围检测
// ============================================================

const OUT_OF_SCOPE_PATTERNS = [
  new RegExp('^不需要[做]?\\s*(.+)'),
  new RegExp('^不包括[：:]?\\s*(.+)'),
  new RegExp('^不做[：:]?\\s*(.+)'),
  new RegExp('^不用[：:]?\\s*(.+)'),
  new RegExp('^不考虑[：:]?\\s*(.+)'),
  new RegExp('^暂[时不]?\\s*(.+)'),
];

const CONSTRAINT_PATTERNS = [
  new RegExp('^必须[：:]?\\s*(.+)'),
  new RegExp('^不能[：:]?\\s*(.+)'),
  new RegExp('^限制[：:]?\\s*(.+)'),
  new RegExp('^要求[：:]?\\s*(.+)'),
  new RegExp('^只能[：:]?\\s*(.+)'),
];

function isOutOfScope(text: string): boolean {
  return OUT_OF_SCOPE_PATTERNS.some((p) => p.test(text));
}

function isConstraint(text: string): boolean {
  return CONSTRAINT_PATTERNS.some((p) => p.test(text));
}

function isAcceptanceCriterion(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('验收') ||
    lower.includes('测试用例') ||
    lower.includes('预期结果') ||
    lower.includes('应该能') ||
    lower.includes('必须能')
  );
}

function cleanScope(text: string): string {
  for (const pattern of [...OUT_OF_SCOPE_PATTERNS, ...CONSTRAINT_PATTERNS]) {
    const match = text.match(pattern);
    if (match) {
      const cleaned = match[1]?.trim();
      if (cleaned && cleaned.length > 1) return cleaned;
    }
  }
  return text;
}

// ============================================================
// 快捷入口
// ============================================================

import type { Spec } from '@spec-thought-align/shared';

export function fillSpecFromAnalysis(spec: Spec, _request?: string): Spec {
  const parsed = parseAnalysis(spec.input.analysis);

  // 仅填充空字段
  if (!spec.understanding.goal && parsed.goal) spec.understanding.goal = parsed.goal;
  if (!spec.understanding.context && parsed.context) spec.understanding.context = parsed.context;
  if (spec.scope.assumptions.length === 0) spec.scope.assumptions = parsed.assumptions;
  if (spec.scope.inScope.length === 0) spec.scope.inScope = parsed.inScope;
  if (spec.scope.outOfScope.length === 0) spec.scope.outOfScope = parsed.outOfScope;
  if (spec.scope.constraints.length === 0) spec.scope.constraints = parsed.constraints;
  if (spec.questions.length === 0) spec.questions = parsed.questions;
  if (spec.plan.techStack.length === 0) spec.plan.techStack = parsed.techStack;
  if (!spec.plan.architecture && parsed.architecture) spec.plan.architecture = parsed.architecture;
  if (spec.io.acceptanceCriteria.length === 0)
    spec.io.acceptanceCriteria = parsed.acceptanceCriteria;

  return spec;
}
