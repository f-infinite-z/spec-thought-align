import type { Spec, SubTask, TaskManifest, SubTaskContext } from '@spec-thought-align/shared';
import { generateId } from '@spec-thought-align/shared';

const SMALL_TASK_THRESHOLD = 3;
const LARGE_SCOPE_SPLIT_THRESHOLD = 2;

export function splitSpecToSubTasks(spec: Spec): TaskManifest {
  const subtasks: SubTask[] = [];
  const { scope, plan, io } = spec;

  const allScope = [...scope.inScope];
  const allComponents = plan.components.map((c) => c.name);

  // 按 inScope 条目拆分
  for (const item of allScope) {
    const criteria = io.acceptanceCriteria.filter(
      (ac) =>
        ac.toLowerCase().includes(item.slice(0, 4).toLowerCase()) ||
        item.toLowerCase().includes(ac.slice(0, 4).toLowerCase()),
    );
    subtasks.push({
      id: generateId('sub'),
      description: item,
      relatedScope: [item],
      acceptanceCriteria: criteria.length > 0 ? criteria : io.acceptanceCriteria.slice(0, 2),
      status: 'pending',
      agentNote: '',
      dependencies: [],
      context: buildSubTaskContext(spec, item),
    });
  }

  // 按组件拆分（如果单独组件未在 inScope 中出现）
  for (const comp of allComponents) {
    const alreadyCovered = subtasks.some(
      (s) => s.description.includes(comp) || s.relatedScope.some((rs) => rs.includes(comp)),
    );
    if (!alreadyCovered) {
      subtasks.push({
        id: generateId('sub'),
        description: `实现组件: ${comp}`,
        relatedScope: [comp],
        acceptanceCriteria: io.acceptanceCriteria.slice(0, 2),
        status: 'pending',
        agentNote: '',
        dependencies: [],
        context: buildSubTaskContext(spec, comp),
      });
    }
  }

  // 合并过小的任务（单个词，少于阈值）
  const merged = mergeSmallTasks(subtasks, allScope);

  // 拆分过大的任务（inScope 条目超过 LARGE_SCOPE_SPLIT_THRESHOLD）
  const split = splitLargeTasks(merged);

  // 推断依赖关系
  return inferDependencies({
    taskId: spec.meta.id,
    createdAt: new Date().toISOString(),
    subtasks: split,
  });
}

function buildSubTaskContext(spec: Spec, _relatedItem: string): SubTaskContext {
  return {
    goal: spec.understanding.goal || undefined,
    techStack: spec.plan.techStack.length > 0 ? spec.plan.techStack : undefined,
    architecture: spec.plan.architecture || undefined,
    constraints: spec.scope.constraints.length > 0 ? spec.scope.constraints : undefined,
    outOfScope: spec.scope.outOfScope.length > 0 ? spec.scope.outOfScope : undefined,
  };
}

function mergeSmallTasks(subtasks: SubTask[], allScope: string[]): SubTask[] {
  if (subtasks.length <= SMALL_TASK_THRESHOLD) return subtasks;

  const result: SubTask[] = [];
  let pending: SubTask[] = [];

  for (const st of subtasks) {
    const isSmall = st.description.length < 10 && st.relatedScope.length <= 1;
    if (isSmall && allScope.join(' ').includes(st.description)) {
      pending.push(st);
    } else {
      if (pending.length > 0) {
        result.push(mergeGroup(pending));
        pending = [];
      }
      result.push(st);
    }
  }

  if (pending.length > 0) {
    result.push(mergeGroup(pending));
  }

  return result;
}

function mergeGroup(group: SubTask[]): SubTask {
  return {
    id: generateId('sub'),
    description: group.map((g) => g.description).join(' + '),
    relatedScope: group.flatMap((g) => g.relatedScope),
    acceptanceCriteria: [...new Set(group.flatMap((g) => g.acceptanceCriteria))],
    status: 'pending',
    agentNote: '',
    dependencies: [],
    context: group[0].context,
  };
}

function splitLargeTasks(subtasks: SubTask[]): SubTask[] {
  const result: SubTask[] = [];
  for (const st of subtasks) {
    if (st.relatedScope.length > LARGE_SCOPE_SPLIT_THRESHOLD) {
      for (const scope of st.relatedScope) {
        result.push({
          ...st,
          id: generateId('sub'),
          description: scope,
          relatedScope: [scope],
        });
      }
    } else {
      result.push(st);
    }
  }
  return result;
}

function inferDependencies(manifest: TaskManifest): TaskManifest {
  const apiKeywords = ['API', '接口', '路由', 'Router', 'Controller', '服务', 'Service'];
  const uiKeywords = ['页面', '组件', '前端', 'UI', '界面', '样式'];

  for (const st of manifest.subtasks) {
    const lower = st.description.toLowerCase();

    const hasAPI = apiKeywords.some((k) => lower.includes(k.toLowerCase()));
    const hasUI = uiKeywords.some((k) => lower.includes(k.toLowerCase()));

    if (hasAPI) {
      st.dependencies = manifest.subtasks
        .filter((s) =>
          dbsKeywords.some((k) => s.description.toLowerCase().includes(k.toLowerCase())),
        )
        .map((s) => s.id);
    }
    if (hasUI) {
      st.dependencies = manifest.subtasks
        .filter((s) =>
          apiKeywords.some((k) => s.description.toLowerCase().includes(k.toLowerCase())),
        )
        .map((s) => s.id);
    }
  }

  return manifest;
}

const dbsKeywords = ['数据库', '模型', 'Model', 'Schema', '数据', '存储', 'DB'];
