import { Command } from 'commander';
import { readSpec, writeTaskManifest } from '../storage/index.js';
import { splitSpecToSubTasks } from '../engine/splitter.js';
import chalk from 'chalk';

export function createSplitCommand(): Command {
  return new Command('split')
    .description('将已确认的规约拆分为子任务清单')
    .requiredOption('--id <id>', '任务 ID')
    .action(async (options) => {
      const { id } = options;

      try {
        const spec = readSpec(id);
        if (spec.meta.status !== 'confirmed') {
          console.error(chalk.red(`任务 ${id} 尚未确认，状态: ${spec.meta.status}`));
          process.exit(1);
        }

        const manifest = splitSpecToSubTasks(spec);
        writeTaskManifest(id, manifest);

        console.log(chalk.green(`\n✅ 已拆分 ${manifest.subtasks.length} 个子任务:\n`));

        for (const st of manifest.subtasks) {
          const depStr =
            st.dependencies.length > 0 ? chalk.gray(` ← 依赖: ${st.dependencies.join(', ')}`) : '';
          console.log(
            `  ${chalk.cyan(st.id)}  ${st.description}` +
              `  [${st.acceptanceCriteria.length} 验收]${depStr}`,
          );
        }

        console.log(chalk.gray(`\n清单已保存: .spec-thought-align/${id}/tasks.json`));
        console.log(
          chalk.gray(`子任务上下文提取: npx spec-thought-align start --id ${id} --sub <subId>`),
        );
      } catch (e: any) {
        console.error(chalk.red(e.message));
        process.exit(1);
      }
    });
}
