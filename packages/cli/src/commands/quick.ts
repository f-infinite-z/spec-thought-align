import { Command } from 'commander';
import { runSubmit } from './submit.js';

export function createQuickCommand(): Command {
  return new Command('quick')
    .description('快速提交需求（用户端自主触发，自动生成 ID 和分析）')
    .argument('<requirement>', '用户需求文本')
    .option('--wait', '阻塞等待用户确认', true)
    .option('--no-wait', '立即返回')
    .option('--timeout <seconds>', '超时秒数')
    .option('--port <port>', '指定 HTTP Server 端口')
    .option('--agent-type <type>', 'Agent 类型')
    .action(async (requirement: string, options) => {
      const id = generateQuickId(requirement);
      const analysis = `用户需求: ${requirement}\n\n此需求由用户端自主触发 (quick command)，未经 AI Agent 深度分析。解析器将从需求文本中提取关键信息。`;

      await runSubmit({
        id,
        request: requirement,
        analysis,
        wait: options.wait,
        timeout: options.timeout,
        port: options.port,
        agentType: options.agentType,
      });
    });
}

function generateQuickId(text: string): string {
  const slug = text
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40)
    .replace(/-+$/, '')
    .toLowerCase();

  const timestamp = Date.now().toString(36);
  return slug ? `quick-${slug}-${timestamp}` : `quick-${timestamp}`;
}
