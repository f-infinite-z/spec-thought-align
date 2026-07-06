import type {
  TriggerContext,
  TriggerRuleDef,
  TriggerResult,
  TriggerAction,
  PlatformAdapter,
} from '@spec-thought-align/shared';

export const DEFAULT_TRIGGER_RULES: TriggerRuleDef[] = [
  {
    name: 'single-file-trivial',
    description: '单文件小改动（修 bug、改配置、加注释、格式化、重命名）',
    evaluate: (ctx) =>
      (ctx.fileCount ?? 0) <= 1 &&
      ctx.complexity !== 'high' &&
      !ctx.isNewFeature &&
      !ctx.isBugFix &&
      !ctx.hasArchitectureChange,
    action: 'skip',
    priority: 100,
    reason: '单文件小改动，无架构影响',
  },
  {
    name: 'new-feature',
    description: '新功能开发',
    evaluate: (ctx) => ctx.isNewFeature === true,
    action: 'require',
    priority: 10,
    reason: '新功能开发，建议走需求确认流程',
  },
  {
    name: 'architecture-change',
    description: '涉及架构变更、技术选型',
    evaluate: (ctx) => ctx.hasArchitectureChange === true,
    action: 'require',
    priority: 10,
    reason: '涉及架构变更，必须确认需求',
  },
  {
    name: 'bug-fix-ambiguous',
    description: 'Bug 修复但缺少问题描述和定位信息',
    evaluate: (ctx) =>
      ctx.isBugFix === true && (!ctx.hasDetailedContext || ctx.hasAmbiguity === true),
    action: 'require',
    priority: 15,
    reason: 'Bug 修复需确认问题描述和定位信息',
  },
  {
    name: 'bug-fix-well-described',
    description: 'Bug 修复且问题描述清晰、定位信息充分',
    evaluate: (ctx) => ctx.isBugFix === true && ctx.hasDetailedContext === true,
    action: 'suggest',
    priority: 25,
    reason: 'Bug 描述清晰，建议快速确认后修复',
  },
  {
    name: 'multi-file-refactor',
    description: '多文件重构（>2 个文件）',
    evaluate: (ctx) => (ctx.fileCount ?? 0) > 2 && !ctx.isBugFix,
    action: 'require',
    priority: 20,
    reason: '多文件改动，建议确认影响范围',
  },
  {
    name: 'ambiguous-requirement',
    description: '需求存在模糊之处',
    evaluate: (ctx) => ctx.hasAmbiguity === true,
    action: 'suggest',
    priority: 30,
    reason: '需求存在模糊之处，建议澄清',
  },
  {
    name: 'high-complexity',
    description: '影响范围不清晰或复杂度高',
    evaluate: (ctx) => ctx.complexity === 'high',
    action: 'suggest',
    priority: 40,
    reason: '复杂度高，影响范围不够清晰',
  },
  {
    name: 'medium-complexity',
    description: '中等复杂度默认建议',
    evaluate: (ctx) => ctx.complexity === 'medium',
    action: 'suggest',
    priority: 50,
    reason: '中等复杂度，建议确认需求',
  },
  {
    name: 'default-skip',
    description: '默认跳过（低复杂度且无触发条件）',
    evaluate: () => true,
    action: 'skip',
    priority: 999,
    reason: '无触发条件，可跳过',
  },
];

export function evaluateRules(rules: TriggerRuleDef[], context: TriggerContext): TriggerResult {
  const sorted = [...rules].sort((a, b) => a.priority - b.priority);

  const matchedRules: TriggerResult['matchedRules'] = sorted.map((rule) => ({
    name: rule.name,
    matched: rule.evaluate(context),
    action: rule.action,
    reason: rule.reason,
  }));

  const matching = matchedRules.filter((r) => r.matched);

  if (matching.length === 0) {
    return {
      shouldTrigger: true,
      mode: 'suggest',
      reason: '无法确定，默认建议确认',
      matchedRules,
    };
  }

  const first = matching[0];
  const mode: TriggerAction = first.action;
  const shouldTrigger = mode !== 'skip';

  return {
    shouldTrigger,
    mode,
    reason: first.reason,
    matchedRules,
  };
}

export abstract class BaseAdapter implements PlatformAdapter {
  abstract id: string;
  abstract name: string;
  abstract displayName: string;
  abstract integration: PlatformAdapter['integration'];

  get triggerRules(): TriggerRuleDef[] {
    return DEFAULT_TRIGGER_RULES;
  }

  shouldTrigger(context: TriggerContext): TriggerResult {
    return evaluateRules(this.triggerRules, context);
  }

  abstract detectPlatform(): boolean;
}
