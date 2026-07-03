import { Command } from 'commander';
import { ensureServer } from '../server/index.js';

export function createServeCommand(): Command {
  return new Command('__serve')
    .description('(内部) 后台启动 HTTP Server')
    .requiredOption('--port <port>', '端口号')
    .action(async (options) => {
      const port = parseInt(options.port, 10);
      await ensureServer(port);
      // 保持进程永久存活
      setInterval(() => {}, 60000);
    });
}
