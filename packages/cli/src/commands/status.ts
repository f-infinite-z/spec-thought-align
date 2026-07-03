import { Command } from 'commander';
import { readStatus, taskExists, getStorageBasePath } from '../storage/index.js';

export function createStatusCommand(): Command {
  return new Command('status')
    .description('查询任务状态')
    .requiredOption('--id <id>', '任务 ID')
    .action(async (options) => {
      const taskId = options.id;
      const basePath = getStorageBasePath();

      if (!taskExists(taskId, basePath)) {
        console.log(JSON.stringify({ status: 'not_found', id: taskId }));
        process.exit(3);
      }

      const statusData = readStatus(taskId, basePath);
      console.log(
        JSON.stringify({
          id: taskId,
          status: statusData.status,
          createdAt: statusData.createdAt,
          updatedAt: statusData.updatedAt,
        }),
      );
    });
}
