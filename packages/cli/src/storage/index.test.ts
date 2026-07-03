import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  ensureTaskDir,
  writeInput,
  readInput,
  writeSpec,
  readSpec,
  writeStatus,
  readStatus,
  listTasks,
  taskExists,
} from './index.js';
import { createEmptySpec } from '@spec-thought-align/shared';

describe('storage', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-thought-align-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('ensureTaskDir', () => {
    it('creates task directory under .spec-thought-align/', () => {
      const dir = ensureTaskDir('test-task', tmpDir);
      expect(fs.existsSync(dir)).toBe(true);
      expect(dir).toContain('.spec-thought-align');
      expect(dir).toContain('test-task');
    });
  });

  describe('writeInput / readInput', () => {
    it('writes and reads input', () => {
      writeInput('task-1', { request: '做个登录页', analysis: '假设用 React' }, tmpDir);
      const input = readInput('task-1', tmpDir);
      expect(input.request).toBe('做个登录页');
      expect(input.analysis).toBe('假设用 React');
    });

    it('stores timestamp', () => {
      writeInput('task-2', { request: 'test', analysis: 'test' }, tmpDir);
      const input = readInput('task-2', tmpDir);
      expect(input.timestamp).toBeDefined();
      expect(() => new Date(input.timestamp as string)).not.toThrow();
    });
  });

  describe('writeSpec / readSpec', () => {
    it('writes and reads spec', () => {
      ensureTaskDir('task-3', tmpDir);
      const spec = createEmptySpec('task-3', '用户需求', 'Agent 分析');
      spec.understanding.goal = '核心目标测试';
      writeSpec('task-3', spec, tmpDir);

      const read = readSpec('task-3', tmpDir);
      expect(read.meta.id).toBe('task-3');
      expect(read.understanding.goal).toBe('核心目标测试');
      expect(read.meta.status).toBe('pending');
    });

    it('throws when spec not found', () => {
      expect(() => readSpec('nonexistent', tmpDir)).toThrow();
    });
  });

  describe('writeStatus / readStatus', () => {
    it('writes and reads status', () => {
      ensureTaskDir('task-4', tmpDir);
      writeStatus('task-4', 'pending', tmpDir);
      const status = readStatus('task-4', tmpDir);
      expect(status.status).toBe('pending');
    });

    it('updates status', () => {
      ensureTaskDir('task-5', tmpDir);
      writeStatus('task-5', 'pending', tmpDir);
      writeStatus('task-5', 'confirmed', tmpDir);
      const status = readStatus('task-5', tmpDir);
      expect(status.status).toBe('confirmed');
    });

    it('returns pending for non-existent task', () => {
      const status = readStatus('ghost', tmpDir);
      expect(status.status).toBe('pending');
    });
  });

  describe('listTasks', () => {
    it('returns empty for no tasks', () => {
      const tasks = listTasks(tmpDir);
      expect(tasks).toEqual([]);
    });

    it('lists all tasks sorted by time', () => {
      writeInput('task-a', { request: 'a', analysis: 'a' }, tmpDir);
      writeStatus('task-a', 'pending', tmpDir);

      writeInput('task-b', { request: 'b', analysis: 'b' }, tmpDir);
      writeStatus('task-b', 'confirmed', tmpDir);

      const tasks = listTasks(tmpDir);
      expect(tasks).toHaveLength(2);
      expect(tasks.map((t) => t.id)).toContain('task-a');
      expect(tasks.map((t) => t.id)).toContain('task-b');
    });
  });

  describe('taskExists', () => {
    it('returns true for existing task', () => {
      writeInput('real-task', { request: 'x', analysis: 'x' }, tmpDir);
      expect(taskExists('real-task', tmpDir)).toBe(true);
    });

    it('returns false for non-existent task', () => {
      expect(taskExists('ghost-task', tmpDir)).toBe(false);
    });
  });
});
