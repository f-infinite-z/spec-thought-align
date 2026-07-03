import { Command } from 'commander';
import chalk from 'chalk';
import { exec } from 'child_process';
import http from 'node:http';
import {
  createEmptySpec,
  EXIT_CODES,
  DEFAULT_TIMEOUT_SECONDS,
  POLL_INTERVAL_MS,
} from '@spec-thought-align/shared';
import {
  writeInput,
  writeSpec,
  writeStatus,
  readStatus,
  readSpec,
  getStorageBasePath,
} from '../storage/index.js';
import { ensureServer } from '../server/index.js';
import { openBrowser } from '../utils/browser.js';
import { fillSpecFromAnalysis } from '../engine/parser.js';

function waitForServer(port: number, timeoutMs = 10000): Promise<boolean> {
  const start = Date.now();
  return new Promise((resolve) => {
    function check() {
      const req = http.get(`http://localhost:${port}/api/tasks`, (res) => {
        res.resume();
        resolve(true);
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          resolve(false);
        } else {
          setTimeout(check, 300);
        }
      });
      req.setTimeout(1000, () => {
        req.destroy();
        if (Date.now() - start > timeoutMs) {
          resolve(false);
        } else {
          setTimeout(check, 300);
        }
      });
    }
    check();
  });
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/tasks`, (res) => {
      res.resume();
      resolve(false); // port is in use = not available
    });
    req.on('error', () => {
      resolve(true); // can't connect = available
    });
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(true);
    });
  });
}

function startDetachedServer(port: number): void {
  const cliPath = process.argv[1];
  exec(`cmd /c start /b "" "${process.execPath}" "${cliPath}" __serve --port ${port}`, {
    windowsHide: true,
  });
}

export function createSubmitCommand(): Command {
  return new Command('submit')
    .description('提交需求规约并等待用户确认')
    .requiredOption('--id <id>', '任务唯一标识')
    .requiredOption('--request <text>', '用户原始需求')
    .requiredOption('--analysis <text>', 'Agent 的思考分析')
    .option('--wait', '阻塞等待用户确认', true)
    .option('--no-wait', '立即返回，不等待')
    .option('--timeout <seconds>', '超时秒数', String(DEFAULT_TIMEOUT_SECONDS))
    .option('--port <port>', '指定 HTTP Server 端口')
    .option('--agent-type <type>', '来源 Agent 类型 (cline/cursor/aider/...)')
    .action(async (options) => {
      const {
        id: taskId,
        request,
        analysis,
        wait: shouldWait,
        timeout: timeoutStr,
        port: portStr,
        agentType,
      } = options;

      const timeout = parseInt(timeoutStr, 10);
      const requestedPort = portStr ? parseInt(portStr, 10) : 5678;
      const basePath = getStorageBasePath();

      // 1. 写入原始输入
      console.log(chalk.blue(`\n📋 Spec-Align: ${taskId}`));
      console.log(chalk.gray(`  写入原始分析...`));
      writeInput(taskId, { request, analysis, agentType }, basePath);

      // 2. 创建初始规约（半空）
      console.log(chalk.gray(`  创建结构化规约...`));
      const spec = createEmptySpec(taskId, request, analysis, agentType);

      // 2b. 规则引擎解析预填
      console.log(chalk.gray(`  规则引擎解析中...`));
      fillSpecFromAnalysis(spec);
      writeSpec(taskId, spec, basePath);

      // 3. 写入初始状态
      writeStatus(taskId, 'pending', basePath);

      // 4. 启动 HTTP Server
      let serverPort: number;

      if (!shouldWait) {
        // --no-wait: 检查是否已有 server 运行，没有则 detached 启动
        const available = await isPortAvailable(requestedPort);
        if (available) {
          startDetachedServer(requestedPort);
          const ready = await waitForServer(requestedPort, 8000);
          if (!ready) {
            console.log(chalk.red(`\n❌ Server 启动失败，请手动运行:`));
            console.log(chalk.gray(`   node ... __serve --port ${requestedPort}`));
            process.exit(1);
          }
        }
        serverPort = requestedPort;
      } else {
        // --wait: 直接在当前进程启动 server（需要阻塞等待）
        serverPort = await ensureServer(requestedPort);
      }

      const panelUrl = `http://localhost:${serverPort}/task/${taskId}`;

      console.log(chalk.green(`\n✅ 规约已创建: ${taskId}`));
      console.log(chalk.cyan(`🌐 可视化面板: ${panelUrl}`));

      // 5. 打开浏览器
      await openBrowser(panelUrl);

      // 6. 是否等待？
      if (!shouldWait) {
        console.log(chalk.gray(`\n⏩ Server 已启动（--no-wait 模式）`));
        console.log(chalk.gray(`   面板: ${panelUrl}`));
        return;
      }

      // 7. 阻塞等待用户确认
      console.log(chalk.yellow(`\n⏳ 等待用户确认... (超时: ${timeout}s)`));

      const startTime = Date.now();
      let lastStatus = 'pending';

      // eslint-disable-next-line no-constant-condition
      while (true) {
        // 检查超时
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed > timeout) {
          console.log(chalk.red(`\n⏱️  等待超时 (${timeout}s)`));
          writeStatus(taskId, 'cancelled', basePath);
          process.exit(EXIT_CODES.TIMEOUT);
        }

        // 检查状态文件
        try {
          const statusData = readStatus(taskId, basePath);
          const currentStatus = statusData.status;

          if (currentStatus === 'confirmed') {
            // 用户已确认：立即输出 JSON 给 Agent，但保持 Server 存活 10 秒
            const finalSpec = readSpec(taskId, basePath);
            console.log(chalk.green(`\n✅ 用户已确认规约！`));
            console.log(JSON.stringify(finalSpec, null, 2));
            console.log(chalk.gray(`\n🕐 Server 将在 10 秒后关闭，此期间仍可访问面板查看结果`));
            setTimeout(() => process.exit(EXIT_CODES.CONFIRMED), 10000);
            return;
          }

          if (currentStatus === 'cancelled') {
            console.log(chalk.red(`\n❌ 用户已取消`));
            console.log(chalk.gray(`\n🕐 Server 将在 5 秒后关闭`));
            setTimeout(() => process.exit(EXIT_CODES.CANCELLED), 5000);
            return;
          }

          // 状态变化时打印提示
          if (currentStatus !== lastStatus) {
            lastStatus = currentStatus;
          }
        } catch {
          // 状态文件可能还没写入，继续轮询
        }

        // 轮询间隔
        await sleep(POLL_INTERVAL_MS);
      }
    });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
