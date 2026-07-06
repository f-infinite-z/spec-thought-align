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

async function checkOnce(
  taskId: string,
  port: number,
  basePath: string,
): Promise<{ success: boolean; data?: unknown }> {
  try {
    const resp = await httpGetTimedOut(`http://localhost:${port}/api/task/${taskId}`, 2000);
    if (resp && resp.success && resp.data?.meta?.status === 'confirmed') {
      return { success: true, data: resp.data };
    }
    if (resp && resp.success && resp.data?.meta?.status === 'cancelled') {
      return { success: false };
    }
  } catch {
    // HTTP not reachable, fall through to filesystem
  }

  try {
    const statusData = readStatus(taskId, basePath);
    if (statusData.status === 'confirmed') {
      const result = readResult(taskId, basePath) || readSpec(taskId, basePath);
      return { success: true, data: result };
    }
    if (statusData.status === 'cancelled') {
      return { success: false };
    }
  } catch {
    // no status file
  }

  return { success: false };
}

async function httpGetTimedOut(url: string, timeoutMs: number): Promise<ApiTaskResponse | null> {
  try {
    return await httpGet(url, timeoutMs);
  } catch {
    return null;
  }
}

export function createAwaitConfirmCommand(): Command {
  return new Command('await-confirm')
    .description('等待用户确认并返回最终规约 JSON（可在进程被终止后重新连接）')
    .requiredOption('--id <id>', '任务 ID')
    .option('--timeout <seconds>', '超时秒数', String(DEFAULT_TIMEOUT_SECONDS))
    .option('--port <port>', 'HTTP Server 端口', String(DEFAULT_PORT))
    .option('--check', '快速检查模式：仅检查一次，不轮询（适用于有 exec 超时的 Agent）')
    .action(async (options) => {
      const { id: taskId, timeout: timeoutStr, port: portStr, check } = options;

      const timeout = parseInt(timeoutStr, 10);
      const port = parseInt(portStr, 10);
      const basePath = getStorageBasePath();

      if (check) {
        const result = await checkOnce(taskId, port, basePath);
        if (result.success) {
          printResult(result.data);
          return;
        }
        console.log(chalk.yellow(`\n⏳ 待确认: ${taskId}`));
        console.log(chalk.gray(`   面板: http://localhost:${port}/task/${taskId}`));
        process.exit(EXIT_CODES.TIMEOUT);
        return;
      }

      const startedAt = Date.now();

      console.log(chalk.blue(`\n⏳ 等待确认: ${taskId}`));
      console.log(chalk.gray(`   超时: ${timeout}s | Server 端口: ${port}`));

      console.log(chalk.gray(`   连接 Server...`));
      const httpBudget = Math.min(timeout, 10);
      let result = await pollHttpApi(taskId, port, httpBudget);

      if (result.success) {
        printResult(result.data);
        return;
      }

      if (result.exitCode === EXIT_CODES.CANCELLED) {
        console.log(chalk.red(`\n❌ 用户已取消`));
        process.exit(EXIT_CODES.CANCELLED);
      }

      const elapsed = (Date.now() - startedAt) / 1000;
      const remainingTimeout = Math.max(0, timeout - elapsed);

      console.log(
        chalk.yellow(
          `   HTTP 轮询未确认，切换到文件系统轮询 (剩余 ${Math.ceil(remainingTimeout)}s)...`,
        ),
      );
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
