import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { SpecAlignConfig } from '@spec-thought-align/shared';
import { DEFAULT_CONFIG } from '@spec-thought-align/shared';

const CONFIG_DIR = path.join(os.homedir(), '.spec-thought-align');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function readConfig(): SpecAlignConfig {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function writeConfig(cfg: SpecAlignConfig): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
}

function setNested(obj: Record<string, unknown>, keyPath: string, value: string): void {
  const keys = keyPath.split('.');
  const last = keys.pop()!;
  let current = obj;
  for (const k of keys) {
    if (!current[k] || typeof current[k] !== 'object') {
      current[k] = {};
    }
    current = current[k] as Record<string, unknown>;
  }
  const old = current[last];
  if (typeof old === 'number') {
    current[last] = Number(value);
  } else if (typeof old === 'boolean') {
    current[last] = value === 'true';
  } else {
    current[last] = value;
  }
}

function formatValue(v: unknown): string {
  if (v === undefined || v === null) return chalk.gray('(not set)');
  if (typeof v === 'boolean') return v ? chalk.green('true') : chalk.red('false');
  if (typeof v === 'number') return chalk.yellow(String(v));
  if (typeof v === 'string') return chalk.cyan(v);
  return String(v);
}

function printConfig(cfg: SpecAlignConfig): void {
  const keys: Array<{ key: string; value: unknown }> = [
    { key: 'server.port', value: cfg.server.port },
    { key: 'server.host', value: cfg.server.host },
    { key: 'storage.path', value: cfg.storage.path },
    { key: 'llm.enabled', value: cfg.llm.enabled },
    { key: 'llm.provider', value: cfg.llm.provider },
    { key: 'llm.model', value: cfg.llm.model },
    { key: 'llm.baseUrl', value: cfg.llm.baseUrl },
    { key: 'llm.apiKey', value: cfg.llm.apiKey ? '***' : null },
    { key: 'ui.autoOpen', value: cfg.ui.autoOpen },
  ];

  for (const { key, value } of keys) {
    const padded = key.padEnd(20);
    console.log(`  ${chalk.gray(padded)} ${formatValue(value)}`);
  }
  console.log();
  console.log(chalk.dim(`  配置文件: ${CONFIG_FILE}`));
}

export function createConfigCommand(): Command {
  const cmd = new Command('config').description('查看或修改全局配置');

  cmd
    .command('show')
    .description('查看当前配置')
    .action(() => {
      const cfg = readConfig();
      console.log(chalk.blue('⚙️  Spec-Align 全局配置\n'));
      printConfig(cfg);
    });

  cmd
    .command('set <key> <value>')
    .description('设置配置项（如 server.port=3000）')
    .action((key, value) => {
      const cfg = readConfig();
      setNested(cfg as unknown as Record<string, unknown>, key, value);
      writeConfig(cfg);
      console.log(chalk.green(`✅ 已设置 ${chalk.cyan(key)} = ${chalk.yellow(value)}`));
    });

  cmd
    .command('reset')
    .description('重置为默认配置')
    .action(() => {
      writeConfig({ ...DEFAULT_CONFIG });
      console.log(chalk.green('✅ 已重置为默认配置'));
      printConfig(DEFAULT_CONFIG);
    });

  return cmd;
}
