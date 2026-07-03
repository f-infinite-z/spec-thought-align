import { Command } from 'commander';
import chalk from 'chalk';
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
      const port = portStr ? parseInt(portStr, 10) : undefined;
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
      const serverPort = await ensureServer(port);
      const panelUrl = `http://localhost:${serverPort}/task/${taskId}`;

      console.log(chalk.green(`\n✅ 规约已创建: ${taskId}`));
      console.log(chalk.cyan(`🌐 可视化面板: ${panelUrl}`));

      // 5. 打开浏览器
      await openBrowser(panelUrl);

      // 6. 是否等待？
      if (!shouldWait) {
        console.log(chalk.gray(`\n⏩ Server 已启动（--no-wait 模式）`));
        console.log(chalk.gray(`   面板: ${panelUrl}`));
        console.log(chalk.gray(`   按 Ctrl+C 停止 Server`));
        // 不 exit——让 Server 保持进程存活
        // Agent 可以后台运行此命令，Server 持续提供服务
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
            // 用户已确认
            const finalSpec = readSpec(taskId, basePath);
            console.log(chalk.green(`\n✅ 用户已确认规约！`));
            console.log(JSON.stringify(finalSpec, null, 2));
            process.exit(EXIT_CODES.CONFIRMED);
          }

          if (currentStatus === 'cancelled') {
            console.log(chalk.red(`\n❌ 用户已取消`));
            process.exit(EXIT_CODES.CANCELLED);
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
