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
program.addCommand(createServeCommand(), { hidden: true });

program.parse(process.argv);
