import { Command } from 'commander';
import chalk from 'chalk';
import { writeStatus, taskExists, getStorageBasePath } from '../storage/index.js';

export function createCompleteCommand(): Command {
  return new Command('complete')
    .description('标记任务完成')
    .requiredOption('--id <id>', '任务 ID')
    .requiredOption('--summary <text>', '施工摘要')
    .action(async (options) => {
      const { id: taskId, summary } = options;
      const basePath = getStorageBasePath();

      if (!taskExists(taskId, basePath)) {
        console.error(chalk.red(`❌ 任务不存在: ${taskId}`));
        process.exit(3);
      }

      writeStatus(taskId, 'completed', basePath);

      // 追加摘要到 spec
      try {
        const { readSpec, writeSpec } = await import('../storage/index.js');
        const spec = readSpec(taskId, basePath);
        spec.meta.completedAt = new Date().toISOString();
        spec.userAdditions.notes = spec.userAdditions.notes
          ? `${spec.userAdditions.notes}\n\n施工摘要: ${summary}`
          : `施工摘要: ${summary}`;
        writeSpec(taskId, spec, basePath);
      } catch {
        // spec 可能不存在，忽略
      }

      console.log(chalk.green(`✅ 任务已完成: ${taskId}`));
      console.log(chalk.gray(`  摘要: ${summary}`));
    });
}
