import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { listAdapters, resolveAdapter } from '../adapters/index.js';

const CONFIG_PATHS: Record<string, { relPath: string; isGlobal: boolean }> = {
  opencode: { relPath: '.config/opencode/AGENTS.md', isGlobal: true },
  cursor: { relPath: '.cursorrules', isGlobal: false },
  'claude-code': { relPath: 'CLAUDE.md', isGlobal: false },
  windsurf: { relPath: '.windsurfrules', isGlobal: false },
  aider: { relPath: 'CONVENTIONS.md', isGlobal: false },
  'gemini-cli': { relPath: '.gemini/settings.json', isGlobal: false },
  'openai-codex': { relPath: '.codex/config.md', isGlobal: false },
  generic: { relPath: 'AGENTS.md', isGlobal: false },
};

function resolveConfigPath(platformId: string): string {
  const cfg = CONFIG_PATHS[platformId] ?? CONFIG_PATHS.generic;
  if (cfg.isGlobal) {
    return path.join(os.homedir(), cfg.relPath);
  }
  return path.join(process.cwd(), cfg.relPath);
}

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function createSetupCommand(): Command {
  const cmd = new Command('setup')
    .description('自动检测平台并将 spec-align 规则写入配置文件')
    .option('--platform <id>', '指定目标平台（默认自动检测）')
    .option('--dry-run', '预览配置内容而不写入文件')
    .option('-f, --force', '强制覆盖已存在的配置文件')
    .option('--no-open', '写入后不打开配置面板')
    .action(async (options) => {
      const adapter = options.platform ? resolveAdapter(options.platform) : resolveAdapter();

      if (!adapter || adapter.id === 'generic') {
        console.log(chalk.yellow('⚠ 未检测到已知 Agent 平台，将使用通用模板'));
        console.log(
          chalk.dim(
            '  可用 --platform 指定: ' +
              listAdapters()
                .map((a) => a.id)
                .join(', '),
          ),
        );
        console.log();
      }

      const configPath = resolveConfigPath(adapter.id);
      const template = adapter.integration.configTemplate;

      if (options.dryRun) {
        console.log(chalk.blue(`📋 ${adapter.displayName} 配置预览`));
        console.log(chalk.dim(`  目标文件: ${configPath}`));
        console.log(chalk.dim('  ---BEGIN---'));
        console.log(template);
        console.log(chalk.dim('  ---END---'));
        return;
      }

      if (fs.existsSync(configPath) && !options.force) {
        console.log(chalk.yellow(`⚠ 配置文件已存在: ${configPath}`));
        console.log(chalk.dim('  使用 --force 强制覆盖，或 --dry-run 预览内容'));
        return;
      }

      ensureDir(configPath);
      fs.writeFileSync(configPath, template, 'utf-8');

      console.log(chalk.green(`✅ 已写入 ${adapter.displayName} 配置`));
      console.log(chalk.dim(`  文件: ${configPath}`));
      console.log();

      if (adapter.id === 'opencode') {
        console.log(chalk.cyan('💡 提示: 重启 opencode 以加载新规则'));
      }
    });

  return cmd;
}
