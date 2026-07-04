import { Command } from 'commander';
import chalk from 'chalk';
import http from 'node:http';
import { EXIT_CODES, DEFAULT_TIMEOUT_SECONDS, POLL_INTERVAL_MS } from '@spec-thought-align/shared';
import { readStatus, readSpec, readResult, getStorageBasePath } from '../storage/index.js';

const DEFAULT_PORT = 5678;

interface ApiTaskResponse {
  success: boolean;
  data?: {
    meta?: { status?: string };
    [key: string]: unknown;
  };
  error?: string;
}

function httpGet(url: string, timeoutMs = 2000): Promise<ApiTaskResponse> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function pollHttpApi(
  taskId: string,
  port: number,
  timeoutSeconds: number,
): Promise<{ success: boolean; exitCode: number; data?: unknown }> {
  const startTime = Date.now();
  const url = `http://localhost:${port}/api/task/${taskId}`;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed > timeoutSeconds) {
      return { success: false, exitCode: EXIT_CODES.TIMEOUT };
    }

    try {
      const resp = await httpGet(url);
      if (resp.success && resp.data?.meta?.status === 'confirmed') {
        return { success: true, exitCode: EXIT_CODES.CONFIRMED, data: resp.data };
      }
      if (resp.success && resp.data?.meta?.status === 'cancelled') {
        return { success: false, exitCode: EXIT_CODES.CANCELLED };
      }
    } catch {
      // Server not reachable, will try filesystem fallback
      return { success: false, exitCode: EXIT_CODES.ERROR };
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

async function pollFilesystem(
  taskId: string,
  timeoutSeconds: number,
  basePath: string,
): Promise<{ success: boolean; exitCode: number; data?: unknown }> {
  const startTime = Date.now();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed > timeoutSeconds) {
      return { success: false, exitCode: EXIT_CODES.TIMEOUT };
    }

    try {
      const statusData = readStatus(taskId, basePath);

      if (statusData.status === 'confirmed') {
        const result = readResult(taskId, basePath) || readSpec(taskId, basePath);
        return { success: true, exitCode: EXIT_CODES.CONFIRMED, data: result };
      }

      if (statusData.status === 'cancelled') {
        return { success: false, exitCode: EXIT_CODES.CANCELLED };
      }
    } catch {
      // Status file may not exist yet
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

export function createAwaitConfirmCommand(): Command {
  return new Command('await-confirm')
    .description('等待用户确认并返回最终规约 JSON（可在进程被终止后重新连接）')
    .requiredOption('--id <id>', '任务 ID')
    .option('--timeout <seconds>', '超时秒数', String(DEFAULT_TIMEOUT_SECONDS))
    .option('--port <port>', 'HTTP Server 端口', String(DEFAULT_PORT))
    .action(async (options) => {
      const { id: taskId, timeout: timeoutStr, port: portStr } = options;

      const timeout = parseInt(timeoutStr, 10);
      const port = parseInt(portStr, 10);
      const basePath = getStorageBasePath();

      console.log(chalk.blue(`\n⏳ 等待确认: ${taskId}`));
      console.log(chalk.gray(`   超时: ${timeout}s | Server 端口: ${port}`));

      // 1. Try HTTP API polling (faster, confirms server is alive)
      console.log(chalk.gray(`   连接 Server...`));
      let result = await pollHttpApi(taskId, port, Math.min(timeout, 10));

      if (result.success) {
        printResult(result.data);
        return;
      }

      if (result.exitCode === EXIT_CODES.CANCELLED) {
        console.log(chalk.red(`\n❌ 用户已取消`));
        process.exit(EXIT_CODES.CANCELLED);
      }

      // 2. HTTP failed or server not reachable, fallback to filesystem polling
      const remainingTimeout = timeout - 10;
      if (remainingTimeout <= 0) {
        console.log(chalk.red(`\n⏱️  等待超时 (${timeout}s)`));
        console.log(chalk.gray(`   Server 无响应，且未找到确认结果`));
        process.exit(EXIT_CODES.TIMEOUT);
      }

      console.log(chalk.yellow(`   Server 不可达，切换到文件系统轮询...`));
      result = await pollFilesystem(taskId, remainingTimeout, basePath);

      if (result.success) {
        printResult(result.data);
        return;
      }

      if (result.exitCode === EXIT_CODES.CANCELLED) {
        console.log(chalk.red(`\n❌ 用户已取消`));
        process.exit(EXIT_CODES.CANCELLED);
      }

      console.log(chalk.red(`\n⏱️  等待超时 (${timeout}s)`));
      console.log(chalk.gray(`   请确认面板是否仍在运行: http://localhost:${port}/task/${taskId}`));
      process.exit(EXIT_CODES.TIMEOUT);
    });
}

function printResult(data: unknown): void {
  console.log(chalk.green(`\n✅ 用户已确认规约！`));
  console.log(JSON.stringify(data, null, 2));
  process.exit(EXIT_CODES.CONFIRMED);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
