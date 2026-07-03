import { Command } from 'commander';
import { readTaskManifest } from '../storage/index.js';
import chalk from 'chalk';

export function createStartCommand(): Command {
  return new Command('start')
    .description('提取子任务所需的最小上下文，供子 Agent 使用')
    .requiredOption('--id <id>', '任务 ID')
    .requiredOption('--sub <subId>', '子任务 ID')
    .action(async (options) => {
      const { id, sub } = options;

      try {
        const manifest = readTaskManifest(id);
        if (!manifest) {
          console.error(chalk.red(`任务 ${id} 不存在子任务清单，请先执行 split`));
          process.exit(1);
        }

        const subtask = manifest.subtasks.find((s) => s.id === sub);
        if (!subtask) {
          console.error(chalk.red(`子任务 ${sub} 不存在`));
          process.exit(1);
        }

        const context = {
          parentTask: id,
          subTask: {
            id: subtask.id,
            description: subtask.description,
            relatedScope: subtask.relatedScope,
            acceptanceCriteria: subtask.acceptanceCriteria,
            dependencies: subtask.dependencies,
          },
          context: subtask.context || {},
        };

        console.log(JSON.stringify(context, null, 2));
      } catch (e: any) {
        console.error(chalk.red(e.message));
        process.exit(1);
      }
    });
}
