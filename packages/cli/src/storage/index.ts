import fs from 'node:fs';
import path from 'node:path';
import type {
  Spec,
  StatusResult,
  TaskManifest,
  SubTask,
  SubTaskStatusResult,
} from '@spec-thought-align/shared';
import {
  STORAGE_DIR,
  INPUT_FILE,
  SPEC_FILE,
  STATUS_FILE,
  TASKS_FILE,
  RESULT_FILE,
} from '@spec-thought-align/shared';

/**
 * 确保任务的存储目录存在
 */
export function ensureTaskDir(taskId: string, basePath = '.'): string {
  const dir = path.join(basePath, STORAGE_DIR, taskId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * 写入原始输入
 */
export function writeInput(
  taskId: string,
  input: { request: string; analysis: string; agentType?: string },
  basePath = '.',
): void {
  const dir = ensureTaskDir(taskId, basePath);
  const filePath = path.join(dir, INPUT_FILE);
  const data = {
    request: input.request,
    analysis: input.analysis,
    agentType: input.agentType,
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 读取原始输入
 */
export function readInput(taskId: string, basePath = '.'): Record<string, unknown> {
  const filePath = path.join(basePath, STORAGE_DIR, taskId, INPUT_FILE);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * 写入结构化规约
 */
export function writeSpec(taskId: string, spec: Spec, basePath = '.'): void {
  const dir = ensureTaskDir(taskId, basePath);
  const filePath = path.join(dir, SPEC_FILE);
  fs.writeFileSync(filePath, JSON.stringify(spec, null, 2), 'utf-8');
}

/**
 * 读取规约
 */
export function readSpec(taskId: string, basePath = '.'): Spec {
  const filePath = path.join(basePath, STORAGE_DIR, taskId, SPEC_FILE);
  if (!fs.existsSync(filePath)) {
    throw new Error(`规约不存在: ${taskId}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as Spec;
}

/**
 * 写入状态
 */
export function writeStatus(
  taskId: string,
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed',
  basePath = '.',
): void {
  const dir = ensureTaskDir(taskId, basePath);
  const filePath = path.join(dir, STATUS_FILE);
  const prev = readStatus(taskId, basePath);
  const data = {
    status,
    createdAt: prev.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 读取状态
 */
export function readStatus(
  taskId: string,
  basePath = '.',
): { status: string; createdAt: string; updatedAt: string } {
  const filePath = path.join(basePath, STORAGE_DIR, taskId, STATUS_FILE);
  if (!fs.existsSync(filePath)) {
    return { status: 'pending', createdAt: '', updatedAt: '' };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * 列出所有任务
 */
export function listTasks(basePath = '.'): StatusResult[] {
  const storageDir = path.join(basePath, STORAGE_DIR);
  if (!fs.existsSync(storageDir)) return [];

  const entries = fs.readdirSync(storageDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => {
      const statusData = readStatus(e.name, basePath);
      return {
        id: e.name,
        status: statusData.status as StatusResult['status'],
        createdAt: statusData.createdAt,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * 获取本地存储的基础路径（相对于当前工作目录）
 */
export function getStorageBasePath(): string {
  return process.cwd();
}

/**
 * 检查任务是否存在
 */
export function taskExists(taskId: string, basePath = '.'): boolean {
  const dir = path.join(basePath, STORAGE_DIR, taskId);
  return fs.existsSync(dir);
}

// ---- 任务编排 ----

/** 写入子任务清单 */
export function writeTaskManifest(taskId: string, manifest: TaskManifest, basePath = '.'): void {
  const dir = ensureTaskDir(taskId, basePath);
  fs.writeFileSync(path.join(dir, TASKS_FILE), JSON.stringify(manifest, null, 2), 'utf-8');
}

/** 读取子任务清单 */
export function readTaskManifest(taskId: string, basePath = '.'): TaskManifest | null {
  const filePath = path.join(basePath, STORAGE_DIR, taskId, TASKS_FILE);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/** 更新单个子任务状态 */
export function updateSubTask(
  taskId: string,
  subId: string,
  update: Partial<SubTask>,
  basePath = '.',
): void {
  const manifest = readTaskManifest(taskId, basePath);
  if (!manifest) throw new Error(`任务清单不存在: ${taskId}`);
  const idx = manifest.subtasks.findIndex((s) => s.id === subId);
  if (idx === -1) throw new Error(`子任务不存在: ${subId}`);
  manifest.subtasks[idx] = { ...manifest.subtasks[idx], ...update };
  writeTaskManifest(taskId, manifest, basePath);
}

/** 写入最终结果（用户确认后的完整 spec） */
export function writeResult(taskId: string, spec: Spec, basePath = '.'): void {
  const dir = ensureTaskDir(taskId, basePath);
  const filePath = path.join(dir, RESULT_FILE);
  fs.writeFileSync(filePath, JSON.stringify(spec, null, 2), 'utf-8');
}

/** 读取最终结果 */
export function readResult(taskId: string, basePath = '.'): Spec | null {
  const filePath = path.join(basePath, STORAGE_DIR, taskId, RESULT_FILE);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Spec;
}

/** 获取子任务状态列表 */
export function getSubTaskStatus(taskId: string, basePath = '.'): SubTaskStatusResult[] {
  const manifest = readTaskManifest(taskId, basePath);
  if (!manifest) return [];
  return manifest.subtasks.map((s) => ({
    id: s.id,
    description: s.description,
    status: s.status,
    acceptanceCriteria: s.acceptanceCriteria,
    agentNote: s.agentNote,
    dependencies: s.dependencies,
  }));
}
