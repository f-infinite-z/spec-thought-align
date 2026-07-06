import { Command } from 'commander';
import type { TriggerContext } from '@spec-thought-align/shared';
import { resolveAdapter, listAdapters } from '../adapters/registry.js';

export function createDetectCommand(): Command {
  return new Command('detect')
    .description('检测当前上下文是否需要触发 spec-align 需求确认流程')
    .option(
      '--platform <type>',
      '目标平台 (opencode/claude-code/cursor/aider/windsurf/gemini-cli/openai-codex)',
    )
    .option('--files <count>', '涉及的文件数量', parseInt)
    .option('--file-list <list>', '涉及的文件列表（逗号分隔）')
    .option('--request <text>', '用户原始需求文本')
    .option('--new-feature', '是否为新功能开发')
    .option('--bug-fix', '是否为 Bug 修复')
    .option('--architecture-change', '是否涉及架构变更')
    .option('--has-ambiguity', '需求是否存在模糊之处')
    .option('--has-detailed-context', 'Bug 描述是否包含清晰的定位信息')
    .option('--complexity <level>', '复杂度 (low/medium/high)', 'medium')
    .option('--list-platforms', '列出所有支持的平台')
    .action(async (options) => {
      if (options.listPlatforms) {
        const adapters = listAdapters();
        console.log(
          JSON.stringify(
            adapters.map((a) => ({
              id: a.id,
              name: a.displayName,
              strategy: a.integration.recommendedStrategy,
              timeout: a.integration.knownTimeoutSeconds,
            })),
            null,
            2,
          ),
        );
        return;
      }

      const adapter = resolveAdapter(options.platform);

      const context: TriggerContext = {
        fileCount: options.files,
        files: options.fileList
          ? options.fileList.split(',').map((s: string) => s.trim())
          : undefined,
        complexity: options.complexity || 'medium',
        userRequest: options.request,
        isNewFeature: options.newFeature || undefined,
        isBugFix: options.bugFix || undefined,
        hasArchitectureChange: options.architectureChange || undefined,
        hasAmbiguity: options.hasAmbiguity || undefined,
        hasDetailedContext: options.hasDetailedContext || undefined,
      };

      const result = adapter.shouldTrigger(context);

      console.log(
        JSON.stringify(
          {
            platform: adapter.id,
            platformName: adapter.displayName,
            recommendedStrategy: adapter.integration.recommendedStrategy,
            ...result,
          },
          null,
          2,
        ),
      );
    });
}
