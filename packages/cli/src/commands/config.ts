import { Command } from 'commander';
import chalk from 'chalk';

export function createConfigCommand(): Command {
  const cmd = new Command('config').description('查看或修改配置');

  cmd
    .command('show')
    .description('查看当前配置')
    .action(() => {
      console.log(chalk.blue('⚙️  当前配置'));
      // TODO Phase 1
      console.log(chalk.yellow('⚠️  Phase 1 实现'));
    });

  cmd
    .command('set <key> <value>')
    .description('设置配置项')
    .action((key, value) => {
      console.log(chalk.blue(`⚙️  设置 ${key} = ${value}`));
      // TODO Phase 2
      console.log(chalk.yellow('⚠️  Phase 2 实现'));
    });

  cmd
    .command('reset')
    .description('重置为默认配置')
    .action(() => {
      console.log(chalk.blue('⚙️  重置配置'));
      // TODO Phase 2
    });

  return cmd;
}
