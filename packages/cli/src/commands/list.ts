import { Command } from 'commander';
import chalk from 'chalk';
import { listTasks } from '../storage/index.js';

export function createListCommand(): Command {
  return new Command('list').description('列出所有任务').action(() => {
    const tasks = listTasks();

    if (tasks.length === 0) {
      console.log(chalk.gray('📋 暂无任务'));
      return;
    }

    console.log(chalk.blue(`\n📋 任务列表 (${tasks.length})`));
    console.log(chalk.gray('─'.repeat(60)));

    for (const task of tasks) {
      const statusIcon =
        task.status === 'confirmed'
          ? '✅'
          : task.status === 'completed'
            ? '🏁'
            : task.status === 'cancelled'
              ? '❌'
              : '⏳';

      console.log(
        `  ${statusIcon} ${chalk.cyan(task.id.padEnd(24))} ${chalk.gray(task.status.padEnd(12))} ${task.createdAt ? formatTime(task.createdAt) : ''}`,
      );
    }

    console.log(chalk.gray('─'.repeat(60)));
  });
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('zh-CN');
  } catch {
    return iso;
  }
}
