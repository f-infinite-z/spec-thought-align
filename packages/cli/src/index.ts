#!/usr/bin/env node
import { Command } from 'commander';
import { createSubmitCommand } from './commands/submit.js';
import { createFetchCommand } from './commands/fetch.js';
import { createStatusCommand } from './commands/status.js';
import { createListCommand } from './commands/list.js';
import { createCompleteCommand } from './commands/complete.js';
import { createConfigCommand } from './commands/config.js';
import { createSplitCommand } from './commands/split.js';
import { createStartCommand } from './commands/start.js';
import { createVerifyCommand } from './commands/verify.js';
import { createAwaitConfirmCommand } from './commands/await-confirm.js';
import { createServeCommand } from './commands/__serve.js';
import { createDetectCommand } from './commands/detect.js';
import { createQuickCommand } from './commands/quick.js';

const KNOWN_COMMANDS = [
  'submit',
  'fetch',
  'status',
  'list',
  'complete',
  'config',
  'split',
  'start',
  'verify',
  'await-confirm',
  '__serve',
  'detect',
  'quick',
  '--help',
  '-h',
  '--version',
  '-V',
];

function tryQuickSugar(): boolean {
  const args = process.argv.slice(2);
  if (args.length === 0) return false;

  const first = args[0];
  if (KNOWN_COMMANDS.includes(first)) return false;
  if (first.startsWith('-')) return false;

  const reqParts: string[] = [];
  const flagParts: string[] = [];
  let inFlags = false;
  for (const arg of args) {
    if (!inFlags && arg.startsWith('-')) {
      inFlags = true;
    }
    if (inFlags) {
      flagParts.push(arg);
    } else {
      reqParts.push(arg);
    }
  }

  const requirement = reqParts.join(' ');
  const merged = [process.argv[0], process.argv[1], 'quick', requirement, ...flagParts];

  if (!flagParts.includes('--no-wait') && !flagParts.includes('--wait')) {
    merged.push('--wait');
  }

  process.argv = merged;
  return true;
}

const program = new Command();

program
  .name('spec-thought-align')
  .description('AI Coding Agent 施工前的需求规约可视化确认面板')
  .version('0.1.0');

program.addCommand(createSubmitCommand());
program.addCommand(createFetchCommand());
program.addCommand(createStatusCommand());
program.addCommand(createListCommand());
program.addCommand(createCompleteCommand());
program.addCommand(createSplitCommand());
program.addCommand(createStartCommand());
program.addCommand(createVerifyCommand());
program.addCommand(createAwaitConfirmCommand());
program.addCommand(createConfigCommand());
program.addCommand(createDetectCommand());
program.addCommand(createQuickCommand());
program.addCommand(createServeCommand(), { hidden: true });

tryQuickSugar();
program.parse(process.argv);
