import { Command } from 'commander';
import { readTaskManifest, getSubTaskStatus, readSpec } from '../storage/index.js';
import chalk from 'chalk';

export function createVerifyCommand(): Command {
  return new Command('verify')
    .description('检查子任务完成状态，输出验收报告')
    .requiredOption('--id <id>', '任务 ID')
    .option('--sub <subId>', '仅检查指定子任务')
    .option('--mark-done', '自动将 done 子任务标记为完成(由主 Agent 调用)')
    .action(async (options) => {
      const { id, sub, markDone } = options;

      try {
        const spec = readSpec(id);
        const statuses = getSubTaskStatus(id);

        if (statuses.length === 0) {
          console.error(chalk.red(`任务 ${id} 不存在子任务清单`));
          process.exit(1);
        }

        const toCheck = sub ? statuses.filter((s) => s.id === sub) : statuses;

        if (sub && toCheck.length === 0) {
          console.error(chalk.red(`子任务 ${sub} 不存在`));
          process.exit(1);
        }

        console.log(chalk.bold(`\n📋 验收报告: ${id}\n`));

        const done = toCheck.filter((s) => s.status === 'done');
        const pending = toCheck.filter((s) => s.status === 'pending' || s.status === 'in-progress');
        const failed = toCheck.filter((s) => s.status === 'failed');

        const passed: string[] = [];
        const unchecked: string[] = [];

        for (const st of done) {
          for (const ac of st.acceptanceCriteria) {
            if (st.agentNote) {
              passed.push(`${st.id}: ${ac} → ${st.agentNote}`);
            } else {
              unchecked.push(`${st.id}: ${ac}`);
            }
          }
        }

        const totalCriteria = spec.io.acceptanceCriteria.length;

        console.log(chalk.gray(`总验收标准: ${totalCriteria} 条`));
        console.log(chalk.green(`已通过: ${passed.length} 条`));
        console.log(
          chalk.yellow(
            `待检查: ${unchecked.length + (pending.length > 0 ? pending.length : 0) * 2} 条`,
          ),
        );
        if (failed.length > 0) console.log(chalk.red(`失败: ${failed.length} 项`));

        console.log(`\n${chalk.bold('子任务状态:')}`);
        for (const st of toCheck) {
          const icon =
            st.status === 'done'
              ? '✅'
              : st.status === 'failed'
                ? '❌'
                : st.status === 'in-progress'
                  ? '🔄'
                  : '⏳';
          const depStr =
            st.dependencies.length > 0 ? chalk.gray(` (依赖: ${st.dependencies.join(', ')})`) : '';
          console.log(
            `  ${icon} ${chalk.cyan(st.id)} ${st.status.padEnd(12)} ${st.description}${depStr}`,
          );
        }

        // 验收通过
        for (const st of done) {
          if (passed.length > 0) {
            console.log(chalk.green(`\n  ✅ ${st.id}: ${st.description}`));
            for (const ac of st.acceptanceCriteria) {
              console.log(chalk.gray(`     └ ${ac}`));
            }
          }
        }

        // 待验收
        const needsReview = [...pending, ...failed];
        if (needsReview.length > 0) {
          console.log(chalk.yellow(`\n⚠️  主 Agent 需验收: ${needsReview.length} 项`));
          for (const st of needsReview) {
            console.log(chalk.yellow(`  ${st.id}: ${st.description}`));
            for (const ac of st.acceptanceCriteria) {
              console.log(chalk.gray(`     └ ${ac}`));
            }
          }
        }

        if (markDone && pending.length === 0 && failed.length === 0) {
          const manifest = readTaskManifest(id);
          if (manifest) {
            const allDone = manifest.subtasks.every((s) => s.status === 'done');
            if (allDone) {
              console.log(chalk.green('\n🎉 所有子任务已完成！'));
            }
          }
        }

        const allDoneCount = toCheck.filter((s) => s.status === 'done').length;
        if (allDoneCount === toCheck.length) {
          console.log(chalk.green('\n✅ 全部子任务已验收通过'));
        }
      } catch (e: any) {
        console.error(chalk.red(e.message));
        process.exit(1);
      }
    });
}
