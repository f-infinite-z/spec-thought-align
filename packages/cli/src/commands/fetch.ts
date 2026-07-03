import { Command } from 'commander';
import chalk from 'chalk';
import { readSpec, taskExists, getStorageBasePath } from '../storage/index.js';

export function createFetchCommand(): Command {
  return new Command('fetch')
    .description('拉取已确认的规约')
    .requiredOption('--id <id>', '任务 ID')
    .option('--format <format>', '输出格式 (json|summary)', 'json')
    .action(async (options) => {
      const { id: taskId, format } = options;
      const basePath = getStorageBasePath();

      if (!taskExists(taskId, basePath)) {
        console.error(chalk.red(`❌ 任务不存在: ${taskId}`));
        process.exit(3);
      }

      try {
        const spec = readSpec(taskId, basePath);

        if (format === 'summary') {
          console.log(chalk.blue(`\n📋 ${taskId}`));
          console.log(chalk.gray(`  状态: ${spec.meta.status}`));
          console.log(chalk.gray(`  目标: ${spec.understanding.goal || '(未填写)'}`));
          console.log(chalk.gray(`  In Scope: ${spec.scope.inScope.length} 项`));
          console.log(chalk.gray(`  假设: ${spec.scope.assumptions.length} 项`));
          console.log(chalk.gray(`  问题: ${spec.questions.length} 项`));
        } else {
          console.log(JSON.stringify(spec, null, 2));
        }
      } catch (err) {
        console.error(chalk.red(`❌ 读取失败: ${err}`));
        process.exit(3);
      }
    });
}
